import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Package, AlertTriangle, Plus, Minus, Search, History, ChevronDown, ChevronRight, Layers, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Variant {
  id: string;
  sku: string | null;
  price: number;
  stock_qty: number;
  is_active: boolean;
  variant_attribute_values?: {
    attribute_values: {
      value: string;
      attributes: { name: string };
    };
  }[];
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  stock_qty: number;
  has_variants: boolean;
  low_stock_threshold: number | null;
  category: { name: string } | null;
  variants?: Variant[];
}

interface InventoryMovement {
  id: string;
  product_id: string;
  variant_id: string | null;
  movement_type: string;
  quantity: number;
  notes: string | null;
  created_at: string;
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
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [adjustmentQty, setAdjustmentQty] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [filter, setFilter] = useState<'all' | 'low'>('all');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [bulkEdits, setBulkEdits] = useState<Record<string, { stock_qty?: number, price?: number, low_stock_threshold?: number }>>({});

  useEffect(() => {
    fetchProducts();
  }, [tenantId]);

  async function fetchProducts() {
    setLoading(true);

    // Fetch products with their variants
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        id, name, sku, barcode, stock_qty, has_variants, low_stock_threshold, 
        category:categories(name)
      `)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name');

    if (productsError) {
      toast.error('Failed to load products');
      setLoading(false);
      return;
    }

    // Fetch variants for products that have them
    const productIds = productsData?.filter(p => p.has_variants).map(p => p.id) || [];

    let variantsMap: Record<string, Variant[]> = {};

    if (productIds.length > 0) {
      const { data: variantsData } = await supabase
        .from('product_variants')
        .select('id, sku, price, stock_qty, is_active, product_id')
        .in('product_id', productIds)
        .eq('is_active', true);

      if (variantsData) {
        variantsData.forEach((v: any) => {
          if (!variantsMap[v.product_id]) {
            variantsMap[v.product_id] = [];
          }
          variantsMap[v.product_id].push(v);
        });
      }
    }

    // Combine products with their variants
    const combinedProducts = productsData?.map(p => ({
      ...p,
      variants: variantsMap[p.id] || [],
      // For variant products, calculate total stock from variants
      stock_qty: p.has_variants && variantsMap[p.id]
        ? variantsMap[p.id].reduce((sum, v) => sum + v.stock_qty, 0)
        : p.stock_qty
    })) as Product[];

    setProducts(combinedProducts || []);
    setLoading(false);
  }

  async function fetchMovements(productId: string, variantId?: string | null) {
    let query = supabase
      .from('inventory_movements')
      .select('id, product_id, variant_id, movement_type, quantity, notes, created_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (variantId) {
      query = query.eq('variant_id', variantId);
    }

    const { data, error } = await query;

    if (!error && data) {
      setMovements(data as InventoryMovement[]);
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
    const movementData: any = {
      tenant_id: tenantId,
      product_id: selectedProduct.id,
      movement_type: movementType,
      quantity: finalQty,
      notes: adjustmentReason || null
    };

    if (selectedVariant) {
      movementData.variant_id = selectedVariant.id;
    }

    const { error: movementError } = await supabase
      .from('inventory_movements')
      .insert(movementData);

    if (movementError) {
      toast.error('Failed to record movement');
      return;
    }

    // Update stock based on whether it's a variant or product
    if (selectedVariant) {
      const newStock = selectedVariant.stock_qty + finalQty;
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({ stock_qty: Math.max(0, newStock) })
        .eq('id', selectedVariant.id);

      if (updateError) {
        toast.error('Failed to update variant stock');
        return;
      }
    } else {
      const newStock = selectedProduct.stock_qty + finalQty;
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_qty: Math.max(0, newStock) })
        .eq('id', selectedProduct.id);

      if (updateError) {
        toast.error('Failed to update stock');
        return;
      }
    }

    toast.success('Stock adjusted successfully');
    setShowAdjustDialog(false);
    setAdjustmentQty('');
    setAdjustmentReason('');
    setSelectedVariant(null);
    fetchProducts();
  }

  function openHistory(product: Product, variant?: Variant) {
    setSelectedProduct(product);
    setSelectedVariant(variant || null);
    fetchMovements(product.id, variant?.id);
    setShowHistoryDialog(true);
  }

  function openAdjust(product: Product, variant?: Variant) {
    setSelectedProduct(product);
    setSelectedVariant(variant || null);
    setShowAdjustDialog(true);
  }

  function toggleExpanded(productId: string) {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  }

  function getVariantName(variant: Variant): string {
    if (!variant.variant_attribute_values?.length) {
      return variant.sku || 'Variant';
    }
    return variant.variant_attribute_values
      .map((vav: any) => `${vav.attribute_values?.attributes?.name}: ${vav.attribute_values?.value}`)
      .join(', ');
  }

  const handleBulkChange = (id: string, field: 'stock_qty' | 'price' | 'low_stock_threshold', value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) && value !== '') return;

    setBulkEdits(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value === '' ? 0 : numValue
      }
    }));
  };

  async function saveBulkChanges() {
    setLoading(true);
    const updates = Object.entries(bulkEdits);
    let successCount = 0;

    for (const [id, changes] of updates) {
      // Determine if it's a product or variant
      // This is a bit inefficient, but safe. 
      // A better way would be to track type in bulkEdits, but for now we try both or rely on ID structure if UUID

      const isVariant = products.some(p => p.variants?.some(v => v.id === id));

      if (isVariant) {
        const { error } = await supabase
          .from('product_variants')
          .update(changes)
          .eq('id', id);
        if (!error) successCount++;
      } else {
        const { error } = await supabase
          .from('products')
          .update(changes)
          .eq('id', id);
        if (!error) successCount++;
      }
    }

    toast.success(`Updated ${successCount} items`);
    setBulkEdits({});
    setIsBulkEditMode(false);
    fetchProducts();
  }

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(searchLower) ||
        (p.sku && p.sku.toLowerCase().includes(searchLower)) ||
        (p.barcode && p.barcode.includes(searchQuery)) ||
        (p.variants?.some(v => v.sku?.toLowerCase().includes(searchLower)));

      const threshold = p.low_stock_threshold || 10;
      const isLowStock = p.stock_qty <= threshold;
      const matchesFilter = filter === 'all' || (filter === 'low' && isLowStock);

      return matchesSearch && matchesFilter;
    });
  }, [products, searchQuery, filter]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => p.stock_qty <= (p.low_stock_threshold || 10)).length;
  }, [products]);

  const totalStock = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock_qty, 0);
  }, [products]);

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
      <div className="space-y-6 p-4 md:p-0">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-xl md:text-2xl font-display font-bold">Inventory Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total Products</p>
                <p className="text-xl md:text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 rounded-lg bg-orange-100">
                <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-xl md:text-2xl font-bold text-orange-600">{lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 rounded-lg bg-green-100">
                <Package className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total Stock Units</p>
                <p className="text-xl md:text-2xl font-bold">{totalStock.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions Bar */}
      {isBulkEditMode && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b p-4 flex justify-between items-center shadow-sm -mx-4 md:mx-0 md:rounded-lg md:border">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary animate-pulse" />
            <span className="font-medium">Bulk Edit Mode Active</span>
            <Badge variant="secondary">{Object.keys(bulkEdits).length} changes pending</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              setIsBulkEditMode(false);
              setBulkEdits({});
            }}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveBulkChanges} disabled={Object.keys(bulkEdits).length === 0}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU, or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className="whitespace-nowrap"
              >
                All Products
              </Button>
              <Button
                variant={filter === 'low' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('low')}
                className="whitespace-nowrap"
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Low Stock ({lowStockCount})
              </Button>
              <div className="flex-1"></div>
              <Button
                variant={isBulkEditMode ? "secondary" : "outline"}
                size="sm"
                onClick={() => setIsBulkEditMode(!isBulkEditMode)}
                className="whitespace-nowrap"
              >
                {isBulkEditMode ? 'Exit Bulk Edit' : 'Bulk Edit'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 md:p-6 md:pt-0">
          {/* Mobile Card View */}
          <div className="md:hidden divide-y">
            {filteredProducts.map((product) => {
              const isLowStock = product.stock_qty <= (product.low_stock_threshold || 10);
              const isExpanded = expandedProducts.has(product.id);

              return (
                <div key={product.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {product.has_variants && product.variants && product.variants.length > 0 && (
                          <button
                            onClick={() => toggleExpanded(product.id)}
                            className="p-1 -ml-1 hover:bg-muted rounded"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        <span className="font-medium truncate">{product.name}</span>
                        {product.has_variants && (
                          <Badge variant="outline" className="shrink-0">
                            <Layers className="h-3 w-3 mr-1" />
                            {product.variants?.length || 0}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {product.sku && <span>SKU: {product.sku}</span>}
                        {product.category?.name && (
                          <span className="ml-2">{product.category.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {isBulkEditMode && !product.has_variants ? (
                        <Input
                          className="w-20 text-right h-8"
                          type="number"
                          value={bulkEdits[product.id]?.stock_qty ?? product.stock_qty}
                          onChange={(e) => handleBulkChange(product.id, 'stock_qty', e.target.value)}
                        />
                      ) : (
                        <div className="text-lg font-bold">{product.stock_qty}</div>
                      )}

                      {!isBulkEditMode && (
                        isLowStock ? (
                          <Badge variant="destructive" className="bg-orange-100 text-orange-800 text-xs text-right block">Low</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs text-right block">OK</Badge>
                        )
                      )}
                    </div>
                  </div>

                  {/* Actions for non-variant products */}
                  {!product.has_variants && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openHistory(product)}
                      >
                        <History className="h-4 w-4 mr-1" />
                        History
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openAdjust(product)}
                      >
                        Adjust Stock
                      </Button>
                    </div>
                  )}

                  {/* Expanded Variants */}
                  {isExpanded && product.variants && product.variants.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-muted space-y-3">
                      {product.variants.map((variant) => {
                        const variantLowStock = variant.stock_qty <= (product.low_stock_threshold || 10);
                        return (
                          <div key={variant.id} className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {getVariantName(variant)}
                                </div>
                                {variant.sku && (
                                  <div className="text-xs text-muted-foreground">
                                    SKU: {variant.sku}
                                  </div>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                {isBulkEditMode ? (
                                  <Input
                                    className="w-20 text-right h-8 bg-background"
                                    type="number"
                                    value={bulkEdits[variant.id]?.stock_qty ?? variant.stock_qty}
                                    onChange={(e) => handleBulkChange(variant.id, 'stock_qty', e.target.value)}
                                  />
                                ) : (
                                  <>
                                    <div className="font-bold">{variant.stock_qty}</div>
                                    {variantLowStock ? (
                                      <Badge variant="destructive" className="bg-orange-100 text-orange-800 text-xs block text-right">Low</Badge>
                                    ) : (
                                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs block text-right">OK</Badge>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-xs"
                                onClick={() => openHistory(product, variant)}
                              >
                                <History className="h-3 w-3 mr-1" />
                                History
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-xs"
                                onClick={() => openAdjust(product, variant)}
                              >
                                Adjust
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No products found
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
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
                  const isExpanded = expandedProducts.has(product.id);
                  const hasVariants = product.has_variants && product.variants && product.variants.length > 0;

                  return (
                    <>
                      <TableRow key={product.id} className={hasVariants ? 'cursor-pointer hover:bg-muted/50' : ''}>
                        <TableCell className="w-8">
                          {hasVariants && (
                            <button
                              onClick={() => toggleExpanded(product.id)}
                              className="p-1 hover:bg-muted rounded"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {product.name}
                            {hasVariants && (
                              <Badge variant="outline" className="text-xs">
                                <Layers className="h-3 w-3 mr-1" />
                                {product.variants?.length} variants
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.sku || '-'}</TableCell>
                        <TableCell>{product.category?.name || '-'}</TableCell>
                        <TableCell className="text-right font-medium">
                          {isBulkEditMode && !hasVariants ? (
                            <Input
                              className="w-24 ml-auto h-8 text-right"
                              type="number"
                              value={bulkEdits[product.id]?.stock_qty ?? product.stock_qty}
                              onChange={(e) => handleBulkChange(product.id, 'stock_qty', e.target.value)}
                            />
                          ) : (
                            product.stock_qty
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isBulkEditMode && !hasVariants ? (
                            <Input
                              className="w-20 ml-auto h-8 text-right"
                              type="number"
                              value={bulkEdits[product.id]?.low_stock_threshold ?? (product.low_stock_threshold || 10)}
                              onChange={(e) => handleBulkChange(product.id, 'low_stock_threshold', e.target.value)}
                            />
                          ) : (
                            product.low_stock_threshold || 10
                          )}
                        </TableCell>
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
                          {!hasVariants && (
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => openHistory(product)}>
                                <History className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => openAdjust(product)}>
                                Adjust
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Expanded Variant Rows */}
                      {isExpanded && product.variants?.map((variant) => {
                        const variantLowStock = variant.stock_qty <= (product.low_stock_threshold || 10);
                        return (
                          <TableRow key={variant.id} className="bg-muted/30">
                            <TableCell></TableCell>
                            <TableCell className="pl-8">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-4 bg-primary/20 rounded"></div>
                                <span className="text-sm">{getVariantName(variant)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{variant.sku || '-'}</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell className="text-right font-medium">
                              {isBulkEditMode ? (
                                <Input
                                  className="w-24 ml-auto h-8 text-right"
                                  type="number"
                                  value={bulkEdits[variant.id]?.stock_qty ?? variant.stock_qty}
                                  onChange={(e) => handleBulkChange(variant.id, 'stock_qty', e.target.value)}
                                />
                              ) : (
                                variant.stock_qty
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.low_stock_threshold || 10}
                            </TableCell>
                            <TableCell>
                              {variantLowStock ? (
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
                                <Button variant="outline" size="sm" onClick={() => openHistory(product, variant)}>
                                  <History className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => openAdjust(product, variant)}>
                                  Adjust
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </>
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
          </div>
        </CardContent>
      </Card>

      {/* Adjust Stock Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Adjust Stock - {selectedProduct?.name}
              {selectedVariant && (
                <span className="text-sm font-normal text-muted-foreground block mt-1">
                  {getVariantName(selectedVariant)}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-center gap-4 p-4 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Current Stock:</span>
              <span className="text-2xl font-bold">
                {selectedVariant ? selectedVariant.stock_qty : selectedProduct?.stock_qty}
              </span>
            </div>
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={adjustmentType === 'add' ? 'default' : 'outline'}
                  onClick={() => setAdjustmentType('add')}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Stock
                </Button>
                <Button
                  type="button"
                  variant={adjustmentType === 'remove' ? 'default' : 'outline'}
                  onClick={() => setAdjustmentType('remove')}
                >
                  <Minus className="h-4 w-4 mr-2" /> Remove
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
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Stock History - {selectedProduct?.name}
              {selectedVariant && (
                <span className="text-sm font-normal text-muted-foreground block mt-1">
                  {getVariantName(selectedVariant)}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
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
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(movement.created_at).toLocaleDateString()}
                      <span className="text-muted-foreground ml-1">
                        {new Date(movement.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getMovementBadge(movement.movement_type)}>
                        {movement.movement_type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
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
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
