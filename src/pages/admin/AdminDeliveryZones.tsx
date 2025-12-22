import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, MapPin } from 'lucide-react';

interface DeliveryZone {
  id: string;
  name: string;
  pincodes: string[];
  is_active: boolean;
  created_at: string;
}

interface Props {
  tenantId: string;
  disabled?: boolean;
}

export default function AdminDeliveryZones({ tenantId, disabled }: Props) {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryZone | null>(null);
  const [form, setForm] = useState({ name: '', pincodes: '' });
  const [newPincode, setNewPincode] = useState('');

  const fetchZones = async () => {
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setZones(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchZones();
  }, [tenantId]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', pincodes: '' });
    setDialogOpen(true);
  };

  const openEdit = (zone: DeliveryZone) => {
    setEditing(zone);
    setForm({ name: zone.name, pincodes: zone.pincodes.join(', ') });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Zone name is required');
      return;
    }

    const pincodes = form.pincodes.split(',').map(p => p.trim()).filter(Boolean);

    if (editing) {
      const { error } = await supabase
        .from('delivery_zones')
        .update({ name: form.name, pincodes })
        .eq('id', editing.id);
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Zone updated');
        setDialogOpen(false);
        fetchZones();
      }
    } else {
      const { error } = await supabase
        .from('delivery_zones')
        .insert({ tenant_id: tenantId, name: form.name, pincodes });
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Zone created');
        setDialogOpen(false);
        fetchZones();
      }
    }
  };

  const toggleActive = async (zone: DeliveryZone) => {
    const { error } = await supabase
      .from('delivery_zones')
      .update({ is_active: !zone.is_active })
      .eq('id', zone.id);
    
    if (!error) {
      fetchZones();
      toast.success(zone.is_active ? 'Zone deactivated' : 'Zone activated');
    }
  };

  const deleteZone = async (zone: DeliveryZone) => {
    if (!confirm('Delete this zone? This will also remove related slots and availability data.')) return;
    
    const { error } = await supabase.from('delivery_zones').delete().eq('id', zone.id);
    if (!error) {
      toast.success('Zone deleted');
      fetchZones();
    } else {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Delivery Zones</h1>
          <p className="text-muted-foreground">Manage serviceable areas by pincode</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} disabled={disabled}>
              <Plus className="w-4 h-4 mr-2" /> Add Zone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Zone' : 'Create Zone'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Zone Name *</Label>
                <Input 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g., Downtown, Sector 21"
                />
              </div>
              <div>
                <Label>Pincodes (comma separated)</Label>
                <Input 
                  value={form.pincodes} 
                  onChange={e => setForm({...form, pincodes: e.target.value})}
                  placeholder="110001, 110002, 110003"
                />
                <p className="text-xs text-muted-foreground mt-1">Enter pincodes that this zone services</p>
              </div>
              <Button onClick={handleSave} className="w-full">
                {editing ? 'Update Zone' : 'Create Zone'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {zones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No delivery zones yet</h3>
            <p className="text-muted-foreground mb-4">Create zones to define serviceable areas</p>
            <Button onClick={openCreate} disabled={disabled}>
              <Plus className="w-4 h-4 mr-2" /> Add First Zone
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {zones.map(zone => (
            <Card key={zone.id} className={!zone.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{zone.name}</CardTitle>
                    <Badge variant={zone.is_active ? 'default' : 'secondary'} className="mt-1">
                      {zone.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(zone)} disabled={disabled}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteZone(zone)} disabled={disabled}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-4">
                  {zone.pincodes.slice(0, 5).map(pin => (
                    <Badge key={pin} variant="outline">{pin}</Badge>
                  ))}
                  {zone.pincodes.length > 5 && (
                    <Badge variant="outline">+{zone.pincodes.length - 5} more</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{zone.pincodes.length} pincodes</span>
                  <Switch 
                    checked={zone.is_active} 
                    onCheckedChange={() => toggleActive(zone)}
                    disabled={disabled}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
