import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { supabaseStore } from '@/integrations/supabase/storeClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCart } from '@/hooks/useCart';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import { useStoreAnalyticsEvent } from '@/contexts/StoreAnalyticsContext';
import { toast } from 'sonner';
import { GroceryBottomNav } from '@/components/storefront/grocery/GroceryBottomNav';
import { StoreHeader } from '@/components/storefront/StoreHeader';
import { StoreFooter } from '@/components/storefront/StoreFooter';
import {
  CreditCard, Truck, Loader2, Zap, Clock, AlertTriangle, MapPin,
  Tag, X, Check, ChevronLeft, ChevronRight, Plus, Package, Shield
} from 'lucide-react';
import { useCustomDomain } from '@/contexts/CustomDomainContext';

// Shared singleton for script loading across navigations
let razorpayScriptPromise: Promise<void> | null = null;

async function loadRazorpayScript(): Promise<void> {
  if (typeof window !== 'undefined' && (window as any).Razorpay) return;
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load payment SDK')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load payment SDK'));
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

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
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { tenant: cdTenant, isCustomDomain } = useCustomDomain();

  // Use slug from params or context
  const slug = isCustomDomain ? cdTenant?.store_slug : paramSlug;

  const getLink = (path: string) => {
    if (!slug) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${slug}${cleanPath}`;
  };
  const { customer } = useStoreAuth();
  const { trackEvent } = useStoreAnalyticsEvent();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [submitting, setSubmitting] = useState(false);
  const [razorpayConfigured, setRazorpayConfigured] = useState<boolean | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', line1: '', line2: '', city: '', state: '', pincode: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // Customer addresses state
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

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

  const { cart, itemCount, getSubtotal, clearCart } = useCart(slug || '', tenant?.id || null);

  // Track checkout_started when page loads with cart data
  useEffect(() => {
    if (cart && itemCount > 0 && tenant) {
      trackEvent('checkout_started', { cart_value: getSubtotal(), item_count: itemCount });
    }
    // Only fire once when cart becomes available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!cart, tenant?.id]);

  useEffect(() => {
    const fetchTenant = async () => {
      // Logic for custom domain from context
      if (isCustomDomain && cdTenant) {
        setTenant(cdTenant as Tenant);
        const { data: integration } = await supabaseStore
          .from('tenant_integrations')
          .select('razorpay_key_id, razorpay_key_secret')
          .eq('tenant_id', cdTenant.id)
          .maybeSingle();
        setRazorpayConfigured(!!(integration?.razorpay_key_id && integration?.razorpay_key_secret));

        if (cdTenant.business_type === 'grocery') {
          const [settingsRes, zonesRes, slotsRes] = await Promise.all([
            supabaseStore.from('tenant_delivery_settings').select('*').eq('tenant_id', cdTenant.id).maybeSingle(),
            supabaseStore.from('delivery_zones').select('id, name, pincodes').eq('tenant_id', cdTenant.id).eq('is_active', true),
            supabaseStore.from('delivery_slots').select('id, label, zone_id').eq('tenant_id', cdTenant.id).eq('is_active', true)
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
          }
          if (zonesRes.data) setZones(zonesRes.data);
          if (slotsRes.data) setSlots(slotsRes.data);
        }
        return;
      }

      if (!slug) return;
      const { data } = await supabaseStore.from('tenants').select('id, store_name, store_slug, business_type').eq('store_slug', slug).eq('is_active', true).maybeSingle();
      if (data) {
        setTenant(data as Tenant);
        const { data: integration } = await supabaseStore
          .from('tenant_integrations')
          .select('razorpay_key_id, razorpay_key_secret')
          .eq('tenant_id', data.id)
          .maybeSingle();
        setRazorpayConfigured(!!(integration?.razorpay_key_id && integration?.razorpay_key_secret));

        if (data.business_type === 'grocery') {
          const [settingsRes, zonesRes, slotsRes] = await Promise.all([
            supabaseStore.from('tenant_delivery_settings').select('*').eq('tenant_id', data.id).maybeSingle(),
            supabaseStore.from('delivery_zones').select('id, name, pincodes').eq('tenant_id', data.id).eq('is_active', true),
            supabaseStore.from('delivery_slots').select('id, label, zone_id').eq('tenant_id', data.id).eq('is_active', true)
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
          }
          if (zonesRes.data) setZones(zonesRes.data);
          if (slotsRes.data) setSlots(slotsRes.data);
        }
      }
    };
    fetchTenant();
  }, [slug, isCustomDomain, cdTenant]);

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

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!customer) {
        setSavedAddresses([]);
        return;
      }
      const { data } = await supabaseStore
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
      } else {
        setShowNewAddressForm(true);
      }
    };
    fetchAddresses();
  }, [customer]);

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    setShowNewAddressForm(false);
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
  };

  const handleAddNewAddress = () => {
    setSelectedAddressId('new');
    setShowNewAddressForm(true);
    setForm(prev => ({ ...prev, line1: '', line2: '', city: '', state: '', pincode: '' }));
  };

  // Performance: load Razorpay script only when needed (and only once)
  useEffect(() => {
    if (paymentMethod !== 'razorpay') return;

    let cancelled = false;

    const load = async () => {
      await loadRazorpayScript();
      if (cancelled) return;
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [paymentMethod]);

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

  useEffect(() => {
    if (appliedCoupon && subtotal > 0) {
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

  const calculateDeliveryFee = () => {
    if (!isGrocery || !deliverySettings) return 0;
    if (deliverySettings.free_delivery_above && subtotal >= deliverySettings.free_delivery_above) return 0;
    return deliverySettings.delivery_fee;
  };

  const deliveryFee = calculateDeliveryFee();
  const discountTotal = appliedCoupon?.discount_amount || 0;
  const total = subtotal + deliveryFee - discountTotal;
  const meetsMinOrder = !isGrocery || !deliverySettings?.min_order_amount || subtotal >= deliverySettings.min_order_amount;
  const availableSlots = slots.filter(s => !s.zone_id || s.zone_id === selectedZone?.id);

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
      setCouponError('Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  const handleRazorpayPayment = async (paymentIntentId: string, orderNumber: string, amount: number) => {
    try {
      // Ensure the SDK is available before initiating payment
      await loadRazorpayScript();
      if (!window.Razorpay) throw new Error('Payment SDK not available');

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
              body: { store_slug: slug, payment_intent_id: paymentIntentId, ...response }
            });
            if (verifyError || !verifyData?.success) throw new Error(verifyData?.error || 'Payment verification failed');
            // Fire purchase_complete analytics for Razorpay success
            trackEvent('purchase_complete', { order_number: verifyData.order_number || orderNumber, total: amount, payment_method: 'razorpay' });
            await clearCart();
            toast.success('Payment successful!');
            trackEvent('purchase_complete', { order_number: verifyData.order_number || orderNumber, total: amount, payment_method: 'razorpay' });
            await clearCart();
            toast.success('Payment successful!');
            navigate(getLink(`/order-confirmation?order=${verifyData.order_number || orderNumber}`));
          } catch (err: any) {
            toast.error(err.message || 'Payment verification failed');
            setSubmitting(false);
          }
        },
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#16a34a' },
        modal: {
          ondismiss: async () => {
            await supabaseStore.from('payment_intents').update({ status: 'cancelled' }).eq('id', paymentIntentId);
            toast.error('Payment cancelled.');
            setSubmitting(false);
          }
        }
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      await supabaseStore.from('payment_intents').update({ status: 'failed' }).eq('id', paymentIntentId);
      toast.error(err.message || 'Failed to initiate payment');
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || !tenant || cart.items.length === 0) return;

    // Form validation
    if (!form.name?.trim()) {
      toast.error('Please enter your name');
      return;
    }
    const phoneClean = form.phone?.replace(/\D/g, '') || '';
    if (phoneClean.length !== 10 || !/^[6-9]/.test(phoneClean)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    if (!form.line1?.trim()) {
      toast.error('Please enter your address');
      return;
    }
    if (!form.city?.trim() || !form.state?.trim()) {
      toast.error('Please enter city and state');
      return;
    }
    if (!/^\d{6}$/.test(form.pincode || '')) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

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
    // Use unique order number generation
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    try {
      // Save new address if entered
      if (customer && selectedAddressId === 'new' && form.line1) {
        await supabaseStore.from('customer_addresses').insert({
          customer_id: customer.id,
          tenant_id: tenant.id,
          label: 'Home',
          line1: form.line1,
          line2: form.line2 || null,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          is_default: savedAddresses.length === 0
        });
      }

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
          line_total: item.unit_price * item.qty
        }))
      };

      if (paymentMethod === 'razorpay') {
        const { data: paymentIntent, error: piError } = await supabaseStore
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

        if (piError || !paymentIntent) throw new Error('Failed to initiate payment');
        await handleRazorpayPayment(paymentIntent.id, orderNumber, total);
      } else {
        // COD Order - Use atomic function for transaction safety
        const orderItemsData = cart.items.map(item => ({
          product_id: item.product_id,
          variant_id: (item as any).variant_id || null,
          name: item.product?.name || 'Product',
          qty: item.qty,
          unit_price: item.unit_price,
          line_total: item.unit_price * item.qty
        }));

        // Use atomic order creation to prevent race conditions
        const { data: orderId, error: orderError } = await supabaseStore.rpc('create_order_atomic', {
          p_tenant_id: tenant.id,
          p_order_number: orderNumber,
          p_customer_id: customer?.id || null,
          p_customer_name: form.name,
          p_customer_phone: form.phone,
          p_customer_email: form.email || null,
          p_shipping_address: { line1: form.line1, line2: form.line2, city: form.city, state: form.state, pincode: form.pincode },
          p_subtotal: subtotal,
          p_discount_total: discountTotal,
          p_delivery_fee: deliveryFee,
          p_total: total,
          p_payment_method: paymentMethod,
          p_payment_status: 'unpaid',
          p_status: 'pending',
          p_delivery_zone_id: selectedZone?.id || null,
          p_delivery_slot_id: deliveryOption === 'slot' ? selectedSlotId || null : null,
          p_delivery_option: isGrocery ? deliveryOption : 'standard',
          p_coupon_id: appliedCoupon?.coupon_id || null,
          p_coupon_code: appliedCoupon?.coupon_code || null,
          p_order_items: orderItemsData,
          p_cart_id: cart.id
        });

        if (orderError) {
          console.error('Order creation error:', orderError);
          if (orderError.message?.includes('Insufficient stock')) {
            toast.error('Some items are out of stock. Please update your cart.');
          } else {
            toast.error(orderError.message || 'Failed to create order');
          }
          setSubmitting(false);
          return;
        }

        if (!orderId) {
          toast.error('Failed to create order');
          setSubmitting(false);
          return;
        }

        // Record coupon redemption if applicable (using atomic increment)
        if (appliedCoupon) {
          await supabaseStore.from('coupon_redemptions').insert({
            tenant_id: tenant.id,
            coupon_id: appliedCoupon.coupon_id,
            order_id: orderId,
            customer_id: customer?.id || null,
            discount_amount: discountTotal
          });

          // Use atomic coupon increment to prevent race conditions
          await supabaseStore.rpc('increment_coupon_usage', {
            p_coupon_id: appliedCoupon.coupon_id
          });
        }

        // Create delivery assignment for grocery stores
        if (isGrocery) {
          const { data: deliveryAreas } = await supabaseStore
            .from('delivery_areas')
            .select('id, pincodes')
            .eq('tenant_id', tenant.id)
            .eq('is_active', true);

          const matchedArea = deliveryAreas?.find(area =>
            area.pincodes?.includes(form.pincode)
          );

          const { error: assignmentError } = await supabaseStore.from('delivery_assignments').insert({
            tenant_id: tenant.id,
            order_id: orderId,
            delivery_area_id: matchedArea?.id || null,
            status: 'unassigned'
          });

          if (assignmentError) {
            console.error('Delivery assignment error:', assignmentError);
            // Don't fail the order, just log the error
          }
        }

        // Fire purchase_complete analytics
        trackEvent('purchase_complete', { order_number: orderNumber, total, item_count: cart.items.length });

        await clearCart();
        toast.success('Order placed successfully!');
        await clearCart();
        toast.success('Order placed successfully!');
        navigate(getLink(`/order-confirmation?order=${orderNumber}`));
        setSubmitting(false);
        setSubmitting(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order');
      setSubmitting(false);
    }
  };

  const getImageUrl = (images: any) => {
    if (!images) return null;
    const imageArray = Array.isArray(images) ? images : (typeof images === 'string' ? [images] : []);
    if (imageArray.length === 0) return null;
    const img = imageArray[0];
    if (typeof img === 'string') {
      if (img.startsWith('http')) return img;
      return supabaseStore.storage.from('product-images').getPublicUrl(img).data.publicUrl;
    }
    return null;
  };

  if (!tenant || !cart) return null;

  // Grocery Checkout - Clean Modern UI
  if (isGrocery) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-neutral-100">
          <div className="flex items-center gap-3 p-4">
            <button onClick={() => navigate(-1)} className="p-1">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Checkout</h1>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <StoreHeader
            storeName={tenant.store_name}
            storeSlug={tenant.store_slug}
            businessType={tenant.business_type}
            cartCount={itemCount}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        <form onSubmit={handleSubmit} className="flex-1 pb-36 lg:pb-8">
          <div className="lg:container lg:mx-auto lg:px-4 lg:py-8">
            <div className="lg:grid lg:grid-cols-3 lg:gap-8">
              {/* Left Column - Forms */}
              <div className="lg:col-span-2 space-y-4">
                {/* Contact Details */}
                <div className="bg-white p-4 lg:rounded-xl lg:border lg:border-neutral-200">
                  <h2 className="font-bold text-base mb-4">Contact Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-neutral-600">Full Name *</Label>
                      <Input
                        required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="mt-1 h-12 rounded-xl"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-neutral-600">Phone *</Label>
                      <Input
                        required
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        className="mt-1 h-12 rounded-xl"
                        placeholder="10-digit phone number"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-sm text-neutral-600">Email (optional)</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="mt-1 h-12 rounded-xl"
                        placeholder="For order updates"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="bg-white p-4 lg:rounded-xl lg:border lg:border-neutral-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-base flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                      Delivery Address
                    </h2>
                    {savedAddresses.length > 0 && !showNewAddressForm && (
                      <button
                        type="button"
                        onClick={handleAddNewAddress}
                        className="text-sm text-green-600 font-medium flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Add New
                      </button>
                    )}
                  </div>

                  {/* Saved Addresses */}
                  {savedAddresses.length > 0 && !showNewAddressForm && (
                    <div className="space-y-3 mb-4">
                      {savedAddresses.map(addr => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => handleAddressSelect(addr.id)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedAddressId === addr.id
                            ? 'border-green-600 bg-green-50'
                            : 'border-neutral-200 hover:border-neutral-300'
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="inline-block px-2 py-0.5 bg-neutral-100 rounded text-xs font-medium mb-2">
                                {addr.label}
                              </span>
                              <p className="text-sm font-medium">{addr.line1}</p>
                              {addr.line2 && <p className="text-sm text-neutral-500">{addr.line2}</p>}
                              <p className="text-sm text-neutral-500">{addr.city}, {addr.state} - {addr.pincode}</p>
                            </div>
                            {selectedAddressId === addr.id && (
                              <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* New Address Form */}
                  {(showNewAddressForm || savedAddresses.length === 0) && (
                    <div className="space-y-4">
                      {savedAddresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewAddressForm(false);
                            if (savedAddresses.length > 0) {
                              handleAddressSelect(savedAddresses[0].id);
                            }
                          }}
                          className="text-sm text-neutral-500 flex items-center gap-1"
                        >
                          <ChevronLeft className="w-4 h-4" /> Back to saved addresses
                        </button>
                      )}
                      <div>
                        <Label className="text-sm text-neutral-600">Address Line 1 *</Label>
                        <Input
                          required
                          value={form.line1}
                          onChange={e => setForm({ ...form, line1: e.target.value })}
                          className="mt-1 h-12 rounded-xl"
                          placeholder="House/Flat number, Building name"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-neutral-600">Address Line 2</Label>
                        <Input
                          value={form.line2}
                          onChange={e => setForm({ ...form, line2: e.target.value })}
                          className="mt-1 h-12 rounded-xl"
                          placeholder="Street, Area, Landmark"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-neutral-600">City *</Label>
                          <Input
                            required
                            value={form.city}
                            onChange={e => setForm({ ...form, city: e.target.value })}
                            className="mt-1 h-12 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-neutral-600">State *</Label>
                          <Input
                            required
                            value={form.state}
                            onChange={e => setForm({ ...form, state: e.target.value })}
                            className="mt-1 h-12 rounded-xl"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-neutral-600">Pincode *</Label>
                        <Input
                          required
                          value={form.pincode}
                          onChange={e => setForm({ ...form, pincode: e.target.value })}
                          className="mt-1 h-12 rounded-xl"
                          maxLength={6}
                          placeholder="6-digit pincode"
                        />
                        {zones.length > 0 && (
                          <div className="mt-2">
                            {selectedZone ? (
                              <p className="text-sm text-green-600 flex items-center gap-1">
                                <Check className="w-4 h-4" /> Delivering to: {selectedZone.name}
                              </p>
                            ) : zoneError && (
                              <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" /> {zoneError}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Delivery Time */}
                {deliverySettings && (
                  <div className="bg-white p-4 lg:rounded-xl lg:border lg:border-neutral-200">
                    <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      Delivery Time
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      {(deliverySettings.delivery_mode === 'asap' || deliverySettings.delivery_mode === 'both') && (
                        <button
                          type="button"
                          onClick={() => setDeliveryOption('asap')}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${deliveryOption === 'asap'
                            ? 'border-green-600 bg-green-50'
                            : 'border-neutral-200'
                            }`}
                        >
                          <Zap className={`w-5 h-5 mb-2 ${deliveryOption === 'asap' ? 'text-green-600' : 'text-neutral-400'}`} />
                          <p className="font-semibold text-sm">Express</p>
                          <p className="text-xs text-neutral-500">{deliverySettings.asap_eta_minutes} mins</p>
                        </button>
                      )}
                      {(deliverySettings.delivery_mode === 'slots' || deliverySettings.delivery_mode === 'both') && (
                        <button
                          type="button"
                          onClick={() => setDeliveryOption('slot')}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${deliveryOption === 'slot'
                            ? 'border-green-600 bg-green-50'
                            : 'border-neutral-200'
                            }`}
                        >
                          <Clock className={`w-5 h-5 mb-2 ${deliveryOption === 'slot' ? 'text-green-600' : 'text-neutral-400'}`} />
                          <p className="font-semibold text-sm">Scheduled</p>
                          <p className="text-xs text-neutral-500">Pick a slot</p>
                        </button>
                      )}
                    </div>
                    {deliveryOption === 'slot' && availableSlots.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {availableSlots.map(slot => (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={`w-full p-3 rounded-xl border-2 text-left flex items-center justify-between ${selectedSlotId === slot.id
                              ? 'border-green-600 bg-green-50'
                              : 'border-neutral-200'
                              }`}
                          >
                            <span className="text-sm font-medium">{slot.label}</span>
                            {selectedSlotId === slot.id && (
                              <Check className="w-5 h-5 text-green-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Promo Code */}
                <div className="bg-white p-4 lg:rounded-xl lg:border lg:border-neutral-200">
                  <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-green-600" />
                    Promo Code
                  </h2>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-600" />
                        <div>
                          <span className="font-bold text-green-700">{appliedCoupon.coupon_code}</span>
                          <p className="text-sm text-green-600">
                            {appliedCoupon.coupon_type === 'percent'
                              ? `${appliedCoupon.coupon_value || 0}% off`
                              : `₹${appliedCoupon.coupon_value || 0} off`
                            } • Saving ₹{(discountTotal || 0).toFixed(0)}
                          </p>
                        </div>
                      </div>
                      <button type="button" onClick={removeCoupon} className="p-2">
                        <X className="w-5 h-5 text-neutral-400" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                        className="flex-1 h-12 rounded-xl"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="h-12 px-6 rounded-xl"
                      >
                        {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                      </Button>
                    </div>
                  )}
                  {couponError && <p className="text-sm text-red-500 mt-2">{couponError}</p>}
                </div>

                {/* Payment Method */}
                <div className="bg-white p-4 lg:rounded-xl lg:border lg:border-neutral-200">
                  <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    Payment Method
                  </h2>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`w-full p-4 rounded-xl border-2 text-left flex items-center justify-between ${paymentMethod === 'cod'
                        ? 'border-green-600 bg-green-50'
                        : 'border-neutral-200'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Truck className="w-5 h-5 text-neutral-600" />
                        <span className="font-medium">Cash on Delivery</span>
                      </div>
                      {paymentMethod === 'cod' && (
                        <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => razorpayConfigured && setPaymentMethod('razorpay')}
                      disabled={!razorpayConfigured}
                      className={`w-full p-4 rounded-xl border-2 text-left flex items-center justify-between ${paymentMethod === 'razorpay'
                        ? 'border-green-600 bg-green-50'
                        : 'border-neutral-200'
                        } ${!razorpayConfigured ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-neutral-600" />
                        <div>
                          <span className="font-medium">Pay Online</span>
                          {!razorpayConfigured && <p className="text-xs text-neutral-500">Not available</p>}
                        </div>
                      </div>
                      {paymentMethod === 'razorpay' && (
                        <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="hidden lg:block">
                <div className="bg-white rounded-xl border border-neutral-200 p-6 sticky top-24">
                  <h3 className="font-bold text-lg mb-4">Order Summary</h3>

                  {/* Cart Items Preview */}
                  <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                    {cart.items.map(item => {
                      const imageUrl = getImageUrl(item.product?.images);
                      return (
                        <div key={item.id} className="flex gap-3">
                          <div className="w-12 h-12 bg-neutral-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                            {imageUrl ? (
                              <img src={imageUrl} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <Package className="w-5 h-5 text-neutral-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.product?.name}</p>
                            <p className="text-xs text-neutral-500">Qty: {item.qty}</p>
                          </div>
                          <p className="text-sm font-medium">₹{(item.unit_price * item.qty).toFixed(0)}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bill Details */}
                  <div className="border-t border-neutral-200 pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Delivery</span>
                      <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                        {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
                      </span>
                    </div>
                    {discountTotal > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-₹{discountTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-neutral-200">
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Min Order Warning */}
                  {deliverySettings?.min_order_amount > 0 && !meetsMinOrder && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm text-amber-700">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        Add ₹{(deliverySettings.min_order_amount - subtotal).toFixed(0)} more to meet minimum order
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 mt-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl"
                    disabled={submitting || cart.items.length === 0 || !meetsMinOrder || (zones.length > 0 && !selectedZone)}
                  >
                    {submitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                    ) : paymentMethod === 'razorpay' ? (
                      `Pay ₹${total.toFixed(0)}`
                    ) : (
                      `Place Order • ₹${total.toFixed(0)}`
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 mt-4 text-xs text-neutral-500">
                    <Shield className="w-4 h-4" />
                    <span>Secure checkout</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Mobile Sticky Bottom */}
        <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-white border-t border-neutral-200 shadow-lg safe-area-bottom">
          <div className="p-4">
            {/* Min Order Warning - inline */}
            {deliverySettings?.min_order_amount > 0 && !meetsMinOrder && (
              <p className="text-sm text-amber-600 text-center mb-2">
                Add ₹{(deliverySettings.min_order_amount - subtotal).toFixed(0)} more to proceed
              </p>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500">Total Amount</p>
                <p className="text-xl font-bold">₹{total.toFixed(0)}</p>
              </div>
              <Button
                type="submit"
                form="checkout-form"
                onClick={handleSubmit}
                className="h-12 px-8 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl"
                disabled={submitting || cart.items.length === 0 || !meetsMinOrder || (zones.length > 0 && !selectedZone)}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : paymentMethod === 'razorpay' ? (
                  'Pay Now'
                ) : (
                  'Place Order'
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <GroceryBottomNav storeSlug={tenant.store_slug} cartCount={itemCount} />

        {/* Desktop Footer */}
        <div className="hidden lg:block">
          <StoreFooter storeName={tenant.store_name} storeSlug={tenant.store_slug} address={null} phone={null} />
        </div>
      </div>
    );
  }

  // E-commerce Checkout (Refined D2C)
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <StoreHeader
        storeName={tenant.store_name}
        storeSlug={tenant.store_slug}
        businessType={tenant.business_type}
        cartCount={itemCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <main className="flex-1 container mx-auto px-4 py-8 lg:py-12 max-w-6xl">
        <h1 className="text-2xl lg:text-3xl font-serif text-neutral-900 tracking-tight mb-8">Checkout</h1>
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          <div className="flex-1 space-y-12">

            {/* Contact Details */}
            <section>
              <h2 className="font-serif text-xl mb-6 text-neutral-900">Contact Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="md:col-span-2">
                  <Label className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Full Name *</Label>
                  <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-2 rounded-none border-0 border-b border-neutral-300 focus-visible:ring-0 focus-visible:border-black px-0 h-10 text-base bg-transparent transition-colors" placeholder="Enter your full name" />
                </div>
                <div>
                  <Label className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Phone *</Label>
                  <Input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-2 rounded-none border-0 border-b border-neutral-300 focus-visible:ring-0 focus-visible:border-black px-0 h-10 text-base bg-transparent transition-colors" placeholder="10-digit number" />
                </div>
                <div>
                  <Label className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Email (optional)</Label>
                  <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-2 rounded-none border-0 border-b border-neutral-300 focus-visible:ring-0 focus-visible:border-black px-0 h-10 text-base bg-transparent transition-colors" placeholder="For order updates" />
                </div>
              </div>
            </section>

            {/* Delivery Address */}
            <section>
              <h2 className="font-serif text-xl mb-6 text-neutral-900">Delivery Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="md:col-span-2">
                  <Label className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Address Line 1 *</Label>
                  <Input required value={form.line1} onChange={e => setForm({ ...form, line1: e.target.value })} className="mt-2 rounded-none border-0 border-b border-neutral-300 focus-visible:ring-0 focus-visible:border-black px-0 h-10 text-base bg-transparent transition-colors" placeholder="House/Flat No., Building" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Address Line 2 (optional)</Label>
                  <Input value={form.line2} onChange={e => setForm({ ...form, line2: e.target.value })} className="mt-2 rounded-none border-0 border-b border-neutral-300 focus-visible:ring-0 focus-visible:border-black px-0 h-10 text-base bg-transparent transition-colors" placeholder="Street, Area, Landmark" />
                </div>
                <div>
                  <Label className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">City *</Label>
                  <Input required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="mt-2 rounded-none border-0 border-b border-neutral-300 focus-visible:ring-0 focus-visible:border-black px-0 h-10 text-base bg-transparent transition-colors" />
                </div>
                <div>
                  <Label className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">State *</Label>
                  <Input required value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="mt-2 rounded-none border-0 border-b border-neutral-300 focus-visible:ring-0 focus-visible:border-black px-0 h-10 text-base bg-transparent transition-colors" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Pincode *</Label>
                  <Input required value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} maxLength={6} className="mt-2 rounded-none border-0 border-b border-neutral-300 focus-visible:ring-0 focus-visible:border-black px-0 h-10 text-base bg-transparent transition-colors w-full md:w-1/2" placeholder="6-digit pincode" />
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section>
              <h2 className="font-serif text-xl mb-6 text-neutral-900">Payment Method</h2>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
                <div className={`p-5 border ${paymentMethod === 'cod' ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300'} transition-all cursor-pointer`} onClick={() => setPaymentMethod('cod')}>
                  <div className="flex items-center space-x-4">
                    <RadioGroupItem value="cod" id="cod-ecom" className={paymentMethod === 'cod' ? 'border-black text-black' : ''} />
                    <Label htmlFor="cod-ecom" className="flex items-center gap-3 cursor-pointer font-medium text-neutral-900 w-full">
                      <Truck className="w-5 h-5 text-neutral-600" /> Cash on Delivery
                    </Label>
                  </div>
                </div>
                <div className={`p-5 border ${!razorpayConfigured ? 'opacity-50' : paymentMethod === 'razorpay' ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300'} transition-all cursor-pointer`} onClick={() => razorpayConfigured && setPaymentMethod('razorpay')}>
                  <div className="flex items-center space-x-4">
                    <RadioGroupItem value="razorpay" id="razorpay-ecom" disabled={!razorpayConfigured} className={paymentMethod === 'razorpay' ? 'border-black text-black' : ''} />
                    <Label htmlFor="razorpay-ecom" className="flex items-center gap-3 cursor-pointer font-medium text-neutral-900 w-full">
                      <CreditCard className="w-5 h-5 text-neutral-600" /> Pay Online {!razorpayConfigured && <span className="text-xs text-neutral-400 font-normal ml-auto">(Not available)</span>}
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </section>
          </div>

          {/* Right Column - Order Summary */}
          <div className="w-full lg:w-[420px] shrink-0">
            <div className="bg-neutral-50 p-8 sticky top-24">
              <h3 className="font-serif tracking-tight text-xl mb-6 text-neutral-900">Order Summary</h3>

              <div className="space-y-4 border-b border-neutral-200 pb-6 mb-6">
                {cart.items.map(item => (
                  <div key={item.id} className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <span className="font-medium text-neutral-800 line-clamp-2 md:line-clamp-none">{item.product?.name}</span>
                      <span className="text-sm text-neutral-500 block mt-1">Qty: {item.qty}</span>
                    </div>
                    <span className="font-medium text-neutral-900">₹{(item.unit_price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 text-neutral-600 mb-6 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-4 flex justify-between font-medium text-xl mb-8 text-neutral-900">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <Button type="submit" className="w-full rounded-none py-6 tracking-widest uppercase bg-black text-white hover:bg-neutral-800 h-14" disabled={submitting || cart.items.length === 0}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : paymentMethod === 'razorpay' ? `Pay ₹${total.toFixed(2)}` : 'Place Order'}
              </Button>
            </div>
          </div>
        </form>
      </main>
      <StoreFooter storeName={tenant.store_name} storeSlug={tenant.store_slug} address={null} phone={null} />
    </div>
  );
}
