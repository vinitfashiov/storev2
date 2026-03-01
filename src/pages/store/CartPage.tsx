import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabaseStore } from '@/integrations/supabase/storeClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StoreHeader } from '@/components/storefront/StoreHeader';
import { StoreFooter } from '@/components/storefront/StoreFooter';
import { GroceryBottomNav } from '@/components/storefront/grocery/GroceryBottomNav';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, Package, ChevronLeft, Truck, ChevronRight, ShieldCheck } from 'lucide-react';
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




  // E-commerce Layout (Modern D2C)
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex flex-col">
      <StoreHeader
        storeName={tenant.store_name}
        storeSlug={tenant.store_slug}
        businessType={tenant.business_type}
        cartCount={itemCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1 container mx-auto px-4 py-6 lg:py-12 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-2">
            Shopping Cart
          </h1>
          <p className="text-neutral-600 text-sm">{itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart</p>
        </div>

        {!cart || cart.items.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center bg-white rounded-3xl shadow-xl p-8 lg:p-16">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-6">
              <ShoppingCart className="w-16 h-16 text-purple-500" />
            </div>
            <h3 className="font-bold text-2xl text-neutral-900 mb-3">Your cart is empty</h3>
            <p className="text-neutral-500 mb-8 max-w-md">Looks like you haven't added anything yet. Start shopping to fill it up!</p>
            <Link to={getLink('/products')}>
              <Button className="rounded-full px-10 py-6 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="flex-1 space-y-4">
              {/* Free Delivery Banner */}
              {freeDeliveryThreshold && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 shadow-md ${isEligibleForFreeDelivery
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                  : 'bg-white border-2 border-dashed border-orange-300'
                  }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isEligibleForFreeDelivery ? 'bg-white/20' : 'bg-orange-100'}`}>
                    <Truck className={`w-5 h-5 ${isEligibleForFreeDelivery ? 'text-white' : 'text-orange-600'}`} />
                  </div>
                  <p className={`text-sm font-semibold ${isEligibleForFreeDelivery ? 'text-white' : 'text-neutral-800'}`}>
                    {isEligibleForFreeDelivery
                      ? '🎉 Yay! You qualified for FREE delivery!'
                      : `Add ₹${amountToFreeDelivery.toFixed(0)} more to unlock FREE delivery`
                    }
                  </p>
                </div>
              )}

              {/* Cart Items Cards */}
              {cart.items.map((item) => {
                const imageUrl = getImageUrl(item.product?.images);
                return (
                  <div key={item.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-4 lg:p-6 group relative">
                    <div className="flex gap-4 lg:gap-6">
                      <Link to={getLink(`/product/${item.product?.slug || ''}`)} className="block shrink-0">
                        <div className="w-24 h-28 lg:w-32 lg:h-36 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 overflow-hidden relative shadow-md">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.product?.name || 'Product'}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-10 h-10 text-neutral-400" />
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <Link to={getLink(`/product/${item.product?.slug || ''}`)}>
                            <h3 className="font-bold text-lg lg:text-xl text-neutral-900 hover:text-purple-600 transition-colors line-clamp-2 pr-8">
                              {item.product?.name || 'Product'}
                            </h3>
                          </Link>
                          <p className="text-neutral-500 mt-1 text-sm">Price: ₹{item.unit_price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center border-2 border-purple-200 rounded-full overflow-hidden bg-white shadow-sm">
                            <button className="px-3 py-2 hover:bg-purple-50 transition-colors" onClick={() => updateQuantity(item.id, item.qty - 1)}>
                              <Minus className="w-4 h-4 text-purple-600" />
                            </button>
                            <span className="w-12 text-center text-sm font-bold text-purple-700">{item.qty}</span>
                            <button className="px-3 py-2 hover:bg-purple-50 transition-colors" onClick={() => updateQuantity(item.id, item.qty + 1)}>
                              <Plus className="w-4 h-4 text-purple-600" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-neutral-500 mb-1">Total</p>
                            <p className="font-bold text-xl lg:text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                              ₹{(item.unit_price * item.qty).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-all"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Continue Shopping Link */}
              <Link to={getLink('/products')} className="block">
                <div className="bg-white/60 backdrop-blur-sm border-2 border-dashed border-purple-300 rounded-2xl p-4 hover:bg-white hover:border-purple-400 transition-all text-center group">
                  <p className="text-purple-600 font-semibold flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" />
                    Continue Shopping
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </p>
                </div>
              </Link>
            </div>

            {/* Order Summary Sidebar */}
            <div className="w-full lg:w-[420px] shrink-0">
              <div className="bg-white rounded-3xl shadow-2xl p-6 lg:p-8 sticky top-24 border border-neutral-100">
                <h3 className="font-bold text-2xl mb-6 text-neutral-900">Order Summary</h3>

                <div className="space-y-4 mb-6 pb-6 border-b border-neutral-200">
                  <div className="flex justify-between text-base">
                    <span className="text-neutral-600">Subtotal ({itemCount} items)</span>
                    <span className="font-semibold text-neutral-900">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-neutral-600">Shipping</span>
                    <span className="text-sm text-neutral-500">Calculated at checkout</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-8 pb-6 border-b border-neutral-200">
                  <span className="text-lg font-semibold text-neutral-700">Total Amount</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>

                <Link to={getLink('/checkout')}>
                  <Button className="w-full rounded-full h-14 text-base font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] mb-4">
                    Proceed to Checkout
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>

                <div className="flex items-center justify-center gap-2 text-sm text-neutral-500 mb-6">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  <span className="font-medium">100% Secure Checkout</span>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-3 pt-6 border-t border-neutral-100">
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-2 bg-purple-100 rounded-full flex items-center justify-center">
                      <Truck className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-xs text-neutral-600 font-medium">Fast Delivery</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-xs text-neutral-600 font-medium">Safe Payment</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-2 bg-orange-100 rounded-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-xs text-neutral-600 font-medium">Easy Returns</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
