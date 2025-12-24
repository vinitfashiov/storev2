import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Package, AlertTriangle, Plus, Minus, Search, History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  stock_qty: number;
  low_stock_threshold: number | null;
  category: { name: string } | null;
}

interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  notes: string | null;
  created_at: string;
  products: { name: string } | null;
}

interface AdminInventoryProps {
  tenantId: string;
}

export default function AdminInventory({ tenantId }: AdminInventoryProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [adjustmentQty, setAdjustmentQty] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [filter, setFilter] = useState<'all' | 'low'>('all');

  useEffect(() => {
    fetchProducts();
  }, [tenantId]);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku, barcode, stock_qty, low_stock_threshold, category:categories(name)')
      .eq('tenant_id', tenantId)
      .order('name');

    if (!error && data) {
      setProducts(data as unknown as Product[]);
    }
    setLoading(false);
  }

  async function fetchMovements(productId: string) {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('id, product_id, movement_type, quantity, notes, created_at, products(name)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setMovements(data as unknown as InventoryMovement[]);
    }
  }

  async function handleAdjustment() {
    if (!selectedProduct || !adjustmentQty) return;

    const qty = parseInt(adjustmentQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    const movementType = adjustmentType === 'add' ? 'adjustment_add' : 'adjustment_remove';
    const finalQty = adjustmentType === 'add' ? qty : -qty;

    // Create inventory movement
    const { error: movementError } = await supabase
      .from('inventory_movements')
      .insert({
        tenant_id: tenantId,
        product_id: selectedProduct.id,
        movement_type: movementType,
        quantity: finalQty,
        notes: adjustmentReason || null
      });

    if (movementError) {
      toast.error('Failed to record movement');
      return;
    }

    // Update product stock
    const newStock = selectedProduct.stock_qty + finalQty;
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock_qty: Math.max(0, newStock) })
      .eq('id', selectedProduct.id);

    if (updateError) {
      toast.error('Failed to update stock');
      return;
    }

    toast.success('Stock adjusted successfully');
    setShowAdjustDialog(false);
    setAdjustmentQty('');
    setAdjustmentReason('');
    fetchProducts();
  }

  function openHistory(product: Product) {
    setSelectedProduct(product);
    fetchMovements(product.id);
    setShowHistoryDialog(true);
  }

  function openAdjust(product: Product) {
    setSelectedProduct(product);
    setShowAdjustDialog(true);
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.barcode && p.barcode.includes(searchQuery));
    
    const matchesFilter = filter === 'all' || 
      (filter === 'low' && p.stock_qty <= (p.low_stock_threshold || 10));

    return matchesSearch && matchesFilter;
  });

  const lowStockCount = products.filter(p => p.stock_qty <= (p.low_stock_threshold || 10)).length;

  const getMovementBadge = (type: string) => {
    const colors: Record<string, string> = {
      'purchase_received': 'bg-green-100 text-green-800',
      'sale': 'bg-blue-100 text-blue-800',
      'pos_sale': 'bg-purple-100 text-purple-800',
      'adjustment_add': 'bg-emerald-100 text-emerald-800',
      'adjustment_remove': 'bg-orange-100 text-orange-800',
      'return_customer': 'bg-cyan-100 text-cyan-800',
      'expired': 'bg-red-100 text-red-800',
      'damaged': 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-display font-bold">Inventory Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-100">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Stock Value</p>
                <p className="text-2xl font-bold">{products.reduce((acc, p) => acc + p.stock_qty, 0)} units</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU, or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All Products
              </Button>
              <Button
                variant={filter === 'low' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('low')}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Low Stock ({lowStockCount})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Threshold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const isLowStock = product.stock_qty <= (product.low_stock_threshold || 10);
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku || '-'}</TableCell>
                    <TableCell className="font-mono text-sm">{product.barcode || '-'}</TableCell>
                    <TableCell>{product.category?.name || '-'}</TableCell>
                    <TableCell className="text-right font-medium">{product.stock_qty}</TableCell>
                    <TableCell className="text-right">{product.low_stock_threshold || 10}</TableCell>
                    <TableCell>
                      {isLowStock ? (
                        <Badge variant="destructive" className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                          In Stock
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openHistory(product)}>
                          <History className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openAdjust(product)}>
                          Adjust
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No products found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Adjust Stock Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-center gap-4 p-4 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Current Stock:</span>
              <span className="text-2xl font-bold">{selectedProduct?.stock_qty}</span>
            </div>
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={adjustmentType === 'add' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setAdjustmentType('add')}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Stock
                </Button>
                <Button
                  type="button"
                  variant={adjustmentType === 'remove' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setAdjustmentType('remove')}
                >
                  <Minus className="h-4 w-4 mr-2" /> Remove Stock
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input
                id="qty"
                type="number"
                min="1"
                value={adjustmentQty}
                onChange={(e) => setAdjustmentQty(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="e.g., Damaged goods, Count correction, etc."
              />
            </div>
            <Button className="w-full" onClick={handleAdjustment}>
              Confirm Adjustment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Stock History - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="text-sm">
                      {new Date(movement.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getMovementBadge(movement.movement_type)}>
                        {movement.movement_type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {movement.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {movements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No movement history
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
