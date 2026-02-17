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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center relative mb-6">
          <Link to={getLink('/account/orders')} className="absolute left-0 p-2 -ml-2 text-foreground hover:bg-muted rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="flex-1 text-center text-xl font-bold">Order Summary</h1>
        </div>

        <div className="bg-card rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Order Number</p>
              <p className="font-medium text-base">{order.order_number}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Total</p>
              <p className="font-medium text-base">₹{order.total.toFixed(2)}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Placed</p>
            <p className="font-medium text-base">{format(new Date(order.created_at), 'd MMM, yyyy')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          {order.status === 'delivered' && (!order.return_status || order.return_status === 'none') && (
            <Button variant="outline" className="w-full" onClick={() => setIsReturnOpen(true)}>
              Request Return
            </Button>
          )}
          {['pending', 'confirmed'].includes(order.status) && (
            <Button variant="destructive" onClick={() => setIsCancelOpen(true)}>
              Cancel Order
            </Button>
          )}

          {/* Detailed Return/Refund Status Banners */}
          {order.return_status && order.return_status !== 'none' && (
            <div className={`mb-6 p-4 rounded-lg border ${order.return_status === 'rejected' ? 'bg-red-50 border-red-200 text-red-800' :
              order.return_status === 'returned' ? 'bg-green-50 border-green-200 text-green-800' :
                order.return_status === 'approved' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                  'bg-orange-50 border-orange-200 text-orange-800'
              }`}>
              <h3 className="font-semibold mb-1 capitalize">
                {order.return_status === 'requested' && 'Return Requested'}
                {order.return_status === 'approved' && 'Return Approved'}
                {order.return_status === 'rejected' && 'Return Rejected'}
                {order.return_status === 'returned' && 'Return Completed'}
              </h3>
              <p className="text-sm">
                {order.return_status === 'requested' && 'We have received your return request and are reviewing it. You will be notified once it is approved.'}
                {order.return_status === 'approved' && 'Your return request has been approved. Our delivery partner will contact you soon for pickup.'}
                {order.return_status === 'rejected' && 'Your return request has been rejected. Please contact support for more details.'}
                {order.return_status === 'returned' && 'Your return has been processed successfully.'}
              </p>

              {order.refund_status && order.refund_status !== 'none' && (
                <div className="mt-2 pt-2 border-t border-black/10 flex items-center gap-2">
                  <span className="font-medium text-sm">Refund Status:</span>
                  <Badge variant="outline" className="bg-white/50 border-black/20 text-inherit capitalize">
                    {order.refund_status.replace('_', ' ')}
                  </Badge>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {!order.return_status && (
              <Badge className={isCancelled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                {order.status.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        {/* Status Timeline */}
        {!isCancelled && (
          <Card className="mb-6 border-none shadow-none bg-transparent">
            <CardContent className="p-0">
              <div className="bg-card rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {(() => {
                        if (order.status === 'delivered') return 'Delivered';
                        if (order.status === 'shipped') return 'On the way';
                        if (order.status === 'packed') return 'Ready to ship';
                        if (order.status === 'confirmed') return 'Order Confirmed';
                        return 'Order Placed';
                      })()}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {order.status === 'delivered' ? 'Your order has been delivered' :
                        'Estimated Delivery Date: ' + format(new Date(new Date(order.created_at).setDate(new Date(order.created_at).getDate() + 5)), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="relative pl-2">
                  {(() => {
                    // Logic for 3-step sliding window + Optional 4th Step for Returns
                    // Nodes: Placed -> [Middle] -> Delivered -> [Return Status]

                    const steps = [
                      { key: 'placed', label: 'Order Placed', date: order.created_at, color: 'green' },
                      { key: 'middle', label: 'Order Confirmed', date: null, color: 'green' },
                      { key: 'delivered', label: 'Delivered', date: null, color: 'green' }
                    ];

                    let activeStepIndex = 0; // 0: Placed, 1: Middle, 2: Delivered, 3: Return Status

                    // Determine Middle Node Label and Active State for Order Flow
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
                      steps[1].label = 'Shipped'; // History state
                      activeStepIndex = 2; // All done
                    }

                    // Check for Return Status - Adds 4th Step
                    if (order.return_status && order.return_status !== 'none') {
                      // If return is active, assume Order Flow is complete (all 3 steps active/green)
                      // Unless it's a weird state where return requested before delivery?
                      // Safe assumption: Return implies delivery happened or is irrelevant now.
                      steps[1].label = 'Shipped';
                      activeStepIndex = 3; // Focus on Return Step

                      let returnLabel = 'Return Requested';
                      // let returnDate = null; // We don't have explicit date field in this view for return yet, can use updated_at if available

                      if (order.return_status === 'requested') {
                        returnLabel = 'Return Requested';
                      } else if (order.return_status === 'approved') {
                        returnLabel = 'Return Approved';
                      } else if (order.return_status === 'rejected') {
                        returnLabel = 'Return Rejected';
                      } else if (order.return_status === 'returned') {
                        returnLabel = 'Returned';
                      }

                      if (order.refund_status === 'succeeded' || order.refund_status === 'processed') {
                        returnLabel = 'Refunded';
                      }

                      steps.push({
                        key: 'return',
                        label: returnLabel,
                        date: null,
                        color: 'red'
                      });
                    }

                    return steps.map((step, index) => {
                      const isCompleted = index <= activeStepIndex;
                      const isLast = index === steps.length - 1;

                      // For return step (index 3), it's always "active" if it exists in this logic
                      // But we want to distinguish "completed" vs "pending" if we had more granularity.
                      // With current requirement: "4th one will be red color".

                      const isReturnStep = step.key === 'return';
                      // const isReturnActive = isReturnStep; // It's always active if present

                      // Special visual logic:
                      // If Return Step exists:
                      // - Steps 0, 1, 2 should be GREEN and COMPLETED.
                      // - Step 3 should be RED and ACTIVE.

                      let stepColorClass = 'bg-muted text-muted-foreground';
                      let lineColorClass = 'bg-muted';

                      if (isCompleted) {
                        if (isReturnStep) {
                          stepColorClass = 'bg-red-500 text-white'; // Return step is RED
                        } else {
                          stepColorClass = 'bg-green-600 text-white'; // Normal steps are GREEN
                        }
                      }

                      // Line color logic
                      if (index < activeStepIndex) {
                        // If current line goes TO a return step, it connects Green -> Red?
                        // User: "extended 4th one will be red color"
                        // Usually the line leading TO the red step might be green (completed flow) or red (entering return).
                        // Let's make it Green since 'Delivered' was Green.

                        if (steps[index + 1]?.key === 'return') {
                          lineColorClass = 'bg-green-600'; // Connection to return is green (flow complete)
                        } else {
                          lineColorClass = 'bg-green-600';
                        }
                      }

                      // Special check for connection FROM red step? (None, it's last)

                      return (
                        <div key={step.key} className="flex gap-4 pb-8 last:pb-0 relative">
                          {/* Vertical Line */}
                          {!isLast && (
                            <div className={`absolute left-[11px] top-8 bottom-0 w-0.5 ${lineColorClass}`} />
                          )}

                          {/* Icon */}
                          <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${stepColorClass}`}>
                            {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                          </div>

                          {/* Content */}
                          <div className="-mt-1">
                            <h4 className={`font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'} ${isReturnStep ? 'text-red-900' : ''}`}>
                              {step.label}
                            </h4>
                            {step.date && isCompleted && (
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(step.date), 'MMM d, yyyy')}
                              </p>
                            )}
                            {!isCompleted && step.key === 'middle' && (
                              <p className="text-sm text-muted-foreground">Not Yet</p>
                            )}
                            {!isCompleted && step.key === 'delivered' && (
                              <p className="text-sm text-muted-foreground">Not Yet</p>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Removed Separate Return Tracking Section */}
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
