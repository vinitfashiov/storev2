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
import { calculateD2CDeliveryFee, calculateGroceryDeliveryFee, D2CDeliverySettings, GroceryDeliverySettings } from '@/utils/deliveryCalculator';
import { toast } from 'sonner';
import { GroceryBottomNav } from '@/components/storefront/grocery/GroceryBottomNav';
import { StoreHeader } from '@/components/storefront/StoreHeader';
import { StoreFooter } from '@/components/storefront/StoreFooter';
import { CheckoutStepper } from '@/components/storefront/CheckoutStepper';
import {
  CreditCard, Truck, Loader2, Zap, Clock, AlertTriangle, MapPin,
  Tag, X, Check, ChevronLeft, ChevronRight, Plus, Package, Shield, ShieldCheck
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
      existing.addEventListener('error', () => {
        razorpayScriptPromise = null;
        reject(new Error('Failed to load payment SDK'));
      }, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      razorpayScriptPromise = null;
      document.body.removeChild(script);
      reject(new Error('Failed to load payment SDK'));
    };
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

interface Tenant { id: string; store_name: string; store_slug: string; business_type: 'ecommerce' | 'grocery'; }

interface DeliverySettings extends GroceryDeliverySettings {
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
  latitude: number | null;
  longitude: number | null;
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
  const [form, setForm] = useState({ name: '', phone: '', email: '', line1: '', line2: '', city: '', state: '', pincode: '', latitude: null as number | null, longitude: null as number | null });
  const [searchQuery, setSearchQuery] = useState('');
  const [checkoutStep, setCheckoutStep] = useState<2 | 3>(2); // Start at step 2 (Address)

  // Customer addresses state
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  // Grocery-specific state
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [d2cDeliverySettings, setD2cDeliverySettings] = useState<D2CDeliverySettings | null>(null);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [deliveryOption, setDeliveryOption] = useState<'asap' | 'slot'>('asap');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [zoneError, setZoneError] = useState<string>('');

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);

  // Restore coupon on load if exists
  useEffect(() => {
    const saved = sessionStorage.getItem('applied_coupon');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAppliedCoupon({
          coupon_id: parsed.id,
          coupon_code: parsed.code,
          coupon_type: parsed.type,
          coupon_value: parsed.discount, // This isn't exactly the raw value but we just need discount_amount
          discount_amount: parsed.discount
        });
      } catch (e) { }
    }
  }, []);

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
              free_delivery_above: settingsRes.data.free_delivery_above ? Number(settingsRes.data.free_delivery_above) : null,
              fixed_delivery_fee_enabled: settingsRes.data.fixed_delivery_fee_enabled || false,
              free_delivery_enabled: settingsRes.data.free_delivery_enabled || false,
              minimum_order_enabled: settingsRes.data.minimum_order_enabled || false,
              max_delivery_fee_enabled: settingsRes.data.max_delivery_fee_enabled || false,
              max_delivery_fee: Number(settingsRes.data.max_delivery_fee || 0),
              distance_based_delivery_enabled: settingsRes.data.distance_based_delivery_enabled || false,
              distance_calculation_type: settingsRes.data.distance_calculation_type as 'slab' | 'per_km',
              per_km_rate: settingsRes.data.per_km_rate,
              distance_slabs: settingsRes.data.distance_slabs as any,
              store_latitude: settingsRes.data.store_latitude ? Number(settingsRes.data.store_latitude) : null,
              store_longitude: settingsRes.data.store_longitude ? Number(settingsRes.data.store_longitude) : null
            });
            if (settingsRes.data.delivery_mode === 'slots') setDeliveryOption('slot');
          }
          if (zonesRes.data) setZones(zonesRes.data);
          if (slotsRes.data) setSlots(slotsRes.data);
        } else if (cdTenant.business_type === 'ecommerce') {
          const { data: d2cRes } = await supabaseStore.from('tenant_delivery_settings_d2c').select('*').eq('tenant_id', cdTenant.id).maybeSingle();
          if (d2cRes) setD2cDeliverySettings(d2cRes as unknown as D2CDeliverySettings);
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
              free_delivery_above: settingsRes.data.free_delivery_above ? Number(settingsRes.data.free_delivery_above) : null,
              fixed_delivery_fee_enabled: settingsRes.data.fixed_delivery_fee_enabled || false,
              free_delivery_enabled: settingsRes.data.free_delivery_enabled || false,
              minimum_order_enabled: settingsRes.data.minimum_order_enabled || false,
              max_delivery_fee_enabled: settingsRes.data.max_delivery_fee_enabled || false,
              max_delivery_fee: Number(settingsRes.data.max_delivery_fee || 0),
              distance_based_delivery_enabled: settingsRes.data.distance_based_delivery_enabled || false,
              distance_calculation_type: settingsRes.data.distance_calculation_type as 'slab' | 'per_km',
              per_km_rate: settingsRes.data.per_km_rate,
              distance_slabs: settingsRes.data.distance_slabs as any,
              store_latitude: settingsRes.data.store_latitude ? Number(settingsRes.data.store_latitude) : null,
              store_longitude: settingsRes.data.store_longitude ? Number(settingsRes.data.store_longitude) : null
            });
            if (settingsRes.data.delivery_mode === 'slots') setDeliveryOption('slot');
          }
          if (zonesRes.data) setZones(zonesRes.data);
          if (slotsRes.data) setSlots(slotsRes.data);
        } else if (data.business_type === 'ecommerce') {
          const { data: d2cRes } = await supabaseStore.from('tenant_delivery_settings_d2c').select('*').eq('tenant_id', data.id).maybeSingle();
          if (d2cRes) setD2cDeliverySettings(d2cRes as unknown as D2CDeliverySettings);
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
        setSavedAddresses(data as any[]);
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

  // Helper for Haversine distance
  const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const calculateDeliveryFee = () => {
    if (isGrocery) {
      const areaFee = selectedZone ? (selectedZone as any).delivery_fee || 0 : 0;
      let distance = 0;

      if (deliverySettings?.distance_based_delivery_enabled && deliverySettings.store_latitude && deliverySettings.store_longitude) {
        let destLat = null;
        let destLng = null;
        if (selectedAddressId === 'new' && form.latitude && form.longitude) {
          destLat = form.latitude;
          destLng = form.longitude;
        } else if (selectedAddressId !== 'new') {
          const addr = savedAddresses.find(a => a.id === selectedAddressId);
          if (addr?.latitude && addr?.longitude) {
            destLat = addr.latitude;
            destLng = addr.longitude;
          }
        }
        if (destLat && destLng) {
          distance = getDistanceInKm(deliverySettings.store_latitude, deliverySettings.store_longitude, destLat, destLng);
        }
      }

      return calculateGroceryDeliveryFee(subtotal, deliverySettings, areaFee, distance);
    } else {
      if (!cart) return 0;
      return calculateD2CDeliveryFee(subtotal, cart.items as any, d2cDeliverySettings);
    }
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
        setShowCouponInput(false);
        toast.success(data.message);

        sessionStorage.setItem('applied_coupon', JSON.stringify({
          id: data.coupon_id,
          code: data.coupon_code,
          discount: data.discount_amount,
          type: data.coupon_type
        }));
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
    sessionStorage.removeItem('applied_coupon');
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

    // Step progression logic for e-commerce
    if (!isGrocery && checkoutStep === 2) {
      setCheckoutStep(3);
      window.scrollTo(0, 0);
      return;
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
          is_default: savedAddresses.length === 0,
          latitude: form.latitude,
          longitude: form.longitude
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
        trackEvent('purchase_complete', { order_number: orderNumber, total, item_count: cart.items.length, payment_method: 'cod' });

        await clearCart();
        toast.success('Order placed successfully!');
        navigate(getLink(`/order-confirmation?order=${orderNumber}`));
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
                      <div className="space-y-4">
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
                        </div>

                        <div className="flex items-center justify-between p-4 border border-neutral-100 bg-neutral-50/50 rounded-xl">
                          <div className="space-y-1 pr-4">
                            <Label className="text-sm font-medium">Delivery Location</Label>
                            <p className="text-xs text-neutral-500">
                              {form.latitude && form.longitude
                                ? "Location captured for accurate delivery"
                                : "Location helps us calculate accurate grocery delivery fees"}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => {
                              if ('geolocation' in navigator) {
                                toast.loading('Getting location...', { id: 'geo' });
                                navigator.geolocation.getCurrentPosition(
                                  (position) => {
                                    setForm({ ...form, latitude: position.coords.latitude, longitude: position.coords.longitude });
                                    toast.success('Location captured successfully', { id: 'geo' });
                                  },
                                  (err) => {
                                    toast.error('Failed to get location. Please enable location permissions.', { id: 'geo' });
                                  }
                                );
                              } else {
                                toast.error('Geolocation is not supported by your browser');
                              }
                            }}
                            className="rounded-xl gap-2 flex-shrink-0 whitespace-nowrap"
                          >
                            <MapPin className="w-4 h-4" />
                            {form.latitude ? 'Update Location' : 'Get Location'}
                          </Button>
                        </div>
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

  // E-commerce Checkout (Modern D2C - Clean Professional)
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <StoreHeader
        storeName={tenant.store_name}
        storeSlug={tenant.store_slug}
        businessType={tenant.business_type}
        cartCount={itemCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <main className="flex-1 lg:max-w-[1200px] lg:mx-auto w-full lg:px-4 py-0 lg:py-6">
        <CheckoutStepper currentStep={checkoutStep} />

        {/* Mobile Header (replaces standard header on small screens) */}
        <div className="lg:hidden flex items-center justify-between bg-white px-4 py-3 border-b border-neutral-100 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => checkoutStep === 3 ? setCheckoutStep(2) : navigate(-1)} className="p-1 -ml-1 text-neutral-700">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-neutral-900">
              {checkoutStep === 2 ? 'Add address' : 'Payment'}
            </h1>
          </div>
          <span className="text-sm font-medium text-neutral-500 tracking-wide">
            STEP {checkoutStep}/3
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:mt-6">
          <div className="flex-1 space-y-4 px-4 lg:px-0 mt-4 lg:mt-0">

            {/* Step 2: Delivery Address */}
            {checkoutStep === 2 && (
              <section className="bg-white lg:rounded-sm lg:border lg:border-neutral-200 p-0 lg:p-6 lg:shadow-sm">

                {/* Header Actions */}
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-neutral-200 lg:border-none lg:pb-0">
                  <h2 className="font-bold text-lg text-neutral-900">Delivery Address</h2>
                  {savedAddresses.length > 0 && !showNewAddressForm && (
                    <button
                      type="button"
                      onClick={handleAddNewAddress}
                      className="text-sm text-[#ff3f6c] font-medium flex items-center gap-1 hover:text-[#d32f50] transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add New
                    </button>
                  )}
                </div>

                {/* Saved Addresses List */}
                {savedAddresses.length > 0 && !showNewAddressForm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                    {savedAddresses.map(addr => (
                      <div
                        key={addr.id}
                        onClick={() => handleAddressSelect(addr.id)}
                        className={`p-4 rounded-md border-2 cursor-pointer transition-all ${selectedAddressId === addr.id
                          ? 'border-[#ff3f6c] bg-pink-50/50'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white'
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="inline-block px-2 py-0.5 bg-neutral-100 rounded text-[11px] font-semibold text-neutral-600 mb-2 uppercase tracking-wide">
                              {addr.label || 'Home'}
                            </span>
                            <p className="text-[15px] font-semibold text-neutral-900 mb-1">{customer?.name || 'Customer'}</p>
                            <p className="text-[13px] text-neutral-600 leading-relaxed mb-2">
                              {addr.line1}
                              {addr.line2 && <><br />{addr.line2}</>}
                              <br />
                              {addr.city}, {addr.state} - {addr.pincode}
                            </p>
                            <p className="text-[13px] text-neutral-600">Mobile: <span className="font-medium text-neutral-900">{customer?.phone || form.phone}</span></p>
                          </div>
                          {selectedAddressId === addr.id && (
                            <div className="w-5 h-5 rounded-full bg-[#ff3f6c] flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* New Address Form */}
                {(showNewAddressForm || savedAddresses.length === 0) && (
                  <div className="animate-in slide-in-from-bottom-2 duration-300">
                    {savedAddresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewAddressForm(false);
                          if (savedAddresses.length > 0) handleAddressSelect(savedAddresses[0].id);
                        }}
                        className="text-sm text-neutral-500 flex items-center gap-1 mb-5 hover:text-neutral-900 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 ml-[-4px]" /> Back to saved addresses
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <Input
                          required
                          id="fullName"
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          className="peer h-[52px] w-full border-neutral-300 rounded-md bg-white px-4 pt-5 pb-2 text-[15px] shadow-sm outline-none transition-all focus-visible:ring-1 focus-visible:ring-[#ff3f6c] focus-visible:border-[#ff3f6c]"
                          placeholder=" "
                        />
                        <Label
                          htmlFor="fullName"
                          className="absolute left-4 top-2 text-[11px] font-semibold text-neutral-500 transition-all peer-placeholder-shown:top-[16px] peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-[#ff3f6c] pointer-events-none m-0"
                        >
                          Full Name *
                        </Label>
                      </div>

                      <div className="relative">
                        <Input
                          required
                          id="phoneNumber"
                          value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                          className="peer h-[52px] w-full border-neutral-300 rounded-md bg-white px-4 pt-5 pb-2 text-[15px] shadow-sm outline-none transition-all focus-visible:ring-1 focus-visible:ring-[#ff3f6c] focus-visible:border-[#ff3f6c]"
                          placeholder=" "
                        />
                        <Label
                          htmlFor="phoneNumber"
                          className="absolute left-4 top-2 text-[11px] font-semibold text-neutral-500 transition-all peer-placeholder-shown:top-[16px] peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-[#ff3f6c] pointer-events-none m-0"
                        >
                          10-digit mobile number *
                        </Label>
                      </div>

                      <div className="md:col-span-2 relative">
                        <Input
                          required
                          id="line1"
                          value={form.line1}
                          onChange={e => setForm({ ...form, line1: e.target.value })}
                          className="peer h-[52px] w-full border-neutral-300 rounded-md bg-white px-4 pt-5 pb-2 text-[15px] shadow-sm outline-none transition-all focus-visible:ring-1 focus-visible:ring-[#ff3f6c] focus-visible:border-[#ff3f6c]"
                          placeholder=" "
                        />
                        <Label
                          htmlFor="line1"
                          className="absolute left-4 top-2 text-[11px] font-semibold text-neutral-500 transition-all peer-placeholder-shown:top-[16px] peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-[#ff3f6c] pointer-events-none m-0"
                        >
                          House/Flat No., Building Name *
                        </Label>
                      </div>

                      <div className="md:col-span-2 relative">
                        <Input
                          id="line2"
                          value={form.line2}
                          onChange={e => setForm({ ...form, line2: e.target.value })}
                          className="peer h-[52px] w-full border-neutral-300 rounded-md bg-white px-4 pt-5 pb-2 text-[15px] shadow-sm outline-none transition-all focus-visible:ring-1 focus-visible:ring-[#ff3f6c] focus-visible:border-[#ff3f6c]"
                          placeholder=" "
                        />
                        <Label
                          htmlFor="line2"
                          className="absolute left-4 top-2 text-[11px] font-semibold text-neutral-500 transition-all peer-placeholder-shown:top-[16px] peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-[#ff3f6c] pointer-events-none m-0"
                        >
                          Locality / Area / Street (optional)
                        </Label>
                      </div>

                      <div className="relative">
                        <Input
                          required
                          id="pincode"
                          value={form.pincode}
                          onChange={e => setForm({ ...form, pincode: e.target.value })}
                          maxLength={6}
                          className="peer h-[52px] w-full border-neutral-300 rounded-md bg-white px-4 pt-5 pb-2 text-[15px] shadow-sm outline-none transition-all focus-visible:ring-1 focus-visible:ring-[#ff3f6c] focus-visible:border-[#ff3f6c]"
                          placeholder=" "
                        />
                        <Label
                          htmlFor="pincode"
                          className="absolute left-4 top-2 text-[11px] font-semibold text-neutral-500 transition-all peer-placeholder-shown:top-[16px] peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-[#ff3f6c] pointer-events-none m-0"
                        >
                          6-digit pincode *
                        </Label>
                      </div>

                      <div className="relative">
                        <Input
                          id="landmark"
                          className="peer h-[52px] w-full border-neutral-300 rounded-md bg-white px-4 pt-5 pb-2 text-[15px] shadow-sm outline-none transition-all focus-visible:ring-1 focus-visible:ring-[#ff3f6c] focus-visible:border-[#ff3f6c]"
                          placeholder=" "
                        />
                        <Label
                          htmlFor="landmark"
                          className="absolute left-4 top-2 text-[11px] font-semibold text-neutral-500 transition-all peer-placeholder-shown:top-[16px] peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-[#ff3f6c] pointer-events-none m-0"
                        >
                          Landmark (optional)
                        </Label>
                      </div>

                      <div className="relative">
                        <Input
                          required
                          id="city"
                          value={form.city}
                          onChange={e => setForm({ ...form, city: e.target.value })}
                          className="peer h-[52px] w-full border-neutral-300 rounded-md bg-white px-4 pt-5 pb-2 text-[15px] shadow-sm outline-none transition-all focus-visible:ring-1 focus-visible:ring-[#ff3f6c] focus-visible:border-[#ff3f6c]"
                          placeholder=" "
                        />
                        <Label
                          htmlFor="city"
                          className="absolute left-4 top-2 text-[11px] font-semibold text-neutral-500 transition-all peer-placeholder-shown:top-[16px] peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-[#ff3f6c] pointer-events-none m-0"
                        >
                          City *
                        </Label>
                      </div>

                      <div className="relative">
                        <Input
                          required
                          id="state"
                          value={form.state}
                          onChange={e => setForm({ ...form, state: e.target.value })}
                          className="peer h-[52px] w-full border-neutral-300 rounded-md bg-white px-4 pt-5 pb-2 text-[15px] shadow-sm outline-none transition-all focus-visible:ring-1 focus-visible:ring-[#ff3f6c] focus-visible:border-[#ff3f6c]"
                          placeholder=" "
                        />
                        <Label
                          htmlFor="state"
                          className="absolute left-4 top-2 text-[11px] font-semibold text-neutral-500 transition-all peer-placeholder-shown:top-[16px] peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-[#ff3f6c] pointer-events-none m-0"
                        >
                          State *
                        </Label>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Step 3: Payment Method */}
            {checkoutStep === 3 && (
              <section className="bg-white lg:rounded-sm lg:border lg:border-neutral-200 p-4 lg:p-6 lg:shadow-sm">

                <h2 className="hidden lg:block font-bold text-[18px] text-neutral-900 mb-6">Choose payment mode</h2>

                <div className="flex flex-col lg:flex-row border border-neutral-200 rounded-sm overflow-hidden">

                  {/* Left Nav (Desktop Tabs style) */}
                  <div className="w-full lg:w-[35%] bg-neutral-100 flex flex-col border-b lg:border-b-0 lg:border-r border-neutral-200">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-4 text-left flex items-center justify-between transition-all ${paymentMethod === 'cod'
                        ? 'bg-white border-l-4 border-l-black font-semibold'
                        : 'hover:bg-neutral-50 text-neutral-600 border-l-4 border-l-transparent'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Truck className="w-5 h-5" />
                        <span className="text-[15px]">Cash on delivery</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => razorpayConfigured && setPaymentMethod('razorpay')}
                      disabled={!razorpayConfigured}
                      className={`p-4 text-left flex items-center justify-between transition-all ${paymentMethod === 'razorpay'
                        ? 'bg-white border-l-4 border-l-black font-semibold'
                        : 'hover:bg-neutral-50 text-neutral-600 border-l-4 border-l-transparent'
                        } ${!razorpayConfigured ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5" />
                        <div>
                          <span className="text-[15px] block">Pay Online (UPI, Cards)</span>
                          {!razorpayConfigured && <span className="text-[11px] text-neutral-400 font-normal">Currently unavailable</span>}
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Right Content */}
                  <div className="w-full lg:w-[65%] p-6">
                    {paymentMethod === 'cod' && (
                      <div className="animate-in fade-in duration-300">
                        <h3 className="font-bold text-[15px] mb-2 text-neutral-900">Pay on delivery (Cash/Card/UPI)</h3>
                        <p className="text-sm text-neutral-500 mb-8 leading-relaxed">
                          Pay in cash or pay in person at the time of delivery with GPay/PayTM/PhonePe.
                        </p>

                        <div className="hidden lg:block">
                          <Button
                            type="button" // Use type=button and manually call handleSubmit to match desktop flow if needed, but it's inside form
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full rounded-sm h-[50px] text-[15px] font-bold bg-[#1e1e24] hover:bg-black text-white transition-colors"
                          >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Place order'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'razorpay' && (
                      <div className="animate-in fade-in duration-300">
                        <h3 className="font-bold text-[15px] mb-2 text-neutral-900">Pay securely via Razorpay</h3>
                        <p className="text-sm text-neutral-500 mb-8 leading-relaxed">
                          Use any UPI app, Credit/Debit card, or Netbanking. You will be redirected to the secure payment gateway.
                        </p>

                        <div className="hidden lg:block">
                          <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full rounded-sm h-[50px] text-[15px] font-bold bg-[#1e1e24] hover:bg-black text-white transition-colors"
                          >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay ₹${total.toFixed(0)}`}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

          </div>

          {/* Right Column - Order Summary Sidebar (Same as Cart) */}
          <div className="w-full lg:w-[400px] shrink-0 mt-4 lg:mt-0">

            {/* Coupons Section */}
            <div className="bg-white lg:border lg:border-neutral-100 mb-2 lg:mb-4 lg:shadow-sm">
              {!appliedCoupon ? (
                <div className="p-4 flex flex-col transition-all cursor-pointer group">
                  <div onClick={() => setShowCouponInput(!showCouponInput)} className="flex items-center justify-between hover:bg-neutral-50 rounded bg-white w-full">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5"><Tag className="w-5 h-5 text-[#03a685] fill-[#03a685]" /></div>
                      <div>
                        <span className="text-sm font-bold text-neutral-900 block">Coupons and offers</span>
                        <span className="text-xs text-neutral-500">Save more with coupon and offers</span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm font-medium text-neutral-900 group-hover:text-[#ff3f6c]">
                      Apply <ChevronRight className={`w-4 h-4 ml-0.5 transition-transform ${showCouponInput ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {showCouponInput && (
                    <div className="mt-4 flex flex-col gap-2 relative">
                      <div className="flex gap-2">
                        <Input
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Enter coupon code"
                          className="h-10 text-sm focus-visible:ring-[#ff3f6c] uppercase"
                          disabled={couponLoading}
                        />
                        <Button
                          onClick={handleApplyCoupon}
                          disabled={!couponCode || couponLoading}
                          type="button"
                          className="h-10 px-6 bg-[#ff3f6c] hover:bg-[#d32f50] text-white"
                        >
                          {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                        </Button>
                      </div>
                      {couponError && <p className="text-xs text-red-500 font-medium">{couponError}</p>}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 flex items-center justify-between group">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5"><Tag className="w-5 h-5 text-[#ff3f6c] fill-pink-50" /></div>
                    <div>
                      <span className="text-sm font-bold text-[#ff3f6c] block uppercase">{appliedCoupon.coupon_code} applied</span>
                      <span className="text-xs text-neutral-500">You saved ₹{appliedCoupon.discount_amount.toFixed(0)}</span>
                    </div>
                  </div>
                  <button onClick={removeCoupon} type="button" className="flex items-center text-[12px] font-bold text-neutral-500 hover:text-neutral-900 bg-neutral-100 px-2 py-1 rounded">
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white lg:border lg:border-neutral-100 p-4 lg:p-6 lg:shadow-sm">

              <div className="space-y-3 lg:space-y-4 text-sm mt-2">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Item total</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-neutral-400 line-through">₹{(subtotal * 1.3).toFixed(0)}</span>
                    <span className="font-medium text-neutral-900">₹{subtotal.toFixed(0)}</span>
                  </div>
                </div>
                <div className="flex justify-between border-b border-dashed border-neutral-200 pb-4">
                  <span className="text-neutral-600">Delivery fee</span>
                  <div className="flex items-center gap-1.5">
                    {deliveryFee === 0 ? (
                      <>
                        <span className="text-xs text-neutral-400 line-through">₹99</span>
                        <span className="text-[#03a685] text-xs font-bold">FREE</span>
                      </>
                    ) : (
                      <span className="font-medium text-neutral-900">₹{deliveryFee.toFixed(0)}</span>
                    )}
                  </div>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between border-b border-dashed border-neutral-200 pb-4">
                    <span className="text-[#03a685] font-medium">Coupon ({appliedCoupon.coupon_code})</span>
                    <span className="text-[#03a685] font-bold">-₹{appliedCoupon.discount_amount.toFixed(0)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-start mt-4 mb-1">
                <div>
                  <span className="text-[15px] font-bold text-neutral-900 block">Grand total</span>
                  <span className="text-[11px] text-neutral-500">Inclusive of all taxes</span>
                </div>
                <span className="text-sm font-bold text-neutral-900">
                  ₹{total.toFixed(0)}
                </span>
              </div>

              <div className="border-t border-b border-neutral-100 py-3 my-4">
                <div className="text-[13px] text-neutral-600">
                  Average delivery time: <span className="font-bold text-neutral-900">3-5 days</span>
                </div>
              </div>

              <div className="bg-[#eafaf1] border border-[#d2f4e1] rounded-sm p-3 mb-6">
                <p className="text-[#03a685] text-sm font-medium leading-relaxed">
                  You have saved total 30% (₹{(subtotal * 0.3).toFixed(0)}) on your order! Yay!
                </p>
              </div>

              <div className="hidden lg:block">
                <Button
                  type="submit"
                  disabled={submitting || cart.items.length === 0}
                  className="w-full rounded-sm h-[50px] text-[15px] font-bold bg-[#1e1e24] hover:bg-black text-white transition-colors"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : checkoutStep === 2 ? 'Continue' : 'Place order'}
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Mobile Sticky Footer */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 p-3 flex items-center justify-between safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div>
            <p className="text-sm font-bold text-neutral-900">₹{subtotal.toFixed(0)}</p>
            <p className="text-xs text-[#03a685] font-bold underline cursor-pointer decoration-dotted underline-offset-4">View price details</p>
          </div>
          <div className="w-1/2 ml-4">
            <Button
              type="submit"
              form="checkoutMobileForm" // Not strictly needed, we intercept onClick
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full h-11 bg-[#1e1e24] hover:bg-black text-white font-bold text-sm rounded-sm"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : checkoutStep === 2 ? 'Continue' : 'Place order'}
            </Button>
          </div>
        </div>

      </main>
    </div>
  );
}
