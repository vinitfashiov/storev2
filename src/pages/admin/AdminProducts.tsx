import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Pencil, Package, Search } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock_qty: number;
  is_active: boolean;
  has_variants: boolean;
  images: string[] | null;
  category?: { name: string } | null;
  brand?: { name: string } | null;
}

interface AdminProductsProps {
  tenantId: string;
  disabled?: boolean;
}

export default function AdminProducts({ tenantId, disabled }: AdminProductsProps) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, stock_qty, is_active, has_variants, images, category:categories(name), brand:brands(name)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    const processed = (data || []).map(p => ({
      ...p,
      images: Array.isArray(p.images) ? (p.images as string[]) : []
    })) as Product[];
    
    setProducts(processed);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [tenantId]);

  const toggleActive = async (product: Product) => {
    if (disabled) return;
    const { error } = await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id);
    if (error) { toast.error('Failed to update product'); return; }
    toast.success(product.is_active ? 'Product deactivated' : 'Product activated');
    fetchProducts();
  };

  const getImageUrl = (images: string[] | null) => {
    if (!images || images.length === 0) return null;
    const img = images[0];
    if (img.startsWith('http')) return img;
    return supabase.storage.from('product-images').getPublicUrl(img).data.publicUrl;
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your inventory</p>
        </div>
        <Button onClick={() => navigate('/dashboard/products/new')} disabled={disabled}>
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <span className="text-sm text-muted-foreground">{filteredProducts.length} products</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium mb-2">No products found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? 'Try a different search term' : 'Add your first product to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate('/dashboard/products/new')}>
                  <Plus className="w-4 h-4 mr-2" /> Add Product
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const imgUrl = getImageUrl(product.images);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded overflow-hidden flex items-center justify-center">
                            {imgUrl ? (
                              <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>₹{product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        {product.has_variants ? (
                          <Badge variant="outline">Variants</Badge>
                        ) : (
                          <span className={product.stock_qty <= 0 ? 'text-destructive' : ''}>
                            {product.stock_qty}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.category?.name || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={product.is_active ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => toggleActive(product)}
                        >
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => navigate(`/dashboard/products/${product.id}`)}
                        >
                          <Pencil className="w-4 h-4" />
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
