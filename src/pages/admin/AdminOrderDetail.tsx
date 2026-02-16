import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Truck, Package, Loader2, CheckCircle, ExternalLink, IndianRupee, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import OrderInvoice from '@/components/admin/OrderInvoice';

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
  coupon_code: string | null;
  return_status: string | null;
  refund_status: string | null;
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

interface DeliveryAssignment {
  id: string;
  delivery_boy_id: string | null;
  status: string;
  delivery_boys?: { id: string; full_name: string } | null;
}

interface DeliveryBoy {
  id: string;
  full_name: string;
  mobile_number: string;
  is_active: boolean;
}

interface AdminOrderDetailProps {
  tenantId: string;
  disabled?: boolean;
  isGrocery?: boolean;
}

interface StoreSettings {
  website_title: string | null;
  store_address: string | null;
  store_phone: string | null;
  store_email: string | null;
}

const statusFlow = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];

export default function AdminOrderDetail({ tenantId, disabled, isGrocery }: AdminOrderDetailProps) {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [shipment, setShipment] = useState<ShiprocketShipment | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [shiprocketConfigured, setShiprocketConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingShipment, setCreatingShipment] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  // Delivery assignment state
  const [deliveryAssignment, setDeliveryAssignment] = useState<DeliveryAssignment | null>(null);
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [assigningDelivery, setAssigningDelivery] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      const [orderRes, itemsRes, shipmentRes, integrationRes, storeSettingsRes] = await Promise.all([
        supabase.from('orders').select('*').eq('id', orderId).eq('tenant_id', tenantId).single(),
        supabase.from('order_items').select('*').eq('order_id', orderId),
        supabase.from('shiprocket_shipments').select('*').eq('order_id', orderId).maybeSingle(),
        supabase.from('tenant_integrations').select('shiprocket_email').eq('tenant_id', tenantId).maybeSingle(),
        supabase.from('store_settings').select('website_title, store_address, store_phone, store_email').eq('tenant_id', tenantId).maybeSingle()
      ]);

      if (orderRes.data) {
        const orderData = orderRes.data;
        const shippingAddr = typeof orderData.shipping_address === 'object' && orderData.shipping_address !== null
          ? orderData.shipping_address as Record<string, string>
          : {};
        setOrder({ ...orderData, shipping_address: shippingAddr } as unknown as Order);
      }
      if (itemsRes.data) setItems(itemsRes.data);
      if (shipmentRes.data) setShipment(shipmentRes.data);
      setShiprocketConfigured(!!integrationRes.data?.shiprocket_email);
      if (storeSettingsRes.data) setStoreSettings(storeSettingsRes.data);

      // Fetch grocery-specific data
      if (isGrocery) {
        const [assignmentRes, boysRes] = await Promise.all([
          supabase.from('delivery_assignments').select('id, delivery_boy_id, status, delivery_boys(id, full_name)').eq('order_id', orderId).maybeSingle(),
          supabase.from('delivery_boys').select('id, full_name, mobile_number, is_active').eq('tenant_id', tenantId).eq('is_active', true)
        ]);
        if (assignmentRes.data) setDeliveryAssignment(assignmentRes.data as any);
        if (boysRes.data) setDeliveryBoys(boysRes.data);
      }

      setLoading(false);
    };

    fetchOrder();
  }, [orderId, tenantId, isGrocery]);

  const assignDeliveryBoy = async (deliveryBoyId: string) => {
    if (!deliveryAssignment || !order) return;

    setAssigningDelivery(true);
    try {
      const { error } = await supabase
        .from('delivery_assignments')
        .update({
          delivery_boy_id: deliveryBoyId,
          status: 'assigned',
          assigned_at: new Date().toISOString()
        })
        .eq('id', deliveryAssignment.id);

      if (error) throw error;

      // Log status change
      await supabase.from('delivery_status_logs').insert({
        tenant_id: tenantId,
        assignment_id: deliveryAssignment.id,
        delivery_boy_id: deliveryBoyId,
        old_status: deliveryAssignment.status as any,
        new_status: 'assigned' as const,
        notes: 'Assigned by admin'
      });

      const assignedBoy = deliveryBoys.find(b => b.id === deliveryBoyId);
      setDeliveryAssignment({
        ...deliveryAssignment,
        delivery_boy_id: deliveryBoyId,
        status: 'assigned',
        delivery_boys: assignedBoy ? { id: assignedBoy.id, full_name: assignedBoy.full_name } : null
      });

      toast.success('Delivery boy assigned successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign delivery boy');
    } finally {
      setAssigningDelivery(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!order || disabled) return;

    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
    if (error) { toast.error('Failed to update status'); return; }

    toast.success(`Order ${newStatus}`);
    setOrder({ ...order, status: newStatus });
  };

  const toggleCodPaymentStatus = async () => {
    if (!order || disabled || order.payment_method !== 'cod') return;

    setUpdatingPayment(true);
    const newStatus = order.payment_status === 'paid' ? 'unpaid' : 'paid';

    const { error } = await supabase
      .from('orders')
      .update({ payment_status: newStatus })
      .eq('id', order.id);

    if (error) {
      toast.error('Failed to update payment status');
      setUpdatingPayment(false);
      return;
    }

    toast.success(`Payment marked as ${newStatus}`);
    setOrder({ ...order, payment_status: newStatus });
    setUpdatingPayment(false);
  };

  const createShipment = async () => {
    if (!order || disabled || !shiprocketConfigured) return;

    setCreatingShipment(true);
    try {
      // Ensure we have a valid session (otherwise the function will 401 before it even runs)
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('You are not logged in (session missing). Please log in again and retry.');
      }

      const { data, error } = await supabase.functions.invoke('shiprocket-create-shipment', {
        body: { order_id: order.id }
      });

      if (error) {
        const status = (error as any)?.context?.status;
        const body = (error as any)?.context?.body;
        const bodyText =
          typeof body === 'string'
            ? body
            : body
              ? JSON.stringify(body)
              : '';

        console.error('Shiprocket invoke error:', error, { status, body });

        // Special-case auth failures for clarity
        if (status === 401 || status === 403) {
          throw new Error('Not authorized to create shipment. Please log in again and retry.');
        }

        throw new Error(
          bodyText
            ? `Shiprocket error${status ? ` (${status})` : ''}: ${bodyText}`
            : `Shiprocket error${status ? ` (${status})` : ''}: ${error.message || 'Failed to create shipment'}`
        );
      }

      if (data?.error) {
        console.error('Shiprocket function returned error:', data);
        throw new Error(data.error);
      }

      toast.success('Shipment created successfully!');

      const { data: newShipment } = await supabase
        .from('shiprocket_shipments')
        .select('*')
        .eq('order_id', order.id)
        .maybeSingle();

      if (newShipment) setShipment(newShipment);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create shipment');
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
  const canCreateShipment =
    shiprocketConfigured &&
    !shipment &&
    ['confirmed', 'packed', 'shipped', 'delivered'].includes(order.status) &&
    (order.payment_status === 'paid' || order.payment_method === 'cod');

  const isCod = order.payment_method === 'cod';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/orders">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold">{order.order_number}</h1>
            <p className="text-muted-foreground">{format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}</p>
          </div>
        </div>
        <OrderInvoice
          order={order}
          items={items}
          storeName={storeSettings?.website_title || 'Store'}
          storeAddress={storeSettings?.store_address || undefined}
          storePhone={storeSettings?.store_phone || undefined}
          storeEmail={storeSettings?.store_email || undefined}
        />
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
              {/* Detailed Return/Refund Status Banners */}
              {order.return_status && (
                <div className={`mb-6 p-4 rounded-lg border flex flex-col gap-2 ${order.return_status === 'rejected' ? 'bg-red-50 border-red-200 text-red-800' :
                    order.return_status === 'returned' ? 'bg-green-50 border-green-200 text-green-800' :
                      order.return_status === 'approved' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                        'bg-orange-50 border-orange-200 text-orange-800'
                  }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold capitalize flex items-center gap-2">
                        {order.return_status === 'requested' && 'Return Requested'}
                        {order.return_status === 'approved' && 'Return Approved'}
                        {order.return_status === 'rejected' && 'Return Rejected'}
                        {order.return_status === 'returned' && 'Return Completed'}
                      </h3>
                      <p className="text-sm mt-1">
                        {order.return_status === 'requested' && <span className="font-medium">Action Required: Go to Returns Dashboard to approve/reject.</span>}
                        {order.return_status === 'approved' && 'Waiting for customer to return the item. Once received, process refund.'}
                        {order.return_status === 'rejected' && 'Return request was rejected.'}
                        {order.return_status === 'returned' && 'Return and Refund process completed.'}
                      </p>
                    </div>
                    {order.return_status === 'requested' && (
                      <Link to="/super-admin/returns">
                        <Button size="sm" variant="outline" className="bg-white hover:bg-white/90">
                          Process Return
                        </Button>
                      </Link>
                    )}
                  </div>

                  {order.refund_status && (
                    <div className="pt-2 border-t border-black/10 flex items-center gap-2">
                      <span className="font-medium text-sm">Refund Status:</span>
                      <Badge variant="outline" className="bg-white/50 border-black/20 text-inherit capitalize">
                        {order.refund_status.replace('_', ' ')}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
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

          {/* Delivery Assignment - for grocery stores */}
          {isGrocery && deliveryAssignment && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><UserCheck className="w-4 h-4" /> Delivery Assignment</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={deliveryAssignment.status === 'delivered' ? 'default' : 'secondary'}>
                    {deliveryAssignment.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                {deliveryAssignment.delivery_boys ? (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Assigned To</span>
                    <span className="font-medium">{deliveryAssignment.delivery_boys.full_name}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Not yet assigned</p>
                    <Select
                      onValueChange={assignDeliveryBoy}
                      disabled={disabled || assigningDelivery}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={assigningDelivery ? "Assigning..." : "Select delivery boy"} />
                      </SelectTrigger>
                      <SelectContent>
                        {deliveryBoys.map(boy => (
                          <SelectItem key={boy.id} value={boy.id}>
                            {boy.full_name} ({boy.mobile_number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <Badge variant="outline">{order.payment_method.toUpperCase()}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <Badge className={order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                  {order.payment_status.toUpperCase()}
                </Badge>
              </div>

              {/* COD Payment Toggle */}
              {isCod && (
                <div className="pt-3 border-t">
                  <Button
                    variant={order.payment_status === 'paid' ? 'outline' : 'default'}
                    size="sm"
                    className="w-full"
                    onClick={toggleCodPaymentStatus}
                    disabled={disabled || updatingPayment}
                  >
                    {updatingPayment ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
                    ) : order.payment_status === 'paid' ? (
                      <><IndianRupee className="w-4 h-4 mr-2" /> Mark as Unpaid</>
                    ) : (
                      <><IndianRupee className="w-4 h-4 mr-2" /> Mark COD as Paid</>
                    )}
                  </Button>
                </div>
              )}

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
