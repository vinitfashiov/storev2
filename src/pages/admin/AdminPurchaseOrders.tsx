import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Eye, Package, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Supplier {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: number;
}

interface PurchaseOrder {
  id: string;
  order_number: string;
  status: string;
  order_date: string;
  subtotal: number;
  total: number;
  suppliers: { name: string } | null;
}

interface PurchaseOrderItem {
  id: string;
  product_id: string;
  quantity_ordered: number;
  quantity_received: number;
  cost_price: number;
  line_total: number;
  batch_number: string | null;
  expiry_date: string | null;
  products: { name: string } | null;
}

interface AdminPurchaseOrdersProps {
  tenantId: string;
  businessType?: 'ecommerce' | 'grocery';
}

export default function AdminPurchaseOrders({ tenantId, businessType }: AdminPurchaseOrdersProps) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [cartItems, setCartItems] = useState<Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    cost_price: number;
    batch_number: string;
    expiry_date: string;
  }>>([]);

  const isGrocery = businessType === 'grocery';

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchProducts();
  }, [tenantId]);

  async function fetchOrders() {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('id, order_number, status, order_date, subtotal, total, suppliers(name)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data as unknown as PurchaseOrder[]);
    }
    setLoading(false);
  }

  async function fetchSuppliers() {
    const { data } = await supabase
      .from('suppliers')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);
    if (data) setSuppliers(data);
  }

  async function fetchProducts() {
    const { data } = await supabase
      .from('products')
      .select('id, name, sku, price')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);
    if (data) setProducts(data);
  }

  async function fetchOrderItems(orderId: string) {
    const { data } = await supabase
      .from('purchase_order_items')
      .select('*, products(name)')
      .eq('purchase_order_id', orderId);
    if (data) setOrderItems(data as unknown as PurchaseOrderItem[]);
  }

  function addToCart(product: Product) {
    const existing = cartItems.find(i => i.product_id === product.id);
    if (existing) {
      setCartItems(cartItems.map(i => 
        i.product_id === product.id 
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      setCartItems([...cartItems, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        cost_price: product.price,
        batch_number: '',
        expiry_date: ''
      }]);
    }
  }

  function updateCartItem(productId: string, field: string, value: string | number) {
    setCartItems(cartItems.map(i => 
      i.product_id === productId 
        ? { ...i, [field]: value }
        : i
    ));
  }

  function removeFromCart(productId: string) {
    setCartItems(cartItems.filter(i => i.product_id !== productId));
  }

  async function createOrder() {
    if (!selectedSupplier || cartItems.length === 0) {
      toast.error('Please select a supplier and add items');
      return;
    }

    const orderNumber = `PO-${Date.now().toString().slice(-8)}`;
    const subtotal = cartItems.reduce((acc, item) => acc + (item.cost_price * item.quantity), 0);

    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .insert({
        tenant_id: tenantId,
        supplier_id: selectedSupplier,
        order_number: orderNumber,
        status: 'ordered',
        subtotal,
        total: subtotal
      })
      .select()
      .single();

    if (orderError || !order) {
      toast.error('Failed to create order');
      return;
    }

    const items = cartItems.map(item => ({
      tenant_id: tenantId,
      purchase_order_id: order.id,
      product_id: item.product_id,
      quantity_ordered: item.quantity,
      cost_price: item.cost_price,
      line_total: item.cost_price * item.quantity,
      batch_number: item.batch_number || null,
      expiry_date: item.expiry_date || null
    }));

    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(items);

    if (itemsError) {
      toast.error('Failed to add items to order');
      return;
    }

    toast.success('Purchase order created');
    setShowCreateDialog(false);
    setSelectedSupplier('');
    setCartItems([]);
    fetchOrders();
  }

  async function receiveOrder(orderId: string) {
    // Fetch order items
    const { data: items } = await supabase
      .from('purchase_order_items')
      .select('*')
      .eq('purchase_order_id', orderId);

    if (!items) return;

    // Process each item
    for (const item of items) {
      const qtyToReceive = item.quantity_ordered - item.quantity_received;
      if (qtyToReceive <= 0) continue;

      // Create inventory movement
      await supabase.from('inventory_movements').insert({
        tenant_id: tenantId,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        movement_type: 'purchase_received' as const,
        quantity: qtyToReceive,
        reference_type: 'purchase_order',
        reference_id: orderId,
        cost_price: item.cost_price,
        notes: 'PO received'
      });

      // Update product stock directly
      const { data: product } = await supabase
        .from('products')
        .select('stock_qty')
        .eq('id', item.product_id)
        .single();
      
      if (product) {
        await supabase
          .from('products')
          .update({ stock_qty: product.stock_qty + qtyToReceive })
          .eq('id', item.product_id);
      }

      // Update item as received
      await supabase
        .from('purchase_order_items')
        .update({ quantity_received: item.quantity_ordered })
        .eq('id', item.id);

      // Create batch if grocery
      if (isGrocery && (item.batch_number || item.expiry_date)) {
        await supabase.from('product_batches').insert({
          tenant_id: tenantId,
          product_id: item.product_id,
          batch_number: item.batch_number || `BATCH-${Date.now()}`,
          expiry_date: item.expiry_date,
          cost_price: item.cost_price,
          current_stock: qtyToReceive
        });
      }
    }

    // Update order status
    await supabase
      .from('purchase_orders')
      .update({ status: 'received', received_date: new Date().toISOString().split('T')[0] })
      .eq('id', orderId);

    toast.success('Order received and stock updated');
    fetchOrders();
    if (selectedOrder?.id === orderId) {
      fetchOrderItems(orderId);
    }
  }

  function viewOrder(order: PurchaseOrder) {
    setSelectedOrder(order);
    fetchOrderItems(order.id);
    setShowDetailDialog(true);
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'bg-muted text-muted-foreground',
      'ordered': 'bg-blue-100 text-blue-800',
      'partial': 'bg-orange-100 text-orange-800',
      'received': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  const cartTotal = cartItems.reduce((acc, item) => acc + (item.cost_price * item.quantity), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-display font-bold">Purchase Orders</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Purchase Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Select Supplier</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Add Products</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                  {products.map(p => (
                    <Button 
                      key={p.id} 
                      variant="outline" 
                      size="sm" 
                      className="justify-start text-left h-auto py-2"
                      onClick={() => addToCart(p)}
                    >
                      <div>
                        <div className="font-medium text-sm truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">₹{p.price}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {cartItems.length > 0 && (
                <div className="space-y-2">
                  <Label>Order Items</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Cost Price</TableHead>
                        {isGrocery && <TableHead>Batch #</TableHead>}
                        {isGrocery && <TableHead>Expiry</TableHead>}
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartItems.map(item => (
                        <TableRow key={item.product_id}>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateCartItem(item.product_id, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.cost_price}
                              onChange={(e) => updateCartItem(item.product_id, 'cost_price', parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          {isGrocery && (
                            <TableCell>
                              <Input
                                value={item.batch_number}
                                onChange={(e) => updateCartItem(item.product_id, 'batch_number', e.target.value)}
                                className="w-24"
                                placeholder="Batch"
                              />
                            </TableCell>
                          )}
                          {isGrocery && (
                            <TableCell>
                              <Input
                                type="date"
                                value={item.expiry_date}
                                onChange={(e) => updateCartItem(item.product_id, 'expiry_date', e.target.value)}
                                className="w-32"
                              />
                            </TableCell>
                          )}
                          <TableCell className="text-right font-medium">
                            ₹{(item.cost_price * item.quantity).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.product_id)}>
                              ×
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="font-medium">Total</span>
                    <span className="text-xl font-bold">₹{cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <Button onClick={createOrder} className="w-full" disabled={!selectedSupplier || cartItems.length === 0}>
                Create Purchase Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono font-medium">{order.order_number}</TableCell>
                  <TableCell>{order.suppliers?.name || '-'}</TableCell>
                  <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">₹{order.total}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => viewOrder(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {order.status === 'ordered' && (
                        <Button size="sm" onClick={() => receiveOrder(order.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Receive
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package className="h-8 w-8" />
                      <p>No purchase orders yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Status</span>
                <div>
                  <Badge className={getStatusColor(selectedOrder?.status || '')}>
                    {selectedOrder?.status}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Date</span>
                <p className="font-medium">
                  {selectedOrder && new Date(selectedOrder.order_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Supplier</span>
                <p className="font-medium">{selectedOrder?.suppliers?.name}</p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Ordered</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.products?.name}</TableCell>
                    <TableCell>{item.quantity_ordered}</TableCell>
                    <TableCell>{item.quantity_received}</TableCell>
                    <TableCell>₹{item.cost_price}</TableCell>
                    <TableCell className="text-right">₹{item.line_total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-between items-center pt-4 border-t">
              <span className="font-medium">Total</span>
              <span className="text-xl font-bold">₹{selectedOrder?.total}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
