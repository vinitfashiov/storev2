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
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import { toast } from 'sonner';
import { CreditCard, Truck, Loader2, Zap, Clock, AlertTriangle, MapPin, BookOpen, Tag, X, Check } from 'lucide-react';

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
interface CustomerAddress {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

interface AppliedCoupon {
  coupon_id: string;
  coupon_code: string;
  coupon_type: 'percent' | 'fixed';
  coupon_value: number;
  discount_amount: number;
}

declare global {
  interface Window { Razorpay: any; }
}

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { customer } = useStoreAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [submitting, setSubmitting] = useState(false);
  const [razorpayConfigured, setRazorpayConfigured] = useState<boolean | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', line1: '', line2: '', city: '', state: '', pincode: '' });
  
  // Customer addresses state
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  
  // Grocery-specific state
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [deliveryOption, setDeliveryOption] = useState<'asap' | 'slot'>('asap');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [zoneError, setZoneError] = useState<string>('');
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState('');

  const { cart, getSubtotal, clearCart } = useCart(slug || '', tenant?.id || null);

  useEffect(() => {
    const fetchTenant = async () => {
      if (!slug) return;
      const { data } = await supabase.from('tenants').select('id, store_name, store_slug, business_type').eq('store_slug', slug).eq('is_active', true).maybeSingle();
      if (data) {
        setTenant(data as Tenant);
        // Check if Razorpay is configured - must have both key_id AND key_secret
        const { data: integration } = await supabase
          .from('tenant_integrations')
          .select('razorpay_key_id, razorpay_key_secret')
          .eq('tenant_id', data.id)
          .maybeSingle();
        const hasRazorpay = !!(integration?.razorpay_key_id && integration?.razorpay_key_secret);
        setRazorpayConfigured(hasRazorpay);
        console.log('Razorpay configured:', hasRazorpay, integration);
        
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

  // Prefill customer data when logged in
  useEffect(() => {
    if (customer) {
      setForm(prev => ({
        ...prev,
        name: customer.name || prev.name,
        phone: customer.phone || prev.phone,
        email: customer.email || prev.email
      }));
    }
  }, [customer]);

  // Fetch saved addresses when customer is logged in
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!customer) {
        setSavedAddresses([]);
        return;
      }
      const { data } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', customer.id)
        .order('is_default', { ascending: false });
      
      if (data && data.length > 0) {
        setSavedAddresses(data);
        const defaultAddr = data.find(a => a.is_default) || data[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          setForm(prev => ({
            ...prev,
            line1: defaultAddr.line1,
            line2: defaultAddr.line2 || '',
            city: defaultAddr.city,
            state: defaultAddr.state,
            pincode: defaultAddr.pincode
          }));
        }
      }
    };
    fetchAddresses();
  }, [customer]);

