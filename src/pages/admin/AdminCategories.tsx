import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, FolderTree, ChevronRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  parent_id: string | null;
  created_at: string;
}

interface AdminCategoriesProps {
  tenantId: string;
  disabled?: boolean;
}

export default function AdminCategories({ tenantId, disabled }: AdminCategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', is_active: true, parent_id: '' });

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('parent_id', { ascending: true, nullsFirst: true })
      .order('name', { ascending: true });
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, [tenantId]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setForm({ ...form, name, slug: editingCategory ? form.slug : generateSlug(name) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    const categoryData = { 
      tenant_id: tenantId, 
      name: form.name, 
      slug: form.slug, 
      is_active: form.is_active,
      parent_id: form.parent_id || null
    };

    if (editingCategory) {
      const { error } = await supabase.from('categories').update(categoryData).eq('id', editingCategory.id);
      if (error) { toast.error('Failed to update category'); return; }
      toast.success('Category updated');
    } else {
      const { error } = await supabase.from('categories').insert(categoryData);
      if (error) { toast.error(error.message.includes('duplicate') ? 'Slug already exists' : 'Failed to create category'); return; }
      toast.success('Category created');
    }

    setDialogOpen(false);
    setEditingCategory(null);
    setForm({ name: '', slug: '', is_active: true, parent_id: '' });
    fetchCategories();
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setForm({ 
      name: category.name, 
      slug: category.slug, 
      is_active: category.is_active,
      parent_id: category.parent_id || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (disabled) return;
    const { error } = await supabase.from('categories').update({ is_active: false }).eq('id', id);
    if (error) { toast.error('Failed to delete category'); return; }
    toast.success('Category deactivated');
    fetchCategories();
  };

  const openCreateDialog = () => {
    setEditingCategory(null);
    setForm({ name: '', slug: '', is_active: true, parent_id: '' });
    setDialogOpen(true);
  };

  // Get parent categories (those without parent_id)
  const parentCategories = categories.filter(c => !c.parent_id);
  
  // Get subcategories for a parent
  const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  // For dropdown: only show parent categories as options
  const parentOptions = categories.filter(c => !c.parent_id && c.id !== editingCategory?.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Categories</h1>
          <p className="text-muted-foreground">Organize your products with categories and subcategories</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} disabled={disabled}>
              <Plus className="w-4 h-4 mr-2" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => handleNameChange(e.target.value)} required />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required />
              </div>
              <div>
                <Label>Parent Category</Label>
                <Select value={form.parent_id || 'none'} onValueChange={v => setForm({ ...form, parent_id: v === 'none' ? '' : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="None (top-level category)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top-level category)</SelectItem>
                    {parentOptions.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for a main category, or select a parent to create a subcategory
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                <Label>Active</Label>
              </div>
              <Button type="submit" className="w-full" disabled={disabled}>
                {editingCategory ? 'Update' : 'Create'} Category
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center">
              <FolderTree className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium mb-2">No categories yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create your first category to organize products</p>
              <Button onClick={openCreateDialog} disabled={disabled}><Plus className="w-4 h-4 mr-2" /> Add Category</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parentCategories.map(cat => (
                  <>
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                      <TableCell><Badge variant="outline">Main</Badge></TableCell>
                      <TableCell>
                        <Badge variant={cat.is_active ? 'default' : 'secondary'}>
                          {cat.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)} disabled={disabled}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} disabled={disabled}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {getSubcategories(cat.id).map(sub => (
                      <TableRow key={sub.id} className="bg-muted/30">
                        <TableCell className="font-medium pl-8">
                          <span className="flex items-center gap-2">
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            {sub.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{sub.slug}</TableCell>
                        <TableCell><Badge variant="secondary">Sub</Badge></TableCell>
                        <TableCell>
                          <Badge variant={sub.is_active ? 'default' : 'secondary'}>
                            {sub.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(sub)} disabled={disabled}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(sub.id)} disabled={disabled}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
