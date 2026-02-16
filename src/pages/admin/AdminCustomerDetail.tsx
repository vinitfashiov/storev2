import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabaseStore } from '@/integrations/supabase/storeClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ArrowLeft, User, Mail, Phone, ShoppingBag, CreditCard, RotateCcw, Pin, Save, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface CustomerProfile {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
    created_at: string;
}

interface Order {
    id: string;
    order_number: string;
    total: number;
    status: string;
    created_at: string;
}

interface CustomerNote {
    id: string;
    note: string;
    is_pinned: boolean;
    created_at: string;
}

interface CustomerStats {
    totalSpend: number;
    orderCount: number;
    aov: number;
    returnCount: number;
    segments: string[];
}

const formatDate = (dateStr: string | null | undefined, pattern: string = 'MMM d, yyyy') => {
    if (!dateStr) return '-';
    try {
        return format(new Date(dateStr), pattern);
    } catch (e) {
        return '-';
    }
};

export default function AdminCustomerDetail() {
    const { id } = useParams<{ id: string }>();
    const [customer, setCustomer] = useState<CustomerProfile | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [notes, setNotes] = useState<CustomerNote[]>([]);
    const [stats, setStats] = useState<CustomerStats>({ totalSpend: 0, orderCount: 0, aov: 0, returnCount: 0, segments: [] });
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (id) fetchCustomerData();
    }, [id]);

    const fetchCustomerData = async () => {
        setLoading(true);

        try {
            // 1. Fetch Profile
            const { data: profile, error: profileError } = await supabaseStore
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (profileError) console.error('Error fetching profile:', profileError);
            if (profile) setCustomer(profile);

            // 2. Fetch Orders
            const { data: orderData, error: orderError } = await supabaseStore
                .from('orders')
                .select('id, order_number, total, status, created_at')
                .eq('customer_id', id)
                .order('created_at', { ascending: false });

            if (orderError) console.error('Error fetching orders:', orderError);
            const validOrders = orderData || [];
            setOrders(validOrders);

            // 3. Fetch Notes
            const { data: noteData, error: noteError } = await supabaseStore
                .from('customer_notes')
                .select('*')
                .eq('customer_id', id)
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });

            if (noteError) console.error('Error fetching notes:', noteError);
            setNotes(noteData || []);

            // 4. Calculate Stats & Segments
            if (validOrders) {
                const totalSpend = validOrders.reduce((sum, order) => sum + (order.status !== 'cancelled' ? Number(order.total) : 0), 0);
                const orderCount = validOrders.filter(o => o.status !== 'cancelled').length;
                const aov = orderCount > 0 ? totalSpend / orderCount : 0;

                // Check return count
                let returnCount = 0;
                try {
                    const { count } = await supabaseStore
                        .from('return_requests')
                        .select('*', { count: 'exact', head: true })
                        .eq('customer_id', id);
                    returnCount = count || 0;
                } catch (e) {
                    console.error('Error fetching return count', e);
                }

                // Determine Segments
                const segments = [];
                if (totalSpend > 10000) segments.push('VIP');
                if (orderCount === 1) segments.push('New');
                if (orderCount > 5) segments.push('Loyal');

                try {
                    const lastOrderDate = validOrders.length > 0 ? new Date(validOrders[0].created_at) : null;
                    const daysSinceLastOrder = lastOrderDate && !isNaN(lastOrderDate.getTime())
                        ? (new Date().getTime() - lastOrderDate.getTime()) / (1000 * 3600 * 24)
                        : 0;

                    if (orderCount > 0 && daysSinceLastOrder > 90) segments.push('At Risk');
                } catch (e) { /* ignore date parsing error */ }

                setStats({
                    totalSpend,
                    orderCount,
                    aov,
                    returnCount,
                    segments
                });
            }
        } catch (err) {
            console.error('Exception in fetchCustomerData:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        const { error } = await supabaseStore
            .from('customer_notes')
            .insert({
                customer_id: id,
                note: newNote,
                is_pinned: false
            });

        if (error) {
            toast.error('Failed to add note');
        } else {
            toast.success('Note added');
            setNewNote('');
            fetchCustomerData(); // Refresh notes
        }
    };

    const handleTogglePin = async (noteId: string, currentStatus: boolean) => {
        const { error } = await supabaseStore
            .from('customer_notes')
            .update({ is_pinned: !currentStatus })
            .eq('id', noteId);

        if (error) toast.error('Failed to update note');
        else fetchCustomerData();
    };

    const handleDeleteNote = async (noteId: string) => {
        const { error } = await supabaseStore
            .from('customer_notes')
            .delete()
            .eq('id', noteId);

        if (error) toast.error('Failed to delete note');
        else fetchCustomerData();
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading customer profile...</div>;
    if (!customer) return <div className="p-8 text-center text-muted-foreground">Customer not found or access denied.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 flex-wrap">
                <Link to="/dashboard/customers">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{customer.full_name || customer.email || 'Unknown User'}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm flex-wrap">
                        <Mail className="w-3 h-3" /> {customer.email || 'No email'}
                        {customer.phone_number && (
                            <>
                                <span className="hidden sm:inline">•</span>
                                <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> {customer.phone_number}
                                </div>
                            </>
                        )}
                        <span className="hidden sm:inline">•</span>
                        <span>Joined {formatDate(customer.created_at, 'MMM yyyy')}</span>
                    </div>
                </div>
                <div className="ml-auto flex gap-2">
                    {stats.segments.map(seg => (
                        <Badge key={seg} variant="secondary" className="capitalize">
                            {seg}
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{stats.totalSpend.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Orders</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.orderCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{stats.aov.toFixed(0)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Returns</CardTitle>
                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.returnCount}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {notes.length > 0 ? (
                                    <div className="space-y-4">
                                        {notes.slice(0, 3).map(note => (
                                            <div key={note.id} className="border-b last:border-0 pb-3 last:pb-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs text-muted-foreground">{formatDate(note.created_at, 'MMM d, h:mm a')}</span>
                                                    {note.is_pinned && <Pin className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                                </div>
                                                <p className="text-sm">{note.note}</p>
                                            </div>
                                        ))}
                                        <Button variant="link" size="sm" className="px-0" onClick={() => setActiveTab('notes')}>View all notes</Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No notes yet. Add one in the Notes tab.</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Last Order</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {orders.length > 0 ? (
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="font-medium">#{orders[0].order_number}</span>
                                            <Badge variant="outline">{orders[0].status}</Badge>
                                        </div>
                                        <div className="text-2xl font-bold">₹{orders[0].total}</div>
                                        <div className="text-sm text-muted-foreground">{formatDate(orders[0].created_at, 'PP p')}</div>
                                        <Link to={`/dashboard/orders/${orders[0].id}`}>
                                            <Button variant="outline" size="sm" className="w-full mt-4">View Order</Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No orders yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="orders">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">#{order.order_number}</TableCell>
                                            <TableCell>{formatDate(order.created_at, 'MMM d, yyyy')}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{order.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">₹{order.total}</TableCell>
                                            <TableCell className="text-right">
                                                <Link to={`/dashboard/orders/${order.id}`}>
                                                    <Button variant="ghost" size="sm">View</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notes">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Notes</CardTitle>
                            <CardDescription>Internal notes about this customer. Only visible to staff.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex gap-2">
                                <Textarea
                                    placeholder="Add a note..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    className="resize-none"
                                />
                                <Button onClick={handleAddNote} className="self-end" size="icon">
                                    <Save className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {notes.map(note => (
                                    <div key={note.id} className={`p-4 rounded-lg border ${note.is_pinned ? 'bg-yellow-50 border-yellow-200' : 'bg-card'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    {formatDate(note.created_at, 'PP p')}
                                                </span>
                                                {note.is_pinned && <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">Pinned</Badge>}
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleTogglePin(note.id, note.is_pinned)}>
                                                    <Pin className={`w-3 h-3 ${note.is_pinned ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteNote(note.id)}>
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