  // Handle address selection change
  const handleAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId);
    if (addressId === 'new') {
      setForm(prev => ({ ...prev, line1: '', line2: '', city: '', state: '', pincode: '' }));
    } else {
      const addr = savedAddresses.find(a => a.id === addressId);
      if (addr) {
        setForm(prev => ({
          ...prev,
          line1: addr.line1,
          line2: addr.line2 || '',
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode
        }));
      }
    }
  };

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
  
  // Re-validate coupon when subtotal changes
  useEffect(() => {
    if (appliedCoupon && subtotal > 0) {
      // Recalculate discount if coupon is applied
      let newDiscount = 0;
      if (appliedCoupon.coupon_type === 'percent') {
        newDiscount = (subtotal * appliedCoupon.coupon_value) / 100;
      } else {
        newDiscount = appliedCoupon.coupon_value;
      }
      if (newDiscount > subtotal) newDiscount = subtotal;
      
      if (newDiscount !== appliedCoupon.discount_amount) {
        setAppliedCoupon({ ...appliedCoupon, discount_amount: newDiscount });
      }
    }
  }, [subtotal]);
  
  // Calculate delivery fee for grocery
  const calculateDeliveryFee = () => {
    if (!isGrocery || !deliverySettings) return 0;
    if (deliverySettings.free_delivery_above && subtotal >= deliverySettings.free_delivery_above) return 0;
    return deliverySettings.delivery_fee;
  };
  
  const deliveryFee = calculateDeliveryFee();
  const discountTotal = appliedCoupon?.discount_amount || 0;
  const total = subtotal + deliveryFee - discountTotal;
  const meetsMinOrder = !isGrocery || !deliverySettings?.min_order_amount || subtotal >= deliverySettings.min_order_amount;

  // Filter slots by zone
  const availableSlots = slots.filter(s => !s.zone_id || s.zone_id === selectedZone?.id);

  // Apply coupon handler
  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !slug) return;
    
    setCouponLoading(true);
    setCouponError('');
    
    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: {
          store_slug: slug,
          coupon_code: couponCode.trim(),
          cart_subtotal: subtotal,
          customer_id: customer?.id || null
        }
      });
      
      if (error) throw error;
      
      if (data.valid) {
        setAppliedCoupon({
          coupon_id: data.coupon_id,
          coupon_code: data.coupon_code,
          coupon_type: data.coupon_type,
          coupon_value: data.coupon_value,
          discount_amount: data.discount_amount
        });
        setCouponCode('');
        toast.success(data.message);
      } else {
        setCouponError(data.error || 'Invalid coupon');
      }
    } catch (err: any) {
      console.error('Coupon error:', err);
      setCouponError('Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    toast.info('Coupon removed');
  };

  const handleRazorpayPayment = async (paymentIntentId: string, orderNumber: string, amount: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: { store_slug: slug, payment_intent_id: paymentIntentId }
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || 'Failed to create payment order');
      const { key_id, razorpay_order_id, currency } = data;

      const options = {
        key: key_id, 
        amount: Math.round(amount * 100), 
        currency,
        name: tenant?.store_name || 'Store',
        description: `Order ${orderNumber}`,
        order_id: razorpay_order_id,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: { 
                store_slug: slug, 
                payment_intent_id: paymentIntentId, 
                ...response 
              }
            });
            if (verifyError || !verifyData?.success) throw new Error(verifyData?.error || 'Payment verification failed');
            await clearCart();
            toast.success('Payment successful! Order created.');
            navigate(`/store/${slug}/order-confirmation?order=${verifyData.order_number || orderNumber}`);
          } catch (err: any) { 
            toast.error(err.message || 'Payment verification failed'); 
            setSubmitting(false);
          }
        },
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#3399cc' },
        modal: { 
          ondismiss: async () => { 
            await supabase
              .from('payment_intents')
              .update({ status: 'cancelled' })
              .eq('id', paymentIntentId);
            toast.error('Payment cancelled. No order was created.'); 
            setSubmitting(false); 
          } 
        }
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      await supabase
        .from('payment_intents')
        .update({ status: 'failed' })
        .eq('id', paymentIntentId);
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
      const commonOrderData = {
        order_number: orderNumber,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_email: form.email || null,
        customer_id: customer?.id || null,
        shipping_address: { line1: form.line1, line2: form.line2, city: form.city, state: form.state, pincode: form.pincode },
        subtotal,
        delivery_fee: deliveryFee,
        discount_total: discountTotal,
        total,
        delivery_zone_id: selectedZone?.id || null,
        delivery_slot_id: deliveryOption === 'slot' ? selectedSlotId || null : null,
        delivery_option: isGrocery ? deliveryOption : 'standard',
        coupon_id: appliedCoupon?.coupon_id || null,
        coupon_code: appliedCoupon?.coupon_code || null,
        items: cart.items.map(item => ({
          product_id: item.product_id,
          variant_id: (item as any).variant_id || null,
          name: item.product?.name || 'Product',
          qty: item.qty,
          unit_price: item.unit_price,
          stock_qty: item.product?.stock_qty || 0
        }))
      };

      if (paymentMethod === 'razorpay') {
        const { data: paymentIntent, error: piError } = await supabase
          .from('payment_intents')
          .insert({
            tenant_id: tenant.id,
            store_slug: slug,
            cart_id: cart.id,
            draft_order_data: commonOrderData,
            amount: total,
            currency: 'INR',
            status: 'initiated'
          })
          .select()
          .single();

        if (piError || !paymentIntent) {
          throw new Error('Failed to initiate payment');
        }

        await handleRazorpayPayment(paymentIntent.id, orderNumber, total);
      } else {
        // For COD: Create order directly
        const { data: order, error: orderError } = await supabase.from('orders').insert({
          tenant_id: tenant.id,
          order_number: orderNumber,
          customer_id: customer?.id || null,
          customer_name: form.name,
          customer_phone: form.phone,
          customer_email: form.email || null,
          shipping_address: { line1: form.line1, line2: form.line2, city: form.city, state: form.state, pincode: form.pincode },
          subtotal,
          delivery_fee: deliveryFee,
          discount_total: discountTotal,
          total,
          payment_method: paymentMethod,
          status: 'pending',
          payment_status: 'unpaid',
          delivery_zone_id: selectedZone?.id || null,
          delivery_slot_id: deliveryOption === 'slot' ? selectedSlotId || null : null,
          delivery_option: isGrocery ? deliveryOption : 'standard',
          coupon_id: appliedCoupon?.coupon_id || null,
          coupon_code: appliedCoupon?.coupon_code || null
        }).select().single();

        if (orderError) throw orderError;

        for (const item of cart.items) {
          const variantId = (item as any).variant_id || null;
          await supabase.from('order_items').insert({
            tenant_id: tenant.id, 
            order_id: order.id, 
            product_id: item.product_id,
            variant_id: variantId,
            name: item.product?.name || 'Product', 
            qty: item.qty,
            unit_price: item.unit_price, 
            line_total: item.unit_price * item.qty
          });

          // Create inventory movement for ledger tracking
          await supabase.from('inventory_movements').insert({
            tenant_id: tenant.id,
            product_id: item.product_id,
            variant_id: variantId,
            movement_type: 'sale',
            quantity: -item.qty,
            reference_type: 'order',
            reference_id: order.id,
            notes: `Online order ${orderNumber}`,
          });
          
          // Reduce stock from variant or product
          if (variantId) {
            const { data: variant } = await supabase.from('product_variants').select('stock_qty').eq('id', variantId).single();
            if (variant) {
              await supabase.from('product_variants').update({ stock_qty: Math.max(0, variant.stock_qty - item.qty) }).eq('id', variantId);
            }
          } else {
            const currentStock = item.product?.stock_qty || 0;
            await supabase.from('products').update({ stock_qty: Math.max(0, currentStock - item.qty) }).eq('id', item.product_id);
          }
        }

        // Record coupon redemption
        if (appliedCoupon) {
          await supabase.from('coupon_redemptions').insert({
            tenant_id: tenant.id,
            coupon_id: appliedCoupon.coupon_id,
            order_id: order.id,
            customer_id: customer?.id || null,
            discount_amount: discountTotal
          });
          // Increment used_count manually
          const { data: currentCoupon } = await supabase.from('coupons').select('used_count').eq('id', appliedCoupon.coupon_id).single();
          if (currentCoupon) {
            await supabase.from('coupons').update({ used_count: currentCoupon.used_count + 1 }).eq('id', appliedCoupon.coupon_id);
          }
        }

        await supabase.from('carts').update({ status: 'converted' }).eq('id', cart.id);
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
                {customer && savedAddresses.length > 0 && (
                  <div className="mb-4">
                    <Label className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4" /> Saved Addresses
                    </Label>
                    <Select value={selectedAddressId} onValueChange={handleAddressChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an address" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedAddresses.map(addr => (
                          <SelectItem key={addr.id} value={addr.id}>
                            {addr.label}: {addr.line1}, {addr.city} - {addr.pincode}
                          </SelectItem>
                        ))}
                        <SelectItem value="new">+ Enter new address</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
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

            {/* Coupon Section */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Tag className="w-4 h-4" /> Apply Coupon</CardTitle></CardHeader>
              <CardContent>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-400">{appliedCoupon.coupon_code}</span>
                      <span className="text-sm text-green-600 dark:text-green-400">
                        {appliedCoupon.coupon_type === 'percent' ? `${appliedCoupon.coupon_value}% off` : `₹${appliedCoupon.coupon_value} off`}
                      </span>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={removeCoupon}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Enter coupon code" 
                        value={couponCode} 
                        onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                      >
                        {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-sm text-destructive">{couponError}</p>
                    )}
                  </div>
                )}
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
                  <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                  {isGrocery && (
                    <div className="flex justify-between">
                      <span>Delivery</span>
                      <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}</span>
                    </div>
                  )}
                  {discountTotal > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{discountTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span><span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg" 
              disabled={submitting || cart.items.length === 0 || (isGrocery && (!meetsMinOrder || (zones.length > 0 && !selectedZone)))}
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : paymentMethod === 'razorpay' ? (
                `Pay ₹${total.toFixed(2)}`
              ) : (
                'Place Order (COD)'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}