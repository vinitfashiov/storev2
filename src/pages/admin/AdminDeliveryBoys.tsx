import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, MapPin, Wallet } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type DeliveryPaymentType = Database['public']['Enums']['delivery_payment_type'];

interface AdminDeliveryBoysProps {
  tenantId: string;
}

interface DeliveryBoy {
  id: string;
  full_name: string;
  mobile_number: string;
  payment_type: DeliveryPaymentType;
  monthly_salary: number;
  per_order_amount: number;
  percentage_value: number;
  account_holder_name: string | null;
  account_number: string | null;
  upi_id: string | null;
  ifsc_code: string | null;
  is_active: boolean;
  wallet_balance: number;
  total_earned: number;
  total_paid: number;
  created_at: string;
}

interface DeliveryArea {
  id: string;
  name: string;
}

export default function AdminDeliveryBoys({ tenantId }: AdminDeliveryBoysProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAreaDialogOpen, setIsAreaDialogOpen] = useState(false);
  const [editingBoy, setEditingBoy] = useState<DeliveryBoy | null>(null);
  const [selectedBoyForAreas, setSelectedBoyForAreas] = useState<DeliveryBoy | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    mobile_number: '',
    password: '',
    payment_type: 'fixed_per_order' as DeliveryPaymentType,
    monthly_salary: 0,
    per_order_amount: 50,
    percentage_value: 0,
    account_holder_name: '',
    account_number: '',
    upi_id: '',
    ifsc_code: '',
  });

  const { data: deliveryBoys, isLoading } = useQuery({
    queryKey: ['delivery-boys', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_boys')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DeliveryBoy[];
    },
  });

  const { data: areas } = useQuery({
    queryKey: ['delivery-areas', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_areas')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);
      if (error) throw error;
      return data as DeliveryArea[];
    },
  });

  const { data: boyAreas } = useQuery({
    queryKey: ['delivery-boy-areas', selectedBoyForAreas?.id],
    queryFn: async () => {
      if (!selectedBoyForAreas) return [];
      const { data, error } = await supabase
        .from('delivery_boy_areas')
        .select('delivery_area_id')
        .eq('delivery_boy_id', selectedBoyForAreas.id);
      if (error) throw error;
      return data.map(d => d.delivery_area_id);
    },
    enabled: !!selectedBoyForAreas,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Use secure edge function with bcrypt password hashing
      const { data: result, error } = await supabase.functions.invoke('delivery-boy-manage', {
        body: {
          action: 'create',
          data: {
            full_name: data.full_name,
            mobile_number: data.mobile_number,
            password: data.password,
            payment_type: data.payment_type,
            monthly_salary: data.monthly_salary,
            per_order_amount: data.per_order_amount,
            percentage_value: data.percentage_value,
            account_holder_name: data.account_holder_name || null,
            account_number: data.account_number || null,
            upi_id: data.upi_id || null,
            ifsc_code: data.ifsc_code || null,
          }
        }
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-boys'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('Delivery boy added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add delivery boy');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      // Use secure edge function with bcrypt password hashing
      const { data: result, error } = await supabase.functions.invoke('delivery-boy-manage', {
        body: {
          action: 'update',
          data: {
            id: data.id,
            full_name: data.full_name,
            mobile_number: data.mobile_number,
            password: data.password || undefined,
            payment_type: data.payment_type,
            monthly_salary: data.monthly_salary,
            per_order_amount: data.per_order_amount,
            percentage_value: data.percentage_value,
            account_holder_name: data.account_holder_name || null,
            account_number: data.account_number || null,
            upi_id: data.upi_id || null,
            ifsc_code: data.ifsc_code || null,
          }
        }
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-boys'] });
      setIsDialogOpen(false);
      setEditingBoy(null);
      resetForm();
      toast.success('Delivery boy updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update delivery boy');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('delivery_boys').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-boys'] });
      toast.success('Status updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('delivery_boys').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-boys'] });
      toast.success('Delivery boy deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete');
    },
  });

  const updateAreasMutation = useMutation({
    mutationFn: async ({ boyId, areaIds }: { boyId: string; areaIds: string[] }) => {
      // Delete existing assignments
      await supabase.from('delivery_boy_areas').delete().eq('delivery_boy_id', boyId);
      // Insert new assignments
      if (areaIds.length > 0) {
        const { error } = await supabase.from('delivery_boy_areas').insert(
          areaIds.map(areaId => ({
            tenant_id: tenantId,
            delivery_boy_id: boyId,
            delivery_area_id: areaId,
          }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-boy-areas'] });
      setIsAreaDialogOpen(false);
      setSelectedBoyForAreas(null);
      toast.success('Areas updated');
    },
  });

  const resetForm = () => {
    setFormData({
      full_name: '',
      mobile_number: '',
      password: '',
      payment_type: 'fixed_per_order',
      monthly_salary: 0,
      per_order_amount: 50,
      percentage_value: 0,
      account_holder_name: '',
      account_number: '',
      upi_id: '',
      ifsc_code: '',
    });
  };

  const handleEdit = (boy: DeliveryBoy) => {
    setEditingBoy(boy);
    setFormData({
      full_name: boy.full_name,
      mobile_number: boy.mobile_number,
      password: '',
      payment_type: boy.payment_type,
      monthly_salary: boy.monthly_salary,
      per_order_amount: boy.per_order_amount,
      percentage_value: boy.percentage_value,
      account_holder_name: boy.account_holder_name || '',
      account_number: boy.account_number || '',
      upi_id: boy.upi_id || '',
      ifsc_code: boy.ifsc_code || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBoy) {
      updateMutation.mutate({ ...formData, id: editingBoy.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);

  const openAreaDialog = (boy: DeliveryBoy) => {
    setSelectedBoyForAreas(boy);
    setIsAreaDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Delivery Boys</h1>
          <p className="text-muted-foreground">Manage your delivery personnel</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingBoy(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Delivery Boy</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBoy ? 'Edit' : 'Add'} Delivery Boy</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number *</Label>
                  <Input
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{editingBoy ? 'New Password (leave blank to keep current)' : 'Password *'}</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingBoy}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select
                  value={formData.payment_type}
                  onValueChange={(v) => setFormData({ ...formData, payment_type: v as DeliveryPaymentType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly_salary">Monthly Salary</SelectItem>
                    <SelectItem value="fixed_per_order">Fixed Per Order</SelectItem>
                    <SelectItem value="percentage_per_order">Percentage Per Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.payment_type === 'monthly_salary' && (
                <div className="space-y-2">
                  <Label>Monthly Salary Amount (₹)</Label>
                  <Input
                    type="number"
                    value={formData.monthly_salary}
                    onChange={(e) => setFormData({ ...formData, monthly_salary: Number(e.target.value) })}
                  />
                </div>
              )}
              {formData.payment_type === 'fixed_per_order' && (
                <div className="space-y-2">
                  <Label>Per Order Amount (₹)</Label>
                  <Input
                    type="number"
                    value={formData.per_order_amount}
                    onChange={(e) => setFormData({ ...formData, per_order_amount: Number(e.target.value) })}
                  />
                </div>
              )}
              {formData.payment_type === 'percentage_per_order' && (
                <div className="space-y-2">
                  <Label>Percentage Value (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.percentage_value}
                    onChange={(e) => setFormData({ ...formData, percentage_value: Number(e.target.value) })}
                  />
                </div>
              )}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Bank / UPI Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Account Holder Name</Label>
                    <Input
                      value={formData.account_holder_name}
                      onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number / UPI ID</Label>
                    <Input
                      value={formData.account_number || formData.upi_id}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label>IFSC Code (optional)</Label>
                  <Input
                    value={formData.ifsc_code}
                    onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingBoy ? 'Update' : 'Add'} Delivery Boy
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Payment Type</TableHead>
                <TableHead>Earnings</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : deliveryBoys?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No delivery boys added</TableCell></TableRow>
              ) : (
                deliveryBoys?.map((boy) => (
                  <TableRow key={boy.id}>
                    <TableCell className="font-medium">{boy.full_name}</TableCell>
                    <TableCell>{boy.mobile_number}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {boy.payment_type === 'monthly_salary' && `₹${boy.monthly_salary}/mo`}
                        {boy.payment_type === 'fixed_per_order' && `₹${boy.per_order_amount}/order`}
                        {boy.payment_type === 'percentage_per_order' && `${boy.percentage_value}%/order`}
                      </Badge>
                    </TableCell>
                    <TableCell>₹{boy.total_earned.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">₹{boy.wallet_balance.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={boy.is_active}
                        onCheckedChange={(checked) => toggleStatusMutation.mutate({ id: boy.id, is_active: checked })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openAreaDialog(boy)} title="Assign Areas">
                          <MapPin className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(boy)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(boy.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Area Assignment Dialog */}
      <Dialog open={isAreaDialogOpen} onOpenChange={(open) => {
        setIsAreaDialogOpen(open);
        if (!open) setSelectedBoyForAreas(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Areas to {selectedBoyForAreas?.full_name}</DialogTitle>
          </DialogHeader>
          {areas && boyAreas !== undefined && (
            <AreaSelector
              areas={areas}
              selectedIds={boyAreas}
              onSave={(areaIds) => {
                if (selectedBoyForAreas) {
                  updateAreasMutation.mutate({ boyId: selectedBoyForAreas.id, areaIds });
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AreaSelector({ areas, selectedIds, onSave }: { areas: DeliveryArea[]; selectedIds: string[]; onSave: (ids: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>(selectedIds);

  const toggle = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {areas.length === 0 ? (
          <p className="text-muted-foreground text-sm">No areas created yet. Create areas first.</p>
        ) : (
          areas.map((area) => (
            <label key={area.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(area.id)}
                onChange={() => toggle(area.id)}
                className="w-4 h-4"
              />
              <span>{area.name}</span>
            </label>
          ))
        )}
      </div>
      <Button onClick={() => onSave(selected)} className="w-full">Save Area Assignments</Button>
    </div>
  );
}
