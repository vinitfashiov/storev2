import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, User, CheckCircle, Circle, Truck } from 'lucide-react';
import { format } from 'date-fns';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: Record<string, string>;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
}

interface OrderItem {
  id: string;
  name: string;
  qty: number;
  unit_price: number;
  line_total: number;
}

interface Shipment {
  shiprocket_order_id: string | null;
  awb_code: string | null;
  courier_name: string | null;
  status: string | null;
}

const statusSteps = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];

// Loading skeleton for order detail page
const OrderDetailSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-4 h-4 bg-muted rounded animate-pulse" />
        <div className="w-24 h-4 bg-muted rounded animate-pulse" />
      </div>
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="w-32 h-8 bg-muted rounded animate-pulse" />
          <div className="w-40 h-4 bg-muted rounded animate-pulse" />
        </div>
        <div className="w-20 h-6 bg-muted rounded animate-pulse" />
      </div>
      <div className="bg-card rounded-lg p-6 mb-6">
        <div className="w-28 h-6 bg-muted rounded animate-pulse mb-4" />
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
              <div className="w-12 h-3 bg-muted rounded animate-pulse mt-2" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card rounded-lg p-6 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 bg-muted rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="w-3/4 h-4 bg-muted rounded animate-pulse" />
              <div className="w-1/2 h-3 bg-muted rounded animate-pulse" />
            </div>
            <div className="w-16 h-4 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function StoreOrderDetail() {
  const { slug, orderId } = useParams<{ slug: string; orderId: string }>();
  const { customer, loading: authLoading } = useStoreAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!customer || !orderId) {
        setLoading(false);
        return;
      }

      const [orderRes, itemsRes, shipmentRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .eq('customer_id', customer.id)
          .single(),
        supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId),
        supabase
          .from('shiprocket_shipments')
          .select('shiprocket_order_id, awb_code, courier_name, status')
          .eq('order_id', orderId)
          .maybeSingle()
      ]);

      if (orderRes.data) {
        const shippingAddr = typeof orderRes.data.shipping_address === 'object' && orderRes.data.shipping_address !== null 
          ? orderRes.data.shipping_address as Record<string, string>
          : {};
        setOrder({ ...orderRes.data, shipping_address: shippingAddr } as Order);
      }
      if (itemsRes.data) setItems(itemsRes.data);
      if (shipmentRes.data) setShipment(shipmentRes.data);
      setLoading(false);
    };

    if (!authLoading) {
      fetchOrder();
    }
  }, [customer, orderId, authLoading]);

  // Show skeleton while loading
  if (authLoading || loading) return <OrderDetailSkeleton />;

  if (!customer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Please log in to view order details</p>
            <Link to={`/store/${slug}/login`}>
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Order not found</p>
            <Link to={`/store/${slug}/account/orders`}>
              <Button variant="outline">Back to Orders</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStepIndex = statusSteps.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to={`/store/${slug}/account/orders`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to orders
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold">{order.order_number}</h1>
            <p className="text-muted-foreground">{format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}</p>
          </div>
          <Badge className={isCancelled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
            {order.status.toUpperCase()}
          </Badge>
        </div>

        {/* Status Timeline */}
        {!isCancelled && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  
                  return (
                    <div key={step} className="flex flex-col items-center flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </div>
                      <span className={`text-xs mt-2 capitalize ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step}
                      </span>
                      {index < statusSteps.length - 1 && (
                        <div className={`absolute h-0.5 w-full ${isCompleted ? 'bg-primary' : 'bg-muted'}`} style={{ display: 'none' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shipment Info */}
        {shipment && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Tracking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {shipment.courier_name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Courier</span>
                  <span className="font-medium">{shipment.courier_name}</span>
                </div>
              )}
              {shipment.awb_code && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AWB Code</span>
                  <span className="font-mono">{shipment.awb_code}</span>
                </div>
              )}
              {shipment.status && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipment Status</span>
                  <Badge variant="outline">{shipment.status}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => (
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
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>₹{order.delivery_fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment & Shipping */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{order.shipping_address.line1}</p>
              {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
              <p>{order.shipping_address.city}, {order.shipping_address.state}</p>
              <p>{order.shipping_address.pincode}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
