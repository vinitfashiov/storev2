import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Check, Save, X, Search, AlertTriangle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface StockAudit {
    id: string;
    status: 'draft' | 'completed' | 'cancelled';
    notes: string | null;
    created_at: string;
    completed_at: string | null;
}

interface AuditItem {
    id: string;
    product_id: string;
    variant_id: string | null;
    product_name: string;
    variant_name: string | null;
    expected_qty: number;
    counted_qty: number | null; // Null means not counted yet
    cost_price: number;
}

interface AdminStockCountProps {
    tenantId: string;
}

export default function AdminStockCount({ tenantId }: AdminStockCountProps) {
    const [audits, setAudits] = useState<StockAudit[]>([]);
    const [activeAudit, setActiveAudit] = useState<StockAudit | null>(null);
    const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewAuditDialog, setShowNewAuditDialog] = useState(false);
    const [newAuditNotes, setNewAuditNotes] = useState('');

    useEffect(() => {
        fetchAudits();
    }, [tenantId]);

    async function fetchAudits() {
        const { data, error } = await supabase
            .from('stock_audits')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setAudits(data as StockAudit[]);
            // Check if there's an active draft
            const draft = data.find(a => a.status === 'draft');
            if (draft) {
                setActiveAudit(draft as StockAudit);
                fetchAuditItems(draft.id);
            }
        }
        setLoading(false);
    }

    async function fetchAuditItems(auditId: string) {
        // First, get the audit items
        const { data: items, error } = await supabase
            .from('stock_audit_items')
            .select(`
        *,
        product:products(name),
        variant:product_variants(sku)
      `)
            .eq('audit_id', auditId);

        if (error || !items) return;

        // Transform to friendly format
        const formattedItems: AuditItem[] = items.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_name: item.product?.name || 'Unknown Product',
            variant_name: item.variant?.sku || (item.variant_id ? 'Variant' : null),
            expected_qty: item.expected_qty,
            counted_qty: item.counted_qty,
            cost_price: item.cost_price
        }));

        setAuditItems(formattedItems);
    }

    async function createAudit() {
        setLoading(true);

        // 1. Create Audit Record
        const { data: audit, error: auditError } = await supabase
            .from('stock_audits')
            .insert({
                tenant_id: tenantId,
                status: 'draft',
                notes: newAuditNotes || `Stocktake - ${format(new Date(), 'PP')}`
            })
            .select()
            .single();

        if (auditError || !audit) {
            toast.error('Failed to start stocktake');
            setLoading(false);
            return;
        }

        // 2. Snapshot current inventory
        // Fetch all products
        const { data: products } = await supabase
            .from('products')
            .select('id, stock_qty, price, has_variants')
            .eq('tenant_id', tenantId)
            .eq('is_active', true);

        // Fetch all variants
        const { data: variants } = await supabase
            .from('product_variants')
            .select('id, product_id, stock_qty, price')
            .eq('is_active', true);

        const itemsToInsert: any[] = [];

        // Add simple products
        products?.filter((p: any) => !p.has_variants).forEach((p: any) => {
            itemsToInsert.push({
                audit_id: audit.id,
                product_id: p.id,
                variant_id: null,
                expected_qty: p.stock_qty,
                counted_qty: null,
                cost_price: p.price // Ideally this should be cost price, using price as fallback
            });
        });

        // Add variants
        variants?.forEach((v: any) => {
            itemsToInsert.push({
                audit_id: audit.id,
                product_id: v.product_id,
                variant_id: v.id,
                expected_qty: v.stock_qty,
                counted_qty: null,
                cost_price: v.price
            });
        });

        if (itemsToInsert.length > 0) {
            const { error: itemsError } = await supabase
                .from('stock_audit_items')
                .insert(itemsToInsert);

            if (itemsError) {
                toast.error('Failed to snapshot inventory');
                // clean up
                await supabase.from('stock_audits').delete().eq('id', audit.id);
                setLoading(false);
                return;
            }
        }

        toast.success('Stocktake started');
        setShowNewAuditDialog(false);
        setNewAuditNotes('');
        fetchAudits();
        // It will auto-select the new draft due to fetchAudits logic
    }

    async function updateCount(itemId: string, qty: number) {
        const { error } = await supabase
            .from('stock_audit_items')
            .update({ counted_qty: qty })
            .eq('id', itemId);

        if (error) {
            toast.error('Failed to save count');
            return;
        }

        // Update local state optimistic
        setAuditItems(auditItems.map(i => i.id === itemId ? { ...i, counted_qty: qty } : i));
    }

    async function finalizeAudit() {
        if (!activeAudit) return;

        const uncounted = auditItems.filter(i => i.counted_qty === null);
        if (uncounted.length > 0) {
            if (!confirm(`You have ${uncounted.length} uncounted items. They will be assumed as correct (active stock). Continue?`)) {
                return;
            }
        }

        setLoading(true);

        // Process variances
        const variances = auditItems.filter(i => i.counted_qty !== null && i.counted_qty !== i.expected_qty);

        for (const item of variances) {
            const diff = (item.counted_qty || 0) - item.expected_qty;
            const notes = `Stocktake Adjustment (${activeAudit.notes})`;

            // 1. Create movement
            await supabase.from('inventory_movements').insert({
                tenant_id: tenantId,
                product_id: item.product_id,
                variant_id: item.variant_id,
                movement_type: 'count_correction', // Should be in enum or string
                quantity: diff,
                reference_id: activeAudit.id,
                notes: notes
            });

            // 2. Update actual stock
            if (item.variant_id) {
                await supabase.from('product_variants')
                    .update({ stock_qty: item.counted_qty })
                    .eq('id', item.variant_id);
            } else {
                await supabase.from('products')
                    .update({ stock_qty: item.counted_qty })
                    .eq('id', item.product_id);
            }
        }

        // Mark audit complete
        await supabase
            .from('stock_audits')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('id', activeAudit.id);

        toast.success(`Stocktake complete. ${variances.length} adjustments made.`);
        setActiveAudit(null);
        fetchAudits();
        setLoading(false);
    }

    const filteredItems = auditItems.filter(item =>
        item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.variant_name && item.variant_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const totalVariances = auditItems.filter(i => i.counted_qty !== null && i.counted_qty !== i.expected_qty).length;
    const progress = Math.round((auditItems.filter(i => i.counted_qty !== null).length / (auditItems.length || 1)) * 100);

    if (loading && !activeAudit) {
        return <div className="p-8 text-center text-muted-foreground">Loading stock data...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-display font-bold">Stock Audits</h1>
                {!activeAudit && (
                    <Dialog open={showNewAuditDialog} onOpenChange={setShowNewAuditDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Start New Stocktake
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Start New Audits Settings</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Session Name / Notes</label>
                                    <Input
                                        value={newAuditNotes}
                                        onChange={(e) => setNewAuditNotes(e.target.value)}
                                        placeholder={`e.g. Audit ${format(new Date(), 'MMM yyyy')}`}
                                    />
                                </div>
                                <Button onClick={createAudit} className="w-full">Start Counting</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {activeAudit ? (
                <div className="space-y-6">
                    <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="default" className="bg-primary animate-pulse">In Progress</Badge>
                                        <h2 className="text-lg font-bold">{activeAudit.notes || 'Untitled Audit'}</h2>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Started {format(new Date(activeAudit.created_at), 'PPP p')}
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="text-right">
                                        <div className="text-2xl font-bold">{progress}%</div>
                                        <div className="text-xs text-muted-foreground">Completed</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-orange-600">{totalVariances}</div>
                                        <div className="text-xs text-muted-foreground">Variances</div>
                                    </div>
                                    <div className="pl-4 border-l">
                                        <Button onClick={finalizeAudit} disabled={loading}>
                                            <Check className="h-4 w-4 mr-2" />
                                            Finalize & Adjust Stock
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search products to count..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>System Stock</TableHead>
                                        <TableHead className="w-[150px]">Physical Count</TableHead>
                                        <TableHead className="text-right">Variance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.map((item) => {
                                        const hasVariance = item.counted_qty !== null && item.counted_qty !== item.expected_qty;
                                        const variance = item.counted_qty !== null ? item.counted_qty - item.expected_qty : 0;

                                        return (
                                            <TableRow key={item.id} className={hasVariance ? 'bg-orange-50/50' : ''}>
                                                <TableCell>
                                                    <div className="font-medium">{item.product_name}</div>
                                                    {item.variant_name && (
                                                        <div className="text-sm text-muted-foreground">{item.variant_name}</div>
                                                    )}
                                                </TableCell>
                                                <TableCell>{item.expected_qty}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        className={`w-24 ${hasVariance ? 'border-orange-300' : ''}`}
                                                        placeholder="-"
                                                        value={item.counted_qty === null ? '' : item.counted_qty}
                                                        onChange={(e) => {
                                                            const val = e.target.value === '' ? null : parseInt(e.target.value);
                                                            updateCount(item.id, val === null ? 0 : val);
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {item.counted_qty !== null && variance !== 0 && (
                                                        <span className={`font-bold ${variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {variance > 0 ? '+' : ''}{variance}
                                                        </span>
                                                    )}
                                                    {item.counted_qty !== null && variance === 0 && (
                                                        <Check className="h-4 w-4 text-green-500 ml-auto" />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {filteredItems.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                No products match your search
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {audits.length === 0 ? (
                        <Card className="col-span-full py-12">
                            <div className="text-center">
                                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-medium mb-2">No Audits Yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Start your first stocktake to reconcile your inventory.
                                </p>
                                <Button onClick={() => setShowNewAuditDialog(true)}>
                                    Start New Stocktake
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        audits.map(audit => (
                            <Card key={audit.id} className="hover:border-primary/50 transition-colors">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base truncate pr-4">
                                            {audit.notes || 'Untitled Audit'}
                                        </CardTitle>
                                        <Badge variant={audit.status === 'completed' ? 'secondary' : 'default'}>
                                            {audit.status}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {format(new Date(audit.created_at), 'PPP')}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" className="w-full" disabled>
                                        View Details <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
