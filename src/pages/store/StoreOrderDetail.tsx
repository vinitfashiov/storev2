import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabaseStore } from '@/integrations/supabase/storeClient';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import { useCustomDomain } from '@/contexts/CustomDomainContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, User, CheckCircle, Circle, Truck } from 'lucide-react';
import { format } from 'date-fns';
import ReturnRequestDialog from '@/components/storefront/ReturnRequestDialog';
import CancelOrderDialog from '@/components/storefront/CancelOrderDialog';

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
  tenant_id: string;
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

interface Shipment {
  shiprocket_order_id: string | null;
  awb_code: string | null;
  courier_name: string | null;
  status: string | null;
}



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
  const { slug: paramSlug, orderId } = useParams<{ slug: string; orderId: string }>();
  const { customer, loading: authLoading } = useStoreAuth();
  const { isCustomDomain, tenant: cdTenant } = useCustomDomain();
  const slug = isCustomDomain ? cdTenant?.store_slug : paramSlug;
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${slug}${cleanPath}`;
  };

  useEffect(() => {
    const fetchOrder = async () => {
      if (!customer || !orderId) {
        setLoading(false);
        return;
      }

      const [orderRes, itemsRes, shipmentRes] = await Promise.all([
        supabaseStore
          .from('orders')
          .select('*, tenant_id') // Ensure tenant_id is selected. accessing * usually selects all but explicit is good.
          .eq('id', orderId)
          .eq('customer_id', customer.id)
          .single(),
        supabaseStore
          .from('order_items')
          .select('*')
          .eq('order_id', orderId),
        supabaseStore
          .from('shiprocket_shipments')
          .select('shiprocket_order_id, awb_code, courier_name, status')
          .eq('order_id', orderId)
          .maybeSingle()
      ]);

      if (orderRes.data) {
        const shippingAddr = typeof orderRes.data.shipping_address === 'object' && orderRes.data.shipping_address !== null
          ? orderRes.data.shipping_address as Record<string, string>
          : {};
        setOrder({ ...orderRes.data, shipping_address: shippingAddr } as unknown as Order);
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
            <Link to={getLink('/login')}>
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
            <Link to={getLink('/account/orders')}>
              <Button variant="outline">Back to Orders</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }


  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="container mx-auto px-4 py-8 lg:py-12 max-w-3xl flex-1">
        <div className="mb-8">
          <Link to={getLink('/account/orders')} className="flex items-center gap-2 text-neutral-500 hover:text-black transition-colors w-fit mb-6">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-widest">Back to orders</span>
          </Link>
          <h1 className="text-3xl font-serif text-neutral-900 tracking-tight">Order #{order.order_number}</h1>
        </div>

        <div className="bg-neutral-50 p-6 md:p-8 mb-8 border border-neutral-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-1">Placed On</p>
              <p className="font-medium text-neutral-900 text-lg">{format(new Date(order.created_at), 'MMM d, yyyy')}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-1">Total Amount</p>
              <p className="font-medium text-neutral-900 text-lg">₹{order.total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-8">
          {order.status === 'delivered' && (!order.return_status || order.return_status === 'none') && (
            <Button variant="outline" className="rounded-none border-neutral-200 text-neutral-600 hover:text-black hover:border-black transition-colors uppercase tracking-widest text-xs font-semibold py-6 px-6 h-auto" onClick={() => setIsReturnOpen(true)}>
              Request Return
            </Button>
          )}
          {['pending', 'confirmed'].includes(order.status) && (
            <Button variant="outline" className="rounded-none border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors uppercase tracking-widest text-xs font-semibold py-6 px-6 h-auto" onClick={() => setIsCancelOpen(true)}>
              Cancel Order
            </Button>
          )}

          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            {!order.return_status && (
              <span className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest border ${isCancelled ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                {order.status}
              </span>
            )}
          </div>
        </div>

        {/* Detailed Return/Refund Status Banners */}
        {order.return_status && order.return_status !== 'none' && (
          <div className={`mb-12 p-6 md:p-8 border ${order.return_status === 'rejected' ? 'bg-red-50 border-red-200 text-red-800' :
            order.return_status === 'returned' ? 'bg-green-50 border-green-200 text-green-800' :
              order.return_status === 'approved' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                'bg-orange-50 border-orange-200 text-orange-800'
            }`}>
            <h3 className="font-serif text-xl mb-3 capitalize">
              {order.return_status === 'requested' && 'Return Requested'}
              {order.return_status === 'approved' && 'Return Approved'}
              {order.return_status === 'rejected' && 'Return Rejected'}
              {order.return_status === 'returned' && 'Return Completed'}
            </h3>
            <p className="text-sm opacity-90 leading-relaxed max-w-lg">
              {order.return_status === 'requested' && 'We have received your return request and are reviewing it. You will be notified once it is approved.'}
              {order.return_status === 'approved' && 'Your return request has been approved. Our delivery partner will contact you soon for pickup.'}
              {order.return_status === 'rejected' && 'Your return request has been rejected. Please contact support for more details.'}
              {order.return_status === 'returned' && 'Your return has been processed successfully.'}
            </p>

            {order.refund_status && order.refund_status !== 'none' && (
              <div className="mt-6 pt-6 border-t border-current/10 flex items-center gap-4">
                <span className="text-xs uppercase tracking-widest font-semibold opacity-70">Refund Status</span>
                <span className="text-sm font-medium capitalize py-1.5 px-4 border border-current/20 bg-white/50">
                  {order.refund_status.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Status Timeline */}
        {!isCancelled && (
          <div className="mb-12">
            <h2 className="font-serif text-xl text-neutral-900 mb-6">Tracking Details</h2>
            <div className="border border-neutral-200 p-6 md:p-8">
              <div className="mb-8">
                <h3 className="font-medium text-lg text-neutral-900 mb-1">
                  {(() => {
                    if (order.status === 'delivered') return 'Delivered';
                    if (order.status === 'shipped') return 'On the way';
                    if (order.status === 'packed') return 'Ready to ship';
                    if (order.status === 'confirmed') return 'Order Confirmed';
                    return 'Order Placed';
                  })()}
                </h3>
                <p className="text-sm text-neutral-500">
                  {order.status === 'delivered' ? 'Your order has been delivered' :
                    'Estimated Delivery: ' + format(new Date(new Date(order.created_at).setDate(new Date(order.created_at).getDate() + 5)), 'MMM d, yyyy')}
                </p>
              </div>

              <div className="relative pl-2 mt-8">
                {(() => {
                  const steps = [
                    { key: 'placed', label: 'Order Placed', date: order.created_at, color: 'green' },
                    { key: 'middle', label: 'Order Confirmed', date: null, color: 'green' },
                    { key: 'delivered', label: 'Delivered', date: null, color: 'green' }
                  ];

                  let activeStepIndex = 0;

                  if (order.status === 'pending') {
                    steps[1].label = 'Order Confirmed';
                    activeStepIndex = 0;
                  } else if (order.status === 'confirmed') {
                    steps[1].label = 'Order Confirmed';
                    activeStepIndex = 1;
                  } else if (order.status === 'packed') {
                    steps[1].label = 'Packed';
                    activeStepIndex = 1;
                  } else if (order.status === 'shipped') {
                    steps[1].label = 'Shipped';
                    activeStepIndex = 1;
                  } else if (order.status === 'delivered') {
                    steps[1].label = 'Shipped';
                    activeStepIndex = 2;
                  }

                  if (order.return_status && order.return_status !== 'none') {
                    steps[1].label = 'Shipped';
                    activeStepIndex = 3;

                    let returnLabel = 'Return Requested';
                    if (order.return_status === 'requested') returnLabel = 'Return Requested';
                    else if (order.return_status === 'approved') returnLabel = 'Return Approved';
                    else if (order.return_status === 'rejected') returnLabel = 'Return Rejected';
                    else if (order.return_status === 'returned') returnLabel = 'Returned';

                    if (order.refund_status === 'succeeded' || order.refund_status === 'processed') {
                      returnLabel = 'Refunded';
                    }

                    steps.push({ key: 'return', label: returnLabel, date: null, color: 'red' });
                  }

                  return steps.map((step, index) => {
                    const isCompleted = index <= activeStepIndex;
                    const isLast = index === steps.length - 1;
                    const isReturnStep = step.key === 'return';

                    let stepColorClass = 'bg-neutral-100 text-neutral-400 border-neutral-300';
                    let lineColorClass = 'bg-neutral-200';

                    if (isCompleted) {
                      if (isReturnStep) {
                        stepColorClass = 'bg-red-600 text-white border-red-600';
                      } else {
                        stepColorClass = 'bg-black text-white border-black';
                      }
                    }

                    if (index < activeStepIndex) {
                      lineColorClass = 'bg-black';
                    }

                    return (
                      <div key={step.key} className="flex gap-6 pb-12 last:pb-0 relative">
                        {!isLast && (
                          <div className={`absolute left-[11px] top-7 bottom-[-8px] w-px ${lineColorClass}`} />
                        )}

                        <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 mt-0.5 ${stepColorClass}`}>
                          {isCompleted ? (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          ) : null}
                        </div>

                        <div>
                          <h4 className={`font-medium ${isCompleted ? 'text-neutral-900' : 'text-neutral-400'} ${isReturnStep ? 'text-red-600' : ''}`}>
                            {step.label}
                          </h4>
                          {step.date && isCompleted && (
                            <p className="text-sm text-neutral-500 mt-1">
                              {format(new Date(step.date), 'MMMM d, yyyy, h:mm a')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Shipment Info */}
        {shipment && (
          <div className="mb-12">
            <h2 className="font-serif text-xl text-neutral-900 mb-6">Courier Details</h2>
            <div className="border border-neutral-200 p-6 md:p-8 space-y-4">
              {shipment.courier_name && (
                <div className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
                  <span className="text-sm text-neutral-500 uppercase tracking-widest font-semibold">Courier</span>
                  <span className="font-medium text-neutral-900">{shipment.courier_name}</span>
                </div>
              )}
              {shipment.awb_code && (
                <div className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
                  <span className="text-sm text-neutral-500 uppercase tracking-widest font-semibold">AWB Code</span>
                  <span className="font-mono text-neutral-900">{shipment.awb_code}</span>
                </div>
              )}
              {shipment.status && (
                <div className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
                  <span className="text-sm text-neutral-500 uppercase tracking-widest font-semibold">Status</span>
                  <span className="px-3 py-1 text-xs font-bold uppercase tracking-widest border border-neutral-200 text-neutral-700 bg-neutral-50">
                    {shipment.status}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="mb-12">
          <h2 className="font-serif text-xl text-neutral-900 mb-6 flex items-center gap-3">
            <Package className="w-5 h-5 text-neutral-400" />
            Order Items
          </h2>
          <div className="border border-neutral-200">
            <div className="px-6 md:px-8 py-2">
              {items.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6 border-b border-neutral-100 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900 mb-1">{item.name}</p>
                    <p className="text-sm text-neutral-500">Qty: {item.qty} × ₹{item.unit_price.toFixed(2)}</p>
                  </div>
                  <p className="font-medium text-neutral-900">₹{item.line_total.toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="bg-neutral-50 p-6 md:p-8 space-y-3 text-sm border-t border-neutral-200">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Shipping</span>
                <span>{order.delivery_fee === 0 ? 'FREE' : `₹${order.delivery_fee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-medium text-lg pt-4 border-t border-neutral-200 text-neutral-900 mt-4">
                <span>Total</span>
                <span>₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment & Shipping */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="font-serif text-xl text-neutral-900 mb-6">Payment</h2>
            <div className="border border-neutral-200 p-6 md:p-8 h-[calc(100%-3rem)] flex flex-col justify-center space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
                <span className="text-sm text-neutral-500 uppercase tracking-widest font-semibold">Method</span>
                <span className="font-medium text-neutral-900 uppercase tracking-widest text-xs">{order.payment_method}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500 uppercase tracking-widest font-semibold">Status</span>
                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest border ${order.payment_status === 'paid'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-orange-50 text-orange-700 border-orange-200'
                  }`}>
                  {order.payment_status}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-xl text-neutral-900 mb-6">Shipping Address</h2>
            <div className="border border-neutral-200 p-6 md:p-8 h-[calc(100%-3rem)] bg-neutral-50 text-neutral-700 text-sm leading-relaxed">
              <p className="font-medium text-neutral-900 text-base mb-2">{customer.name}</p>
              <p>{order.shipping_address.line1}</p>
              {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
              <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}</p>
              <p className="mt-4 pt-4 border-t border-neutral-200/60 font-medium text-neutral-900">
                Phone: {customer.phone}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ReturnRequestDialog
        orderId={orderId}
        orderNumber={order ? order.order_number : ''}
        isOpen={isReturnOpen}
        onOpenChange={setIsReturnOpen}
        onSuccess={() => window.location.reload()}
        tenantId={order?.tenant_id || cdTenant?.id || ''}
        customerId={customer?.id || ''}
      />

      <CancelOrderDialog
        orderId={orderId}
        orderNumber={order ? order.order_number : ''}
        isOpen={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
