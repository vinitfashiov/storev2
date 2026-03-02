import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabaseStore } from '@/integrations/supabase/storeClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StoreHeader } from '@/components/storefront/StoreHeader';
import { StoreFooter } from '@/components/storefront/StoreFooter';
import { GroceryBottomNav } from '@/components/storefront/grocery/GroceryBottomNav';
import { useCart } from '@/hooks/useCart';
import { CheckoutStepper } from '@/components/storefront/CheckoutStepper';
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, Package, ChevronLeft, Truck, ChevronRight, ShieldCheck, Tag, Loader2, X } from 'lucide-react';
import { useCustomDomain } from '@/contexts/CustomDomainContext';

interface Tenant {
  id: string;
  store_name: string;
  store_slug: string;
  business_type: 'ecommerce' | 'grocery';
  address: string | null;
  phone: string | null;
}

interface DeliverySettings {
  free_delivery_above: number | null;
}

// Loading skeleton for cart page
const CartSkeleton = () => (
  <div className="min-h-screen bg-neutral-50 flex flex-col">
    <div className="sticky top-0 z-40 bg-white border-b border-neutral-100 p-4">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-neutral-200 rounded animate-pulse" />
        <div className="w-20 h-6 bg-neutral-200 rounded animate-pulse" />
      </div>
    </div>
    <div className="p-4 space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-3 bg-white p-4 rounded-lg">
          <div className="w-16 h-16 bg-neutral-200 rounded-lg animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="w-3/4 h-4 bg-neutral-200 rounded animate-pulse" />
            <div className="w-1/2 h-3 bg-neutral-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function CartPage() {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { tenant: cdTenant, isCustomDomain } = useCustomDomain();

  // Use slug from params or context
  const slug = isCustomDomain ? cdTenant?.store_slug : paramSlug;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string; discount: number; type: string } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const { cart, loading, itemCount, updateQuantity, removeItem, getSubtotal } = useCart(slug || '', tenant?.id || null);

  const getLink = (path: string) => {
    if (!slug) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${slug}${cleanPath}`;
  };

  useEffect(() => {
    const fetchTenant = async () => {
      // If we have tenant from context, use it
      if (isCustomDomain && cdTenant) {
        setTenant(cdTenant as Tenant);
        if (cdTenant.business_type === 'grocery') {
          const { data: settings } = await supabaseStore
            .from('tenant_delivery_settings')
            .select('free_delivery_above')
            .eq('tenant_id', cdTenant.id)
            .maybeSingle();
          if (settings) {
            setDeliverySettings({
              free_delivery_above: settings.free_delivery_above ? Number(settings.free_delivery_above) : null
            });
          }
        } else if (cdTenant.business_type === 'ecommerce') {
          const { data: d2cSettings } = await supabaseStore
            .from('tenant_delivery_settings_d2c')
            .select('free_delivery_enabled, free_delivery_threshold')
            .eq('tenant_id', cdTenant.id)
            .maybeSingle();
          if (d2cSettings && d2cSettings.free_delivery_enabled) {
            setDeliverySettings({
              free_delivery_above: d2cSettings.free_delivery_threshold ? Number(d2cSettings.free_delivery_threshold) : null
            });
          }
        }
        setTenantLoading(false);
        return;
      }

      if (!slug) {
        setTenantLoading(false);
        return;
      }
      const { data } = await supabaseStore
        .from('tenants')
        .select('id, store_name, store_slug, business_type, address, phone')
        .eq('store_slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (data) {
        setTenant(data as Tenant);
        // Fetch delivery settings for grocery stores
        if (data.business_type === 'grocery') {
          const { data: settings } = await supabaseStore
            .from('tenant_delivery_settings')
            .select('free_delivery_above')
            .eq('tenant_id', data.id)
            .maybeSingle();
          if (settings) {
            setDeliverySettings({
              free_delivery_above: settings.free_delivery_above ? Number(settings.free_delivery_above) : null
            });
          }
        } else if (data.business_type === 'ecommerce') {
          const { data: d2cSettings } = await supabaseStore
            .from('tenant_delivery_settings_d2c')
            .select('free_delivery_enabled, free_delivery_threshold')
            .eq('tenant_id', data.id)
            .maybeSingle();
          if (d2cSettings && d2cSettings.free_delivery_enabled) {
            setDeliverySettings({
              free_delivery_above: d2cSettings.free_delivery_threshold ? Number(d2cSettings.free_delivery_threshold) : null
            });
          }
        }
      }
      setTenantLoading(false);
    };
    fetchTenant();
  }, [slug, isCustomDomain, cdTenant]);

  // Restore coupon on load
  useEffect(() => {
    const saved = sessionStorage.getItem('applied_coupon');
    if (saved) {
      try {
        setAppliedCoupon(JSON.parse(saved));
      } catch (e) { }
    }
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError('');

    try {
      const { data: coupon, error } = await supabaseStore
        .from('coupons')
        .select('*')
        .eq('tenant_id', tenant?.id)
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error || !coupon) {
        setCouponError('Invalid or expired coupon');
        setApplyingCoupon(false);
        return;
      }

      const subtotalVal = getSubtotal();

      if (coupon.min_cart_amount && subtotalVal < coupon.min_cart_amount) {
        setCouponError(`Add items worth ₹${coupon.min_cart_amount - subtotalVal} more to apply this coupon`);
        setApplyingCoupon(false);
        return;
      }

      const now = new Date();
      if (coupon.starts_at && new Date(coupon.starts_at) > now) {
        setCouponError('Coupon is not yet active');
        setApplyingCoupon(false);
        return;
      }
      if (coupon.ends_at && new Date(coupon.ends_at) < now) {
        setCouponError('Coupon has expired');
        setApplyingCoupon(false);
        return;
      }

      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        setCouponError('Coupon usage limit exceeded');
        setApplyingCoupon(false);
        return;
      }

      let discount = 0;
      if (coupon.type === 'percent') {
        discount = subtotalVal * (coupon.value / 100);
        if (coupon.max_discount_amount) {
          discount = Math.min(discount, coupon.max_discount_amount);
        }
      } else {
        discount = coupon.value;
      }

      const verifiedCoupon = {
        id: coupon.id,
        code: coupon.code,
        discount: discount,
        type: coupon.type
      };

      setAppliedCoupon(verifiedCoupon);
      setShowCouponInput(false);
      setCouponError('');

      sessionStorage.setItem('applied_coupon', JSON.stringify(verifiedCoupon));

    } catch (e: any) {
      setCouponError(e.message || 'Error applying coupon');
    }
    setApplyingCoupon(false);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    sessionStorage.removeItem('applied_coupon');
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

  // Show skeleton while loading tenant data
  if (tenantLoading) return <CartSkeleton />;
  if (!tenant) return <CartSkeleton />;

  const subtotal = getSubtotal();
  const isGrocery = tenant.business_type === 'grocery';

  // Check if eligible for free delivery
  const freeDeliveryThreshold = deliverySettings?.free_delivery_above;
  const isEligibleForFreeDelivery = freeDeliveryThreshold && subtotal >= freeDeliveryThreshold;
  const amountToFreeDelivery = freeDeliveryThreshold ? Math.max(0, freeDeliveryThreshold - subtotal) : 0;

  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  // Grocery Mobile Layout - Clean and Simple
  if (isGrocery) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-neutral-100">
          <div className="flex items-center gap-3 p-4">
            <button onClick={() => navigate(-1)} className="p-1">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Your Cart</h1>
            <span className="text-neutral-500 text-sm ml-auto">{itemCount} items</span>
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

        <main className="flex-1 pb-36 lg:pb-8">
          {!cart || cart.items.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                <ShoppingCart className="w-10 h-10 text-neutral-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">Your cart is empty</h3>
              <p className="text-neutral-500 text-sm mb-6">Add some products to get started!</p>
              <Link to={getLink('/products')}>
                <Button className="bg-green-600 hover:bg-green-700">Browse Products</Button>
              </Link>
            </div>
          ) : (
            <div className="lg:container lg:mx-auto lg:px-4 lg:py-8">
              <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                {/* Main Cart Content */}
                <div className="lg:col-span-2">
                  {/* Free Delivery Banner */}
                  {freeDeliveryThreshold && (
                    <div className={`mx-4 lg:mx-0 mt-4 lg:mt-0 p-3 rounded-xl flex items-center gap-3 ${isEligibleForFreeDelivery
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-amber-50 border border-amber-200'
                      }`}>
                      <Truck className={`w-5 h-5 ${isEligibleForFreeDelivery ? 'text-green-600' : 'text-amber-600'}`} />
                      <p className={`text-sm font-medium ${isEligibleForFreeDelivery ? 'text-green-700' : 'text-amber-700'}`}>
                        {isEligibleForFreeDelivery
                          ? '🎉 Yay! You are eligible for FREE delivery!'
                          : `Add ₹${amountToFreeDelivery.toFixed(0)} more for FREE delivery`
                        }
                      </p>
                    </div>
                  )}

                  {/* Cart Items */}
                  <div className="bg-white mt-4 lg:rounded-xl lg:border lg:border-neutral-200">
                    <div className="p-4 border-b border-neutral-100">
                      <h2 className="font-bold text-base">Cart Items ({cart.items.length})</h2>
                    </div>
                    <div className="divide-y divide-neutral-100">
                      {cart.items.map((item) => {
                        const imageUrl = getImageUrl(item.product?.images);
                        const lineTotal = item.unit_price * item.qty;
                        return (
                          <div key={item.id} className="flex gap-3 p-4">
                            <Link
                              to={getLink(`/product/${item.product?.slug || ''}`)}
                              className="w-20 h-20 bg-neutral-100 rounded-xl shrink-0 overflow-hidden flex items-center justify-center"
                            >
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={item.product?.name || 'Product'}
                                  className="w-full h-full object-contain p-1"
                                />
                              ) : (
                                <Package className="w-8 h-8 text-neutral-300" />
                              )}
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link to={getLink(`/product/${item.product?.slug || ''}`)}>
                                <h3 className="font-medium text-sm line-clamp-2 hover:text-green-600 transition-colors">
                                  {item.product?.name || 'Product'}
                                </h3>
                              </Link>
                              <p className="text-xs text-neutral-500 mt-0.5">₹{item.unit_price} per unit</p>
                              <div className="flex items-center justify-between mt-2">
                                <p className="font-bold text-green-700">₹{lineTotal.toFixed(2)}</p>
                                <div className="flex items-center gap-1 border border-green-600 rounded-lg bg-green-50">
                                  <button
                                    onClick={() => updateQuantity(item.id, item.qty - 1)}
                                    className="p-2 text-green-600 hover:bg-green-100 rounded-l-lg transition-colors active:scale-95"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="text-sm font-bold text-green-700 w-8 text-center">{item.qty}</span>
                                  <button
                                    onClick={() => updateQuantity(item.id, item.qty + 1)}
                                    className="p-2 text-green-600 hover:bg-green-100 rounded-r-lg transition-colors active:scale-95"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add More Items */}
                  <Link
                    to={getLink('/products')}
                    className="mx-4 lg:mx-0 mt-4 flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-200 hover:border-green-300 transition-colors"
                  >
                    <span className="text-sm font-medium text-neutral-700">Add more items</span>
                    <ChevronRight className="w-5 h-5 text-neutral-400" />
                  </Link>
                </div>

                {/* Order Summary - Desktop */}
                <div className="hidden lg:block">
                  <div className="bg-white rounded-xl border border-neutral-200 p-6 sticky top-24">
                    <h3 className="font-bold text-lg mb-4">Order Summary</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Subtotal ({itemCount} items)</span>
                        <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-neutral-500">
                        <span>Delivery & taxes</span>
                        <span>Calculated at checkout</span>
                      </div>
                    </div>
                    <div className="border-t border-neutral-200 mt-4 pt-4">
                      <div className="flex justify-between font-bold text-lg mb-4">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                    <Link to={getLink('/checkout')}>
                      <Button className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-base rounded-xl">
                        Proceed to Checkout
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {cart && cart.items.length > 0 && (
                <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-white border-t border-neutral-200 shadow-lg safe-area-bottom">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-neutral-500">Total</p>
                        <p className="text-xl font-bold">₹{subtotal.toFixed(2)}</p>
                      </div>
                      <Link to={getLink('/checkout')} className="flex-1 ml-4">
                        <Button className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-base rounded-xl">
                          Proceed to Checkout
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <GroceryBottomNav storeSlug={tenant.store_slug} cartCount={itemCount} />

              <div className="hidden lg:block">
                <StoreFooter storeName={tenant.store_name} storeSlug={tenant.store_slug} address={tenant.address} phone={tenant.phone} />
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }




  // E-commerce Layout (Modern D2C - Clean Professional)
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

      <main className="flex-1 lg:max-w-[1200px] lg:mx-auto w-full lg:px-4 pb-28 pt-0 lg:py-6">

        <CheckoutStepper currentStep={1} />

        {/* Header Section */}
        <div className="hidden lg:flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Cart ({itemCount} Item{itemCount !== 1 ? 's' : ''})
          </h1>
          <div className="text-xl font-bold text-neutral-900">
            Total ₹{getSubtotal().toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between bg-white px-4 py-3 border-b border-neutral-100 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-neutral-700">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-neutral-900">Shopping Bag</h1>
          </div>
          <span className="text-sm font-medium text-neutral-500 tracking-wide">STEP 1/3</span>
        </div>

        <div className="lg:hidden px-4 py-3 bg-neutral-50 flex justify-between items-center text-sm font-medium border-b border-neutral-100">
          <span className="text-neutral-600 uppercase tracking-widest text-[11px]">{itemCount} ITEM{itemCount !== 1 ? 'S' : ''}</span>
          <span className="text-neutral-900">Total ₹{getSubtotal().toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
        </div>

        {!cart || cart.items.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-lg shadow-sm p-8 lg:p-16">
            <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
              <ShoppingCart className="w-12 h-12 text-neutral-400" />
            </div>
            <h3 className="font-semibold text-xl text-neutral-900 mb-2">Your cart is empty</h3>
            <p className="text-neutral-500 mb-6 max-w-md">Add items to get started</p>
            <Link to={getLink('/products')}>
              <Button className="rounded-md px-8 h-11 text-sm font-semibold bg-[#ff3f6c] hover:bg-[#ff1744] text-white transition-colors">
                Continue Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Cart Items */}
            <div className="flex-1">
              {/* Free Delivery Banner */}
              {freeDeliveryThreshold && (
                <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${isEligibleForFreeDelivery
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-orange-50 border border-orange-200'
                  }`}>
                  <Truck className={`w-5 h-5 ${isEligibleForFreeDelivery ? 'text-green-600' : 'text-orange-600'}`} />
                  <p className={`text-sm font-medium ${isEligibleForFreeDelivery ? 'text-green-700' : 'text-orange-700'}`}>
                    {isEligibleForFreeDelivery
                      ? 'Yay! You are eligible for FREE delivery!'
                      : `Add ₹${amountToFreeDelivery.toFixed(0)} more to get FREE delivery`
                    }
                  </p>
                </div>
              )}

              {/* Cart Items Cards */}
              <div className="bg-white lg:rounded-sm lg:border lg:border-neutral-200 lg:shadow-sm">
                {cart.items.map((item, index) => {
                  const imageUrl = getImageUrl(item.product?.images);
                  return (
                    <div key={item.id} className={`p-4 lg:p-6 ${index !== cart.items.length - 1 ? 'border-b border-neutral-100' : ''}`}>
                      <div className="flex gap-4 lg:gap-6">
                        <Link to={getLink(`/product/${item.product?.slug || ''}`)} className="block shrink-0">
                          <div className="w-24 h-28 lg:w-32 lg:h-36 rounded-sm border border-neutral-100 overflow-hidden bg-white flex items-center justify-center p-2">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={item.product?.name || 'Product'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-neutral-300" />
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="flex-1 flex flex-col">
                          <div className="flex justify-between gap-4">
                            <div className="flex-1">
                              <Link to={getLink(`/product/${item.product?.slug || ''}`)}>
                                <h3 className="text-sm lg:text-base text-neutral-900 hover:text-[#ff3f6c] transition-colors line-clamp-2">
                                  {item.product?.name || 'Product'}
                                </h3>
                              </Link>

                              <div className="mt-2 flex items-baseline gap-2">
                                <span className="font-bold text-sm lg:text-base text-neutral-900">₹{item.unit_price.toFixed(0)}</span>
                                <span className="text-xs lg:text-sm text-neutral-400 line-through">₹{(item.unit_price * 1.3).toFixed(0)}</span>
                                <span className="text-xs lg:text-sm font-bold text-green-500">(30% off)</span>
                              </div>
                              <p className="text-xs text-neutral-500 mt-1 italic">You saved ₹{(item.unit_price * 0.3).toFixed(0)}!</p>
                            </div>

                            <button
                              className="text-xs font-bold text-neutral-500 hover:text-red-500 transition-colors h-fit uppercase tracking-wider"
                              onClick={() => removeItem(item.id)}
                            >
                              REMOVE
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-medium text-neutral-700">
                            {/* Dynamic variants rendering */}
                            {item.variant?.variant_attributes && item.variant.variant_attributes.length > 0 && item.variant.variant_attributes.map((attr, idx) => (
                              <div key={idx} className="flex items-center justify-between border border-neutral-200 bg-white rounded px-2 py-1.5 min-w-fit hover:border-neutral-300">
                                <span className="text-neutral-500 mr-1">{attr.attribute.name.toLowerCase()}:</span>
                                <span>
                                  {attr.attribute.name.toLowerCase() === 'color' ? (
                                    <div className="flex items-center">
                                      {/* Try to use the value directly if it's a valid color, else fallback to text */}
                                      {attr.attribute_value.value.startsWith('#') || /^[a-zA-Z]+$/.test(attr.attribute_value.value) ? (
                                        <div className="w-3 h-3 rounded-full border border-neutral-300" style={{ backgroundColor: attr.attribute_value.value.toLowerCase() }}></div>
                                      ) : (
                                        attr.attribute_value.value.toLowerCase()
                                      )}
                                    </div>
                                  ) : attr.attribute_value.value.toLowerCase()}
                                </span>
                              </div>
                            ))}

                            <div className="relative border border-neutral-200 bg-white rounded px-2 py-1.5 min-w-[70px] hover:border-neutral-300 cursor-pointer">
                              <select
                                className="w-full h-full absolute inset-0 opacity-0 cursor-pointer"
                                value={item.qty}
                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                              >
                                {[...Array(10)].map((_, i) => (
                                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                                ))}
                              </select>
                              <div className="flex items-center justify-between pointer-events-none">
                                <span className="mr-1">Qty: {item.qty}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 rotate-90" />
                              </div>
                            </div>
                          </div>
                          <div className="hidden items-center justify-between mt-auto pt-3">
                            <div className="flex items-center border border-neutral-300 rounded-sm bg-white">
                              <button className="px-3 py-1 text-xl font-light hover:bg-neutral-50 transition-colors" onClick={() => updateQuantity(item.id, item.qty - 1)}>-</button>
                              <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                              <button className="px-3 py-1 text-xl font-light hover:bg-neutral-50 transition-colors" onClick={() => updateQuantity(item.id, item.qty + 1)}>+</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Remove Add More items link from this spot, keep minimal */}
            </div>

            {/* Order Summary Sidebar */}
            <div className="w-full lg:w-[400px] shrink-0">

              {/* Coupons Section (Moved above summary) */}
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
                            disabled={applyingCoupon}
                          />
                          <Button
                            onClick={handleApplyCoupon}
                            disabled={!couponCode || applyingCoupon}
                            className="h-10 px-6 bg-[#ff3f6c] hover:bg-[#d32f50] text-white"
                          >
                            {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
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
                        <span className="text-sm font-bold text-[#ff3f6c] block uppercase">{appliedCoupon.code} applied</span>
                        <span className="text-xs text-neutral-500">You saved ₹{appliedCoupon.discount.toFixed(0)}</span>
                      </div>
                    </div>
                    <button onClick={handleRemoveCoupon} className="flex items-center text-[12px] font-bold text-neutral-500 hover:text-neutral-900 bg-neutral-100 px-2 py-1 rounded">
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
                    <span className="text-neutral-500 text-[13px] text-right">Calculated at checkout</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between border-b border-dashed border-neutral-200 pb-4">
                      <span className="text-[#03a685] font-medium">Coupon ({appliedCoupon.code})</span>
                      <span className="text-[#03a685] font-bold">-₹{appliedCoupon.discount.toFixed(0)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-start mt-4 mb-1">
                  <div>
                    <span className="text-[15px] font-bold text-neutral-900 block">Grand total</span>
                    <span className="text-[11px] text-neutral-500">Inclusive of all taxes</span>
                  </div>
                  <span className="text-sm font-bold text-neutral-900">
                    ₹{finalTotal.toFixed(0)}
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
                  <Link to={getLink('/checkout')}>
                    <Button className="w-full rounded-sm h-12 text-[15px] font-bold bg-[#1e1e24] hover:bg-black text-white transition-colors">
                      Continue
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Sticky Footer */}
        {cart && cart.items.length > 0 && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 p-3 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-[max(12px,env(safe-area-inset-bottom))]">
            <div>
              <p className="text-sm font-bold text-neutral-900">₹{finalTotal.toFixed(0)}</p>
              <p className="text-xs text-[#03a685] font-bold underline cursor-pointer decoration-dotted underline-offset-4">View price details</p>
            </div>
            <Link to={getLink('/checkout')} className="w-1/2 ml-4 relative z-10">
              <Button className="w-full h-11 bg-[#1e1e24] hover:bg-black text-white font-bold text-sm rounded-sm">
                Continue
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
