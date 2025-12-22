import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Clock } from 'lucide-react';

interface DeliverySlot {
  id: string;
  zone_id: string | null;
  label: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface DeliveryZone {
  id: string;
  name: string;
}

interface Props {
  tenantId: string;
  disabled?: boolean;
}

export default function AdminDeliverySlots({ tenantId, disabled }: Props) {
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DeliverySlot | null>(null);
  const [form, setForm] = useState({ label: '', start_time: '', end_time: '', zone_id: '' });

  const fetchData = async () => {
    const [slotsRes, zonesRes] = await Promise.all([
      supabase.from('delivery_slots').select('*').eq('tenant_id', tenantId).order('start_time'),
      supabase.from('delivery_zones').select('id, name').eq('tenant_id', tenantId).eq('is_active', true)
    ]);
    
    if (slotsRes.data) setSlots(slotsRes.data);
    if (zonesRes.data) setZones(zonesRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const openCreate = () => {
    setEditing(null);
    setForm({ label: '', start_time: '09:00', end_time: '11:00', zone_id: '' });
    setDialogOpen(true);
  };

  const openEdit = (slot: DeliverySlot) => {
    setEditing(slot);
    setForm({ 
      label: slot.label, 
      start_time: slot.start_time.slice(0, 5), 
      end_time: slot.end_time.slice(0, 5), 
      zone_id: slot.zone_id || '' 
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.label.trim() || !form.start_time || !form.end_time) {
      toast.error('Label and times are required');
      return;
    }

    const data = {
      label: form.label,
      start_time: form.start_time,
      end_time: form.end_time,
      zone_id: form.zone_id || null
    };

    if (editing) {
      const { error } = await supabase.from('delivery_slots').update(data).eq('id', editing.id);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Slot updated');
        setDialogOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase.from('delivery_slots').insert({ ...data, tenant_id: tenantId });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Slot created');
        setDialogOpen(false);
        fetchData();
      }
    }
  };

  const toggleActive = async (slot: DeliverySlot) => {
    const { error } = await supabase.from('delivery_slots').update({ is_active: !slot.is_active }).eq('id', slot.id);
    if (!error) {
      fetchData();
      toast.success(slot.is_active ? 'Slot deactivated' : 'Slot activated');
    }
  };

  const deleteSlot = async (slot: DeliverySlot) => {
    if (!confirm('Delete this slot?')) return;
    const { error } = await supabase.from('delivery_slots').delete().eq('id', slot.id);
    if (!error) {
      toast.success('Slot deleted');
      fetchData();
    } else {
      toast.error(error.message);
    }
  };

  const getZoneName = (zoneId: string | null) => {
    if (!zoneId) return 'All Zones';
    const zone = zones.find(z => z.id === zoneId);
    return zone?.name || 'Unknown';
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Delivery Slots</h1>
          <p className="text-muted-foreground">Define time slots for scheduled deliveries</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} disabled={disabled}>
              <Plus className="w-4 h-4 mr-2" /> Add Slot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Slot' : 'Create Slot'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Label *</Label>
                <Input 
                  value={form.label} 
                  onChange={e => setForm({...form, label: e.target.value})}
                  placeholder="e.g., 9:00 AM - 11:00 AM"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time *</Label>
                  <Input 
                    type="time"
                    value={form.start_time} 
                    onChange={e => setForm({...form, start_time: e.target.value})}
                  />
                </div>
                <div>
                  <Label>End Time *</Label>
                  <Input 
                    type="time"
                    value={form.end_time} 
                    onChange={e => setForm({...form, end_time: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Zone (optional)</Label>
                <Select
                  value={form.zone_id || "__all__"}
                  onValueChange={(v) => setForm({ ...form, zone_id: v === "__all__" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All zones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Zones</SelectItem>
                    {zones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Leave empty to apply to all zones</p>
              </div>
              <Button onClick={handleSave} className="w-full">
                {editing ? 'Update Slot' : 'Create Slot'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {slots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No delivery slots yet</h3>
            <p className="text-muted-foreground mb-4">Create slots for scheduled deliveries</p>
            <Button onClick={openCreate} disabled={disabled}>
              <Plus className="w-4 h-4 mr-2" /> Add First Slot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slots.map(slot => (
                <TableRow key={slot.id} className={!slot.is_active ? 'opacity-60' : ''}>
                  <TableCell className="font-medium">{slot.label}</TableCell>
                  <TableCell>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getZoneName(slot.zone_id)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch 
                      checked={slot.is_active} 
                      onCheckedChange={() => toggleActive(slot)}
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(slot)} disabled={disabled}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteSlot(slot)} disabled={disabled}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
