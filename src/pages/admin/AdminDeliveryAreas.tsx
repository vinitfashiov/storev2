import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';

interface AdminDeliveryAreasProps {
  tenantId: string;
}

interface DeliveryArea {
  id: string;
  name: string;
  pincodes: string[];
  localities: string[];
  is_active: boolean;
  created_at: string;
}

export default function AdminDeliveryAreas({ tenantId }: AdminDeliveryAreasProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<DeliveryArea | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    pincodes: '',
    localities: '',
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
        .select('delivery_area_id, delivery_boys(full_name)')
        .eq('tenant_id', tenantId);
      if (error) throw error;
      
      const counts: Record<string, { count: number; names: string[] }> = {};
      data.forEach((item: any) => {
        if (!counts[item.delivery_area_id]) {
          counts[item.delivery_area_id] = { count: 0, names: [] };
        }
        counts[item.delivery_area_id].count++;
        if (item.delivery_boys?.full_name) {
          counts[item.delivery_area_id].names.push(item.delivery_boys.full_name);
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
      const { error } = await supabase.from('delivery_areas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-areas'] });
      toast.success('Area deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', pincodes: '', localities: '' });
  };

  const handleEdit = (area: DeliveryArea) => {
    setEditingArea(area);
    setFormData({
      name: area.name,
      pincodes: area.pincodes.join(', '),
      localities: area.localities?.join(', ') || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingArea) {
      updateMutation.mutate({ ...formData, id: editingArea.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Delivery Areas</h1>
          <p className="text-muted-foreground">Define delivery zones by pincodes or localities</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingArea(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Area</Button>
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
                  placeholder="e.g., North Zone, Downtown"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Pincodes (comma separated)</Label>
                <Input
                  value={formData.pincodes}
                  onChange={(e) => setFormData({ ...formData, pincodes: e.target.value })}
                  placeholder="e.g., 110001, 110002, 110003"
                />
              </div>
              <div className="space-y-2">
                <Label>Localities (comma separated)</Label>
                <Input
                  value={formData.localities}
                  onChange={(e) => setFormData({ ...formData, localities: e.target.value })}
                  placeholder="e.g., Sector 1, Sector 2"
                />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingArea ? 'Update' : 'Create'} Area
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
                <TableHead>Area Name</TableHead>
                <TableHead>Pincodes</TableHead>
                <TableHead>Localities</TableHead>
                <TableHead>Assigned Boys</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : areas?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No delivery areas created</TableCell></TableRow>
              ) : (
                areas?.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-medium">{area.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(area.pincodes || []).slice(0, 3).map((pin, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{pin}</Badge>
                        ))}
                        {(area.pincodes || []).length > 3 && (
                          <Badge variant="outline" className="text-xs">+{area.pincodes.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(area.localities || []).slice(0, 2).map((loc, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{loc}</Badge>
                        ))}
                        {(area.localities || []).length > 2 && (
                          <Badge variant="outline" className="text-xs">+{area.localities.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {areaAssignments?.[area.id] ? (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{areaAssignments[area.id].count}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={area.is_active}
                        onCheckedChange={(checked) => toggleStatusMutation.mutate({ id: area.id, is_active: checked })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(area)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(area.id)}>
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
    </div>
  );
}
