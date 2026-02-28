import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Users, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AdminDeliveryAreasProps {
  tenantId: string;
  disabled?: boolean;
}

interface DeliveryArea {
  id: string;
  name: string;
  pincodes: string[];
  localities: string[];
  delivery_fee: number;
  is_active: boolean;
  created_at: string;
}

interface DeliveryBoyAssignment {
  count: number;
  names: string[];
}

export default function AdminDeliveryAreas({ tenantId, disabled }: AdminDeliveryAreasProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<DeliveryArea | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    name: '',
    pincodes: '',
    localities: '',
    delivery_fee: 0,
  });

  const { data: areas, isLoading } = useQuery({
    queryKey: ['delivery-areas', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_areas')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DeliveryArea[];
    },
  });

  const { data: areaAssignments } = useQuery({
    queryKey: ['delivery-boy-areas-count', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_boy_areas')
        .select('delivery_area_id, delivery_boys(full_name, is_active)')
        .eq('tenant_id', tenantId);
      if (error) throw error;

      const counts: Record<string, DeliveryBoyAssignment> = {};
      data.forEach((item: any) => {
        if (!counts[item.delivery_area_id]) {
          counts[item.delivery_area_id] = { count: 0, names: [] };
        }
        counts[item.delivery_area_id].count++;
        if (item.delivery_boys?.full_name) {
          counts[item.delivery_area_id].names.push(
            `${item.delivery_boys.full_name}${item.delivery_boys.is_active ? '' : ' (inactive)'}`
          );
        }
      });
      return counts;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('delivery_areas').insert({
        tenant_id: tenantId,
        name: data.name,
        delivery_fee: data.delivery_fee,
        pincodes: data.pincodes.split(',').map(p => p.trim()).filter(Boolean),
        localities: data.localities.split(',').map(l => l.trim()).filter(Boolean),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-areas'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('Delivery area created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create area');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { error } = await supabase.from('delivery_areas').update({
        name: data.name,
        delivery_fee: data.delivery_fee,
        pincodes: data.pincodes.split(',').map(p => p.trim()).filter(Boolean),
        localities: data.localities.split(',').map(l => l.trim()).filter(Boolean),
      }).eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-areas'] });
      setIsDialogOpen(false);
      setEditingArea(null);
      resetForm();
      toast.success('Area updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update area');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('delivery_areas').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-areas'] });
      toast.success('Status updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete related delivery_boy_areas entries
      await supabase.from('delivery_boy_areas').delete().eq('delivery_area_id', id);
      const { error } = await supabase.from('delivery_areas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-areas'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-boy-areas-count'] });
      toast.success('Area deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', pincodes: '', localities: '', delivery_fee: 0 });
  };

  const handleEdit = (area: DeliveryArea) => {
    setEditingArea(area);
    setFormData({
      name: area.name,
      pincodes: area.pincodes.join(', '),
      localities: area.localities?.join(', ') || '',
      delivery_fee: area.delivery_fee || 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Area name is required');
      return;
    }
    if (editingArea) {
      updateMutation.mutate({ ...formData, id: editingArea.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (area: DeliveryArea) => {
    if (confirm(`Delete "${area.name}"? This will also remove delivery boy assignments for this area.`)) {
      deleteMutation.mutate(area.id);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Delivery Areas</h1>
          <p className="text-muted-foreground">Manage serviceable areas, pincodes, and delivery boy assignments</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingArea(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button disabled={disabled}>
              <Plus className="w-4 h-4 mr-2" /> Add Area
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingArea ? 'Edit' : 'Add'} Delivery Area</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Area Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., North Zone, Downtown, Sector 21"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Delivery Fee (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={formData.delivery_fee}
                  onChange={(e) => setFormData({ ...formData, delivery_fee: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g., 50"
                  required
                />
                <p className="text-xs text-muted-foreground">Area-specific delivery charge</p>
              </div>
              <div className="space-y-2">
                <Label>Pincodes (comma separated)</Label>
                <Input
                  value={formData.pincodes}
                  onChange={(e) => setFormData({ ...formData, pincodes: e.target.value })}
                  placeholder="e.g., 110001, 110002, 110003"
                />
                <p className="text-xs text-muted-foreground">Enter pincodes that this area services</p>
              </div>
              <div className="space-y-2">
                <Label>Localities (comma separated)</Label>
                <Input
                  value={formData.localities}
                  onChange={(e) => setFormData({ ...formData, localities: e.target.value })}
                  placeholder="e.g., Sector 1, Sector 2, Main Market"
                />
                <p className="text-xs text-muted-foreground">Optional: Add specific localities within this area</p>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingArea ? 'Update' : 'Create'} Area
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {areas?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No delivery areas yet</h3>
            <p className="text-muted-foreground mb-4">Create areas to define serviceable zones and assign delivery boys</p>
            <Button onClick={() => setIsDialogOpen(true)} disabled={disabled}>
              <Plus className="w-4 h-4 mr-2" /> Add First Area
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {areas?.map((area) => {
            const assignment = areaAssignments?.[area.id];
            const isExpanded = expandedCards[area.id];

            return (
              <Card key={area.id} className={!area.is_active ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{area.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={area.is_active ? 'default' : 'secondary'}>
                          {area.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="bg-primary/5">
                          Fee: ₹{area.delivery_fee || 0}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(area)} disabled={disabled}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(area)} disabled={disabled}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pincodes */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Pincodes</p>
                    <div className="flex flex-wrap gap-1">
                      {(area.pincodes || []).slice(0, 5).map((pin, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{pin}</Badge>
                      ))}
                      {(area.pincodes || []).length > 5 && (
                        <Badge variant="outline" className="text-xs">+{area.pincodes.length - 5} more</Badge>
                      )}
                      {(area.pincodes || []).length === 0 && (
                        <span className="text-xs text-muted-foreground">No pincodes</span>
                      )}
                    </div>
                  </div>

                  {/* Localities */}
                  {(area.localities || []).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Localities</p>
                      <div className="flex flex-wrap gap-1">
                        {area.localities.slice(0, 3).map((loc, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{loc}</Badge>
                        ))}
                        {area.localities.length > 3 && (
                          <Badge variant="secondary" className="text-xs">+{area.localities.length - 3} more</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Assigned Delivery Boys */}
                  <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(area.id)}>
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center justify-between w-full text-left">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {assignment?.count || 0} Delivery Boy{(assignment?.count || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {assignment && assignment.count > 0 && (
                          isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </CollapsibleTrigger>
                    {assignment && assignment.count > 0 && (
                      <CollapsibleContent className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {assignment.names.map((name, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </CollapsibleContent>
                    )}
                  </Collapsible>

                  {/* Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      {area.pincodes?.length || 0} pincodes
                    </span>
                    <Switch
                      checked={area.is_active}
                      onCheckedChange={(checked) => toggleStatusMutation.mutate({ id: area.id, is_active: checked })}
                      disabled={disabled}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
