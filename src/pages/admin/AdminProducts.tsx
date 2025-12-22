import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock_qty: number;
  is_active: boolean;
  category_id: string | null;
  category?: { name: string } | null;
}

interface Category { id: string; name: string; }

interface AdminProductsProps {
  tenantId: string;
  disabled?: boolean;
}

export default function AdminProducts({ tenantId, disabled }: AdminProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: '', compare_at_price: '',
    sku: '', stock_qty: '0', category_id: '', is_active: true
  });

  const fetchData = async () => {
    const [productsRes, catsRes] = await Promise.all([
      supabase.from('products').select('*, category:categories(name)').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      supabase.from('categories').select('id, name').eq('tenant_id', tenantId).eq('is_active', true)
    ]);
    setProducts(productsRes.data || []);
    setCategories(catsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tenantId]);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleNameChange = (name: string) => {
    setForm({ ...form, name, slug: editingProduct ? form.slug : generateSlug(name) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    const productData = {
      tenant_id: tenantId,
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      price: parseFloat(form.price) || 0,
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      sku: form.sku || null,
      stock_qty: parseInt(form.stock_qty) || 0,
      category_id: form.category_id || null,
      is_active: form.is_active
    };

    if (editingProduct) {
      const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id);
      if (error) { toast.error('Failed to update product'); return; }
      toast.success('Product updated');
    } else {
      const { error } = await supabase.from('products').insert(productData);
      if (error) { toast.error(error.message.includes('duplicate') ? 'Slug already exists' : 'Failed to create product'); return; }
      toast.success('Product created');
    }

    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const resetForm = () => {
    setEditingProduct(null);
    setForm({ name: '', slug: '', description: '', price: '', compare_at_price: '', sku: '', stock_qty: '0', category_id: '', is_active: true });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      slug: product.slug,
      description: '',
      price: product.price.toString(),
      compare_at_price: '',
      sku: '',
      stock_qty: product.stock_qty.toString(),
      category_id: product.category_id || '',
      is_active: product.is_active
    });
    setDialogOpen(true);
  };

  const toggleActive = async (product: Product) => {
    if (disabled) return;
    const { error } = await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id);
    if (error) { toast.error('Failed to update product'); return; }
    toast.success(product.is_active ? 'Product deactivated' : 'Product activated');
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your inventory</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} disabled={disabled}><Plus className="w-4 h-4 mr-2" /> Add Product</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => handleNameChange(e.target.value)} required /></div>
              <div><Label>Slug *</Label><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} required /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Price (₹) *</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required /></div>
                <div><Label>Compare Price</Label><Input type="number" step="0.01" value={form.compare_at_price} onChange={e => setForm({ ...form, compare_at_price: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>SKU</Label><Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></div>
                <div><Label>Stock Qty *</Label><Input type="number" value={form.stock_qty} onChange={e => setForm({ ...form, stock_qty: e.target.value })} required /></div>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                <Label>Active</Label>
              </div>
              <Button type="submit" className="w-full" disabled={disabled}>{editingProduct ? 'Update' : 'Create'} Product</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium mb-2">No products yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Add your first product to start selling</p>
              <Button onClick={resetForm} disabled={disabled}><Plus className="w-4 h-4 mr-2" /> Add Product</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(product => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground">{product.category?.name || '-'}</TableCell>
                    <TableCell>₹{product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={product.stock_qty > 0 ? 'outline' : 'destructive'}>
                        {product.stock_qty}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} disabled={disabled}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(product)} disabled={disabled}>
                        {product.is_active ? 'Deactivate' : 'Activate'}
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
