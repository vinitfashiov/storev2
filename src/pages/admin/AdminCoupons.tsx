import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Ticket } from 'lucide-react';
import { format } from 'date-fns';

interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_cart_amount: number;
  max_discount_amount: number | null;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

interface AdminCouponsProps {
  tenantId: string;
  disabled?: boolean;
}

export default function AdminCoupons({ tenantId, disabled }: AdminCouponsProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState({
    code: '',
    type: 'percent' as 'percent' | 'fixed',
    value: '',
    min_cart_amount: '0',
    max_discount_amount: '',
    starts_at: '',
    ends_at: '',
    usage_limit: '',
    is_active: true
  });

  const fetchCoupons = async () => {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false }) as { data: Coupon[] | null };
    setCoupons(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, [tenantId]);

  const resetForm = () => {
    setEditingCoupon(null);
    setForm({
      code: '',
      type: 'percent',
      value: '',
      min_cart_amount: '0',
      max_discount_amount: '',
      starts_at: '',
      ends_at: '',
      usage_limit: '',
      is_active: true
    });
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value.toString(),
      min_cart_amount: coupon.min_cart_amount.toString(),
      max_discount_amount: coupon.max_discount_amount?.toString() || '',
      starts_at: coupon.starts_at ? coupon.starts_at.slice(0, 16) : '',
      ends_at: coupon.ends_at ? coupon.ends_at.slice(0, 16) : '',
      usage_limit: coupon.usage_limit?.toString() || '',
      is_active: coupon.is_active
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    const couponData = {
      tenant_id: tenantId,
      code: form.code.toUpperCase().trim(),
      type: form.type,
      value: parseFloat(form.value) || 0,
      min_cart_amount: parseFloat(form.min_cart_amount) || 0,
      max_discount_amount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : null,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      is_active: form.is_active
    };

    try {
      if (editingCoupon) {
        const { error } = await supabase.from('coupons').update(couponData).eq('id', editingCoupon.id);
        if (error) throw error;
        toast.success('Coupon updated');
      } else {
        const { error } = await supabase.from('coupons').insert(couponData);
        if (error) throw error;
        toast.success('Coupon created');
      }

      setDialogOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.message.includes('duplicate') ? 'Coupon code already exists' : 'Failed to save coupon');
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    if (disabled) return;
    const { error } = await supabase.from('coupons').update({ is_active: !coupon.is_active }).eq('id', coupon.id);
    if (error) { toast.error('Failed to update coupon'); return; }
    toast.success(coupon.is_active ? 'Coupon deactivated' : 'Coupon activated');
    fetchCoupons();
  };

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.is_active) return { label: 'Inactive', variant: 'secondary' as const };
    const now = new Date();
    if (coupon.starts_at && new Date(coupon.starts_at) > now) return { label: 'Scheduled', variant: 'outline' as const };
    if (coupon.ends_at && new Date(coupon.ends_at) < now) return { label: 'Expired', variant: 'destructive' as const };
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) return { label: 'Limit Reached', variant: 'destructive' as const };
    return { label: 'Active', variant: 'default' as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Coupons</h1>
          <p className="text-muted-foreground">Create discount codes for customers</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} disabled={disabled}>
          <Plus className="w-4 h-4 mr-2" /> Add Coupon
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Add Coupon'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Code *</Label>
              <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="SAVE10" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v: 'percent' | 'fixed') => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Value *</Label>
                <Input type="number" step="0.01" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Cart Amount</Label>
                <Input type="number" step="0.01" value={form.min_cart_amount} onChange={e => setForm({ ...form, min_cart_amount: e.target.value })} />
              </div>
              <div>
                <Label>Max Discount</Label>
                <Input type="number" step="0.01" value={form.max_discount_amount} onChange={e => setForm({ ...form, max_discount_amount: e.target.value })} placeholder="No limit" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Starts At</Label>
                <Input type="datetime-local" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} />
              </div>
              <div>
                <Label>Ends At</Label>
                <Input type="datetime-local" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Usage Limit</Label>
              <Input type="number" value={form.usage_limit} onChange={e => setForm({ ...form, usage_limit: e.target.value })} placeholder="Unlimited" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
            <Button type="submit" className="w-full" disabled={disabled}>{editingCoupon ? 'Update' : 'Create'} Coupon</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : coupons.length === 0 ? (
            <div className="p-12 text-center">
              <Ticket className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium mb-2">No coupons yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create discount codes for your customers</p>
              <Button onClick={() => { resetForm(); setDialogOpen(true); }} disabled={disabled}>
                <Plus className="w-4 h-4 mr-2" /> Add Coupon
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min Cart</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map(coupon => {
                  const status = getCouponStatus(coupon);
                  return (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
                      <TableCell>
                        {coupon.type === 'percent' ? `${coupon.value}%` : `₹${coupon.value}`}
                        {coupon.max_discount_amount && coupon.type === 'percent' && (
                          <span className="text-muted-foreground text-xs"> (max ₹{coupon.max_discount_amount})</span>
                        )}
                      </TableCell>
                      <TableCell>₹{coupon.min_cart_amount}</TableCell>
                      <TableCell>
                        {coupon.used_count}{coupon.usage_limit ? `/${coupon.usage_limit}` : ''}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(coupon)} disabled={disabled}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => toggleActive(coupon)} disabled={disabled}>
                          {coupon.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
