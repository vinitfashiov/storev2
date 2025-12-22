import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Truck, Package } from 'lucide-react';
import { format } from 'date-fns';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  shipping_address: Record<string, string>;
  subtotal: number;
  discount_total: number;
  delivery_fee: number;
  total: number;
  status: string;
  payment_status: string;
  payment_method: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
}

interface OrderItem {
  id: string;
  name: string;
  qty: number;
  unit_price: number;
  line_total: number;
}

interface AdminOrderDetailProps {
  tenantId: string;
  disabled?: boolean;
}

const statusFlow = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];

export default function AdminOrderDetail({ tenantId, disabled }: AdminOrderDetailProps) {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      const [orderRes, itemsRes] = await Promise.all([
        supabase.from('orders').select('*').eq('id', orderId).eq('tenant_id', tenantId).single(),
        supabase.from('order_items').select('*').eq('order_id', orderId)
      ]);

      if (orderRes.data) {
        const orderData = orderRes.data;
        const shippingAddr = typeof orderData.shipping_address === 'object' && orderData.shipping_address !== null 
          ? orderData.shipping_address as Record<string, string>
          : {};
        setOrder({ ...orderData, shipping_address: shippingAddr });
      }
      if (itemsRes.data) setItems(itemsRes.data);
      setLoading(false);
    };

    fetchOrder();
  }, [orderId, tenantId]);

  const updateStatus = async (newStatus: string) => {
    if (!order || disabled) return;
    
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
    if (error) { toast.error('Failed to update status'); return; }
    
    toast.success(`Order ${newStatus}`);
    setOrder({ ...order, status: newStatus });
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (!order) {
    return <div className="p-8 text-center">Order not found</div>;
  }

  const address = order.shipping_address;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/orders">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold">{order.order_number}</h1>
          <p className="text-muted-foreground">{format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Order Status</span>
                <Badge className={order.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}>
                  {order.status.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                <div className="flex gap-2 flex-wrap">
                  {statusFlow.slice(statusFlow.indexOf(order.status) + 1).map(status => (
                    <Button key={status} variant="outline" size="sm" onClick={() => updateStatus(status)} disabled={disabled}>
                      Mark as {status}
                    </Button>
                  ))}
                  <Button variant="destructive" size="sm" onClick={() => updateStatus('cancelled')} disabled={disabled}>
                    Cancel Order
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Items</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                      <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.qty} × ₹{item.unit_price.toFixed(2)}</p>
                    </div>
                  </div>
                  <p className="font-medium">₹{item.line_total.toFixed(2)}</p>
                </div>
              ))}
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal.toFixed(2)}</span></div>
                {order.discount_total > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.discount_total.toFixed(2)}</span></div>}
                <div className="flex justify-between"><span>Delivery</span><span>₹{order.delivery_fee.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span>₹{order.total.toFixed(2)}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer & Payment Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{order.customer_name}</p>
              <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
              {order.customer_email && <p className="text-sm text-muted-foreground">{order.customer_email}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Shipping Address</CardTitle></CardHeader>
            <CardContent>
              <p>{address.line1}</p>
              {address.line2 && <p>{address.line2}</p>}
              <p>{address.city}, {address.state}</p>
              <p>{address.pincode}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <Badge variant="outline">{order.payment_method.toUpperCase()}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                  {order.payment_status.toUpperCase()}
                </Badge>
              </div>
              {order.razorpay_payment_id && (
                <div className="pt-2 text-xs text-muted-foreground">
                  <p>Razorpay ID: {order.razorpay_payment_id}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Shipping</CardTitle></CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                <Truck className="w-4 h-4 mr-2" />
                Create Shipment (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
