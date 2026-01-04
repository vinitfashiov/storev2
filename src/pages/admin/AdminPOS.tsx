import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, Plus, Minus, Trash2, User, Printer, CreditCard, Banknote, ShoppingCart, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Product {
  id: string;
  name: string;
  price: number;
  stock_qty: number;
  barcode: string | null;
  images: any;
}

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  discount: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string;
}

interface AdminPOSProps {
  tenantId: string;
}

export default function AdminPOS({ tenantId }: AdminPOSProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online' | 'split'>('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [onlineAmount, setOnlineAmount] = useState('');
  const [lastSale, setLastSale] = useState<any>(null);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
    fetchRazorpayKey();
    // Focus search on load
    searchInputRef.current?.focus();
  }, [tenantId]);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, stock_qty, barcode, images')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name');

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  }

  async function fetchRazorpayKey() {
    const { data } = await supabase
      .from('tenant_integrations')
      .select('razorpay_key_id')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    
    if (data?.razorpay_key_id) {
      setRazorpayKeyId(data.razorpay_key_id);
    }
  }

  async function searchCustomer(phone: string) {
    if (phone.length < 10) return;
    
    const { data } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .eq('tenant_id', tenantId)
      .eq('phone', phone)
      .maybeSingle();

    if (data) {
      setSelectedCustomer(data);
      setCustomerName(data.name);
      toast.success(`Customer found: ${data.name}`);
    } else {
      setSelectedCustomer(null);
      toast.info('Customer not found - will be added as walk-in');
    }
  }

  function handleBarcodeSearch(value: string) {
    setSearchQuery(value);
    
    // Check if it's a barcode match
    const product = products.find(p => p.barcode === value);
    if (product) {
      addToCart(product);
      setSearchQuery('');
    }
  }

  function addToCart(product: Product) {
    const existing = cart.find(i => i.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock_qty) {
        toast.error('Not enough stock');
        return;
      }
      setCart(cart.map(i => 
        i.product_id === product.id 
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      if (product.stock_qty <= 0) {
        toast.error('Out of stock');
        return;
      }
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        discount: 0
      }]);
    }
    searchInputRef.current?.focus();
  }

  function updateQuantity(productId: string, delta: number) {
    const product = products.find(p => p.id === productId);
    setCart(cart.map(i => {
      if (i.product_id === productId) {
        const newQty = i.quantity + delta;
        if (newQty <= 0) return i;
        if (product && newQty > product.stock_qty) {
          toast.error('Not enough stock');
          return i;
        }
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  }

  function updateItemDiscount(productId: string, discount: number) {
    setCart(cart.map(i => 
      i.product_id === productId 
        ? { ...i, discount: Math.max(0, discount) }
        : i
    ));
  }

  function removeFromCart(productId: string) {
    setCart(cart.filter(i => i.product_id !== productId));
  }

  function clearCart() {
    setCart([]);
    setCartDiscount(0);
    setSelectedCustomer(null);
    setCustomerPhone('');
    setCustomerName('');
  }

  const subtotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const itemDiscounts = cart.reduce((acc, i) => acc + i.discount, 0);
  const total = Math.max(0, subtotal - itemDiscounts - cartDiscount);

  async function completeSale() {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    let cashAmt = 0;
    let onlineAmt = 0;
    let changeAmt = 0;

    if (paymentMethod === 'cash') {
      cashAmt = parseFloat(cashAmount) || total;
      changeAmt = cashAmt - total;
      if (changeAmt < 0) {
        toast.error('Insufficient cash amount');
        return;
      }
    } else if (paymentMethod === 'online') {
      onlineAmt = total;
    } else if (paymentMethod === 'split') {
      cashAmt = parseFloat(cashAmount) || 0;
      onlineAmt = parseFloat(onlineAmount) || 0;
      if (cashAmt + onlineAmt < total) {
        toast.error('Total payment amount is less than bill');
        return;
      }
      changeAmt = (cashAmt + onlineAmt) - total;
    }

    const saleNumber = `POS-${Date.now().toString().slice(-8)}`;

    // Create POS sale
    const { data: sale, error: saleError } = await supabase
      .from('pos_sales')
      .insert({
        tenant_id: tenantId,
        sale_number: saleNumber,
        customer_id: selectedCustomer?.id || null,
        customer_name: customerName || 'Walk-in Customer',
        customer_phone: customerPhone || null,
        subtotal,
        discount_amount: itemDiscounts + cartDiscount,
        total,
        payment_method: paymentMethod,
        cash_amount: cashAmt || null,
        online_amount: onlineAmt || null,
        change_amount: changeAmt || null
      })
      .select()
      .single();

    if (saleError || !sale) {
      toast.error('Failed to create sale');
      return;
    }

    // Create sale items (batch insert)
    const saleItems = cart.map(item => ({
      tenant_id: tenantId,
      pos_sale_id: sale.id,
      product_id: item.product_id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      discount_amount: item.discount,
      line_total: (item.price * item.quantity) - item.discount
    }));

    await supabase.from('pos_sale_items').insert(saleItems);

    // Prepare inventory movements for batch insert
    const inventoryMovements = cart.map(item => ({
      tenant_id: tenantId,
      product_id: item.product_id,
      variant_id: null,
      movement_type: 'pos_sale' as const,
      quantity: -item.quantity,
      reference_type: 'pos_sale',
      reference_id: sale.id,
      notes: `POS Sale ${saleNumber}`
    }));

    // Batch insert inventory movements
    await supabase.from('inventory_movements').insert(inventoryMovements);

    // Batch update stock - fetch current stock and decrement
    for (const item of cart) {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        await supabase
          .from('products')
          .update({ stock_qty: Math.max(0, product.stock_qty - item.quantity) })
          .eq('id', item.product_id);
      }
    }

    setLastSale({
      ...sale,
      items: cart,
      change: changeAmt
    });

    toast.success('Sale completed!');
    setShowPaymentDialog(false);
    setShowReceiptDialog(true);
    clearCart();
    fetchProducts(); // Refresh stock
  }

  function printReceipt() {
    if (!lastSale) return;
    
    const receiptContent = `
      <html>
        <head>
          <title>Receipt - ${lastSale.sale_number}</title>
          <style>
            body { font-family: monospace; font-size: 12px; max-width: 300px; margin: 0 auto; padding: 20px; }
            .center { text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="center">
            <h2 style="margin: 0;">RECEIPT</h2>
            <p>${lastSale.sale_number}</p>
            <p>${new Date(lastSale.created_at).toLocaleString()}</p>
          </div>
          <div class="divider"></div>
          ${lastSale.items.map((item: CartItem) => `
            <div class="row">
              <span>${item.name}</span>
            </div>
            <div class="row">
              <span>${item.quantity} x ₹${item.price}</span>
              <span>₹${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
          <div class="divider"></div>
          <div class="row bold">
            <span>TOTAL</span>
            <span>₹${lastSale.total.toFixed(2)}</span>
          </div>
          ${lastSale.payment_method === 'cash' || lastSale.payment_method === 'split' ? `
            <div class="row">
              <span>Cash Received</span>
              <span>₹${lastSale.cash_amount?.toFixed(2) || '0.00'}</span>
            </div>
            <div class="row">
              <span>Change</span>
              <span>₹${lastSale.change?.toFixed(2) || '0.00'}</span>
            </div>
          ` : ''}
          <div class="divider"></div>
          <div class="center">
            <p>Thank you for shopping!</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.print();
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchQuery))
  );

  const getProductImage = (product: Product) => {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const img = product.images[0];
      if (typeof img === 'string') {
        if (img.startsWith('http')) return img;
        return supabase.storage.from('product-images').getPublicUrl(img).data.publicUrl;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-120px)] flex gap-4">
        <Skeleton className="flex-1 h-full" />
        <Skeleton className="w-96 h-full" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* Products Section */}
      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search product or scan barcode..."
              value={searchQuery}
              onChange={(e) => handleBarcodeSearch(e.target.value)}
              className="pl-12 h-12 text-lg"
              autoFocus
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const imageUrl = getProductImage(product);
              return (
                <Card 
                  key={product.id} 
                  className="cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-3">
                    <div className="aspect-square bg-muted rounded-md mb-2 overflow-hidden">
                      {imageUrl ? (
                        <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ShoppingCart className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-sm truncate">{product.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-bold text-primary">₹{product.price}</span>
                      <Badge variant={product.stock_qty > 0 ? 'secondary' : 'destructive'} className="text-xs">
                        {product.stock_qty}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Cart Section */}
      <Card className="w-96 flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart ({cart.length})
            </CardTitle>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-4 pt-0">
          {/* Customer Section */}
          <div className="mb-4 space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Customer phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                onBlur={(e) => searchCustomer(e.target.value)}
                className="flex-1"
              />
              {selectedCustomer && (
                <Badge variant="secondary" className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  {selectedCustomer.name}
                </Badge>
              )}
            </div>
            {!selectedCustomer && customerPhone && (
              <Input
                placeholder="Customer name (for walk-in)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            )}
          </div>

          {/* Cart Items */}
          <ScrollArea className="flex-1 -mx-4 px-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mb-2" />
                <p>Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product_id} className="bg-muted rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm flex-1 pr-2">{item.name}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => removeFromCart(item.product_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product_id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product_id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Discount:</Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.discount || ''}
                        onChange={(e) => updateItemDiscount(item.product_id, parseFloat(e.target.value) || 0)}
                        className="h-7 w-20 text-sm"
                        placeholder="₹0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Cart Discount */}
          {cart.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <Label className="text-sm">Cart Discount:</Label>
              <Input
                type="number"
                min="0"
                value={cartDiscount || ''}
                onChange={(e) => setCartDiscount(parseFloat(e.target.value) || 0)}
                className="flex-1"
                placeholder="₹0"
              />
            </div>
          )}

          {/* Totals */}
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {(itemDiscounts + cartDiscount) > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-₹{(itemDiscounts + cartDiscount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-primary">₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <Button 
            className="w-full mt-4 h-12 text-lg"
            disabled={cart.length === 0}
            onClick={() => setShowPaymentDialog(true)}
          >
            Proceed to Payment
          </Button>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment - ₹{total.toFixed(2)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('cash')}
                className="h-16 flex-col gap-1"
              >
                <Banknote className="h-6 w-6" />
                Cash
              </Button>
              <Button
                variant={paymentMethod === 'online' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('online')}
                className="h-16 flex-col gap-1"
                disabled={!razorpayKeyId}
              >
                <CreditCard className="h-6 w-6" />
                Online
              </Button>
              <Button
                variant={paymentMethod === 'split' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('split')}
                className="h-16 flex-col gap-1"
              >
                <div className="flex">
                  <Banknote className="h-4 w-4" />
                  <CreditCard className="h-4 w-4" />
                </div>
                Split
              </Button>
            </div>

            {(paymentMethod === 'cash' || paymentMethod === 'split') && (
              <div className="space-y-2">
                <Label>Cash Amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder={`₹${total.toFixed(2)}`}
                  className="h-12 text-lg"
                />
                {parseFloat(cashAmount) > 0 && (
                  <div className="text-right text-sm">
                    Change: ₹{Math.max(0, parseFloat(cashAmount) - (paymentMethod === 'split' ? (parseFloat(onlineAmount) || 0) : 0) - total).toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'split' && (
              <div className="space-y-2">
                <Label>Online Amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={onlineAmount}
                  onChange={(e) => setOnlineAmount(e.target.value)}
                  placeholder="₹0.00"
                  className="h-12 text-lg"
                />
              </div>
            )}

            <Button className="w-full h-12 text-lg" onClick={completeSale}>
              Complete Sale
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sale Complete!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <ShoppingCart className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold">₹{lastSale?.total.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">{lastSale?.sale_number}</p>
            </div>

            {lastSale?.change > 0 && (
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Change to return</p>
                <p className="text-2xl font-bold text-orange-600">₹{lastSale.change.toFixed(2)}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={printReceipt}>
                <Printer className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
              <Button className="flex-1" onClick={() => setShowReceiptDialog(false)}>
                New Sale
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
