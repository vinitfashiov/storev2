import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { CreditCard, Truck, Loader2, Zap, Clock, AlertTriangle, MapPin } from 'lucide-react';

interface Tenant { id: string; store_name: string; store_slug: string; business_type: 'ecommerce' | 'grocery'; }

interface DeliverySettings {
  delivery_mode: 'slots' | 'asap' | 'both';
  asap_eta_minutes: number;
  min_order_amount: number;
  delivery_fee: number;
  free_delivery_above: number | null;
}

interface DeliveryZone { id: string; name: string; pincodes: string[]; }
interface DeliverySlot { id: string; label: string; zone_id: string | null; }

declare global {
  interface Window { Razorpay: any; }
}

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [submitting, setSubmitting] = useState(false);
  const [razorpayConfigured, setRazorpayConfigured] = useState<boolean | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', line1: '', line2: '', city: '', state: '', pincode: '' });
  
  // Grocery-specific state
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [deliveryOption, setDeliveryOption] = useState<'asap' | 'slot'>('asap');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [zoneError, setZoneError] = useState<string>('');

  const { cart, getSubtotal, clearCart } = useCart(slug || '', tenant?.id || null);

  useEffect(() => {
    const fetchTenant = async () => {
      if (!slug) return;
      const { data } = await supabase.from('tenants').select('id, store_name, store_slug, business_type').eq('store_slug', slug).eq('is_active', true).maybeSingle();
      if (data) {
        setTenant(data as Tenant);
        const { data: integration } = await supabase.from('tenant_integrations').select('razorpay_key_id').eq('tenant_id', data.id).maybeSingle();
        setRazorpayConfigured(!!integration?.razorpay_key_id);
        
        // Fetch grocery-specific data
        if (data.business_type === 'grocery') {
          const [settingsRes, zonesRes, slotsRes] = await Promise.all([
            supabase.from('tenant_delivery_settings').select('*').eq('tenant_id', data.id).maybeSingle(),
            supabase.from('delivery_zones').select('id, name, pincodes').eq('tenant_id', data.id).eq('is_active', true),
            supabase.from('delivery_slots').select('id, label, zone_id').eq('tenant_id', data.id).eq('is_active', true)
          ]);
          if (settingsRes.data) {
            setDeliverySettings({
              delivery_mode: settingsRes.data.delivery_mode as 'slots' | 'asap' | 'both',
              asap_eta_minutes: settingsRes.data.asap_eta_minutes,
              min_order_amount: Number(settingsRes.data.min_order_amount),
              delivery_fee: Number(settingsRes.data.delivery_fee),
              free_delivery_above: settingsRes.data.free_delivery_above ? Number(settingsRes.data.free_delivery_above) : null
            });
            // Default delivery option based on mode
            if (settingsRes.data.delivery_mode === 'slots') setDeliveryOption('slot');
            else setDeliveryOption('asap');
          }
          if (zonesRes.data) setZones(zonesRes.data);
          if (slotsRes.data) setSlots(slotsRes.data);
        }
      }
    };
    fetchTenant();
  }, [slug]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // Check pincode for zone match
  useEffect(() => {
    if (!form.pincode || form.pincode.length < 6 || tenant?.business_type !== 'grocery') {
      setSelectedZone(null);
      setZoneError('');
      return;
    }
    const matchedZone = zones.find(z => z.pincodes.includes(form.pincode));
    if (matchedZone) {
      setSelectedZone(matchedZone);
      setZoneError('');
    } else if (zones.length > 0) {
      setSelectedZone(null);
      setZoneError('Delivery not available in your area');
    }
  }, [form.pincode, zones, tenant?.business_type]);

  const isGrocery = tenant?.business_type === 'grocery';
  const subtotal = getSubtotal();
  
  // Calculate delivery fee for grocery
  const calculateDeliveryFee = () => {
    if (!isGrocery || !deliverySettings) return 0;
    if (deliverySettings.free_delivery_above && subtotal >= deliverySettings.free_delivery_above) return 0;
    return deliverySettings.delivery_fee;
  };
  
  const deliveryFee = calculateDeliveryFee();
  const total = subtotal + deliveryFee;
  const meetsMinOrder = !isGrocery || !deliverySettings?.min_order_amount || subtotal >= deliverySettings.min_order_amount;

  // Filter slots by zone
  const availableSlots = slots.filter(s => !s.zone_id || s.zone_id === selectedZone?.id);

  const handleRazorpayPayment = async (orderId: string, orderNumber: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: { store_slug: slug, order_id: orderId }
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || 'Failed to create payment order');
      const { key_id, razorpay_order_id, amount, currency } = data;

      const options = {
        key: key_id, amount, currency,
        name: tenant?.store_name || 'Store',
        description: `Order ${orderNumber}`,
        order_id: razorpay_order_id,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: { store_slug: slug, order_id: orderId, ...response }
            });
            if (verifyError || !verifyData?.success) throw new Error(verifyData?.error || 'Payment verification failed');
            await clearCart();
            toast.success('Payment successful!');
            navigate(`/store/${slug}/order-confirmation?order=${orderNumber}`);
          } catch (err: any) { toast.error(err.message || 'Payment verification failed'); }
        },
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#3399cc' },
        modal: { ondismiss: () => { toast.error('Payment cancelled'); setSubmitting(false); } }
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate payment');
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || !tenant || cart.items.length === 0) return;
    
    // Validations for grocery
    if (isGrocery) {
      if (zones.length > 0 && !selectedZone) {
        toast.error('Please enter a valid delivery pincode');
        return;
      }
      if (!meetsMinOrder) {
        toast.error(`Minimum order amount is ₹${deliverySettings?.min_order_amount}`);
        return;
      }
      if (deliveryOption === 'slot' && !selectedSlotId) {
        toast.error('Please select a delivery slot');
        return;
      }
    }

    setSubmitting(true);
    const orderNumber = `ORD-${Date.now()}`;

    try {
      const { data: order, error: orderError } = await supabase.from('orders').insert({
        tenant_id: tenant.id,
        order_number: orderNumber,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_email: form.email || null,
        shipping_address: { line1: form.line1, line2: form.line2, city: form.city, state: form.state, pincode: form.pincode },
        subtotal,
        delivery_fee: deliveryFee,
        total,
        payment_method: paymentMethod,
        status: 'pending',
        payment_status: 'unpaid',
        delivery_zone_id: selectedZone?.id || null,
        delivery_slot_id: deliveryOption === 'slot' ? selectedSlotId || null : null,
        delivery_option: isGrocery ? deliveryOption : 'standard'
      }).select().single();

      if (orderError) throw orderError;

      for (const item of cart.items) {
        await supabase.from('order_items').insert({
          tenant_id: tenant.id, order_id: order.id, product_id: item.product_id,
          name: item.product?.name || 'Product', qty: item.qty,
          unit_price: item.unit_price, line_total: item.unit_price * item.qty
        });
        const currentStock = item.product?.stock_qty || 0;
        await supabase.from('products').update({ stock_qty: Math.max(0, currentStock - item.qty) }).eq('id', item.product_id);
      }

      await supabase.from('carts').update({ status: 'converted' }).eq('id', cart.id);

      if (paymentMethod === 'razorpay') {
        await handleRazorpayPayment(order.id, orderNumber);
      } else {
        await clearCart();
        toast.success('Order placed successfully!');
        navigate(`/store/${slug}/order-confirmation?order=${orderNumber}`);
        setSubmitting(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order');
      setSubmitting(false);
    }
  };

  if (!tenant || !cart) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-display font-bold mb-6">Checkout</h1>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Contact Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Full Name *</Label><Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div><Label>Phone *</Label><Input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Delivery Address</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Address Line 1 *</Label><Input required value={form.line1} onChange={e => setForm({...form, line1: e.target.value})} /></div>
                <div><Label>Address Line 2</Label><Input value={form.line2} onChange={e => setForm({...form, line2: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>City *</Label><Input required value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></div>
                  <div><Label>State *</Label><Input required value={form.state} onChange={e => setForm({...form, state: e.target.value})} /></div>
                </div>
                <div>
                  <Label>Pincode *</Label>
                  <Input required value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} maxLength={6} />
                  {isGrocery && zones.length > 0 && (
                    <div className="mt-2">
                      {selectedZone ? (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Delivering to: {selectedZone.name}
                        </p>
                      ) : zoneError && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {zoneError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Grocery Delivery Options */}
            {isGrocery && deliverySettings && (
              <Card>
                <CardHeader><CardTitle>Delivery Option</CardTitle></CardHeader>
                <CardContent>
                  <RadioGroup value={deliveryOption} onValueChange={(v) => setDeliveryOption(v as 'asap' | 'slot')}>
                    {(deliverySettings.delivery_mode === 'asap' || deliverySettings.delivery_mode === 'both') && (
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="asap" id="asap" />
                        <Label htmlFor="asap" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Zap className="w-4 h-4 text-orange-500" />
                          <div>
                            <span className="font-medium">Express Delivery</span>
                            <p className="text-sm text-muted-foreground">Deliver in ~{deliverySettings.asap_eta_minutes} mins</p>
                          </div>
                        </Label>
                      </div>
                    )}
                    {(deliverySettings.delivery_mode === 'slots' || deliverySettings.delivery_mode === 'both') && (
                      <div className="flex items-start space-x-2 p-3 border rounded-lg mt-2">
                        <RadioGroupItem value="slot" id="slot" className="mt-1" />
                        <Label htmlFor="slot" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">Scheduled Delivery</span>
                          </div>
                          {deliveryOption === 'slot' && (
                            <Select value={selectedSlotId} onValueChange={setSelectedSlotId}>
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Select time slot" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableSlots.map(slot => (
                                  <SelectItem key={slot.id} value={slot.id}>{slot.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </Label>
                      </div>
                    )}
                  </RadioGroup>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Payment Method</CardTitle></CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer">
                      <Truck className="w-4 h-4" /> Cash on Delivery
                    </Label>
                  </div>
                  <div className={`flex items-center space-x-2 p-3 border rounded-lg mt-2 ${!razorpayConfigured ? 'opacity-50' : ''}`}>
                    <RadioGroupItem value="razorpay" id="razorpay" disabled={!razorpayConfigured} />
                    <Label htmlFor="razorpay" className="flex items-center gap-2 cursor-pointer">
                      <CreditCard className="w-4 h-4" /> Pay Online (Razorpay)
                      {razorpayConfigured === false && <span className="text-xs text-muted-foreground ml-2">(Not configured)</span>}
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Min order warning */}
            {isGrocery && deliverySettings?.min_order_amount > 0 && !meetsMinOrder && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Minimum order amount is ₹{deliverySettings.min_order_amount}. Add ₹{(deliverySettings.min_order_amount - subtotal).toFixed(2)} more.
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm mb-4">
                  {cart.items.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.product?.name} x{item.qty}</span>
                      <span>₹{(item.unit_price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                  {isGrocery && (
                    <div className="flex justify-between text-sm">
                      <span>Delivery</span>
                      <span>
                        {deliveryFee === 0 && deliverySettings?.delivery_fee > 0 ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          `₹${deliveryFee.toFixed(2)}`
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full mt-4" 
                  size="lg" 
                  disabled={submitting || cart.items.length === 0 || !meetsMinOrder || (isGrocery && zones.length > 0 && !selectedZone)}
                >
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : 'Place Order'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
