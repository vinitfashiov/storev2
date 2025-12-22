import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Truck, Package, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
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
  delivery_option: string;
  created_at: string;
}

interface OrderItem {
  id: string;
  name: string;
  qty: number;
  unit_price: number;
  line_total: number;
}

interface ShiprocketShipment {
  id: string;
  shiprocket_order_id: string | null;
  shipment_id: string | null;
  awb_code: string | null;
  courier_name: string | null;
  status: string | null;
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
  const [shipment, setShipment] = useState<ShiprocketShipment | null>(null);
  const [shiprocketConfigured, setShiprocketConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingShipment, setCreatingShipment] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      const [orderRes, itemsRes, shipmentRes, integrationRes] = await Promise.all([
        supabase.from('orders').select('*').eq('id', orderId).eq('tenant_id', tenantId).single(),
        supabase.from('order_items').select('*').eq('order_id', orderId),
        supabase.from('shiprocket_shipments').select('*').eq('order_id', orderId).maybeSingle(),
        supabase.from('tenant_integrations').select('shiprocket_email').eq('tenant_id', tenantId).maybeSingle()
      ]);

      if (orderRes.data) {
        const orderData = orderRes.data;
        const shippingAddr = typeof orderData.shipping_address === 'object' && orderData.shipping_address !== null 
          ? orderData.shipping_address as Record<string, string>
          : {};
        setOrder({ ...orderData, shipping_address: shippingAddr } as Order);
      }
      if (itemsRes.data) setItems(itemsRes.data);
      if (shipmentRes.data) setShipment(shipmentRes.data);
      setShiprocketConfigured(!!integrationRes.data?.shiprocket_email);
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

  const createShipment = async () => {
    if (!order || disabled || !shiprocketConfigured) return;
    
    setCreatingShipment(true);
    try {
      const { data, error } = await supabase.functions.invoke('shiprocket-create-shipment', {
        body: { order_id: order.id }
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Failed to create shipment');
      }

      toast.success('Shipment created successfully!');
      
      // Refetch shipment data
      const { data: newShipment } = await supabase
        .from('shiprocket_shipments')
        .select('*')
        .eq('order_id', order.id)
        .maybeSingle();
      
      if (newShipment) setShipment(newShipment);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create shipment');
    } finally {
      setCreatingShipment(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (!order) {
    return <div className="p-8 text-center">Order not found</div>;
  }

  const address = order.shipping_address;
  const canCreateShipment = shiprocketConfigured && !shipment && 
    ['confirmed', 'packed', 'shipped', 'delivered'].includes(order.status) &&
    order.payment_status === 'paid' || order.payment_method === 'cod';

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
            <CardHeader><CardTitle>Delivery</CardTitle></CardHeader>
            <CardContent>
              <Badge variant="outline" className="capitalize">{order.delivery_option || 'standard'}</Badge>
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
            <CardContent className="space-y-4">
              {shipment ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Shipment Created</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {shipment.shiprocket_order_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order ID</span>
                        <span>{shipment.shiprocket_order_id}</span>
                      </div>
                    )}
                    {shipment.awb_code && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AWB Code</span>
                        <span className="font-mono">{shipment.awb_code}</span>
                      </div>
                    )}
                    {shipment.courier_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Courier</span>
                        <span>{shipment.courier_name}</span>
                      </div>
                    )}
                    {shipment.status && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant="outline">{shipment.status}</Badge>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href="https://app.shiprocket.in/orders" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" /> View in Shiprocket
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {!shiprocketConfigured && (
                    <p className="text-sm text-muted-foreground">
                      Configure Shiprocket in Integrations to create shipments.
                    </p>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    disabled={disabled || !canCreateShipment || creatingShipment}
                    onClick={createShipment}
                  >
                    {creatingShipment ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                    ) : (
                      <><Truck className="w-4 h-4 mr-2" /> Create Shiprocket Shipment</>
                    )}
                  </Button>
                  {!canCreateShipment && shiprocketConfigured && order.status === 'pending' && (
                    <p className="text-xs text-muted-foreground">Confirm the order first to create a shipment.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
