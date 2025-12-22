import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

interface AdminBrandsProps {
  tenantId: string;
  disabled?: boolean;
}

export default function AdminBrands({ tenantId, disabled }: AdminBrandsProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', is_active: true });

  const fetchBrands = async () => {
    const { data } = await supabase
      .from('brands')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    setBrands(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchBrands(); }, [tenantId]);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleNameChange = (name: string) => {
    setForm({ ...form, name, slug: editingBrand ? form.slug : generateSlug(name) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    const brandData = { tenant_id: tenantId, name: form.name, slug: form.slug, is_active: form.is_active };

    if (editingBrand) {
      const { error } = await supabase.from('brands').update(brandData).eq('id', editingBrand.id);
      if (error) { toast.error('Failed to update brand'); return; }
      toast.success('Brand updated');
    } else {
      const { error } = await supabase.from('brands').insert(brandData);
      if (error) { toast.error(error.message.includes('duplicate') ? 'Slug already exists' : 'Failed to create brand'); return; }
      toast.success('Brand created');
    }

    setDialogOpen(false);
    resetForm();
    fetchBrands();
  };

  const resetForm = () => {
    setEditingBrand(null);
    setForm({ name: '', slug: '', is_active: true });
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setForm({ name: brand.name, slug: brand.slug, is_active: brand.is_active });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (disabled) return;
    const { error } = await supabase.from('brands').update({ is_active: false }).eq('id', id);
    if (error) { toast.error('Failed to delete brand'); return; }
    toast.success('Brand deactivated');
    fetchBrands();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Brands</h1>
          <p className="text-muted-foreground">Manage product brands</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} disabled={disabled}><Plus className="w-4 h-4 mr-2" /> Add Brand</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBrand ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => handleNameChange(e.target.value)} required /></div>
              <div><Label>Slug *</Label><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required /></div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                <Label>Active</Label>
              </div>
              <Button type="submit" className="w-full" disabled={disabled}>{editingBrand ? 'Update' : 'Create'} Brand</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : brands.length === 0 ? (
            <div className="p-12 text-center">
              <Tag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium mb-2">No brands yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create your first brand</p>
              <Button onClick={resetForm} disabled={disabled}><Plus className="w-4 h-4 mr-2" /> Add Brand</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map(brand => (
                  <TableRow key={brand.id}>
                    <TableCell className="font-medium">{brand.name}</TableCell>
                    <TableCell className="text-muted-foreground">{brand.slug}</TableCell>
                    <TableCell>
                      <Badge variant={brand.is_active ? 'default' : 'secondary'}>
                        {brand.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(brand)} disabled={disabled}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(brand.id)} disabled={disabled}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
