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

      <main className="flex-1 container mx-auto px-4 py-6 lg:py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-1">
            Shopping Cart ({itemCount})
          </h1>
          <p className="text-neutral-600 text-sm">{itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart</p>
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
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
                {cart.items.map((item, index) => {
                  const imageUrl = getImageUrl(item.product?.images);
                  return (
                    <div key={item.id} className={`p-4 lg:p-5 ${index !== cart.items.length - 1 ? 'border-b border-neutral-200' : ''}`}>
                      <div className="flex gap-4 lg:gap-5">
                        <Link to={getLink(`/product/${item.product?.slug || ''}`)} className="block shrink-0">
                          <div className="w-24 h-28 lg:w-28 lg:h-32 rounded-md border border-neutral-200 overflow-hidden bg-neutral-50">
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
                                <h3 className="font-medium text-base lg:text-lg text-neutral-900 hover:text-[#ff3f6c] transition-colors line-clamp-2">
                                  {item.product?.name || 'Product'}
                                </h3>
                              </Link>
                              <p className="text-neutral-500 mt-1 text-sm">₹{item.unit_price.toFixed(2)}</p>
                            </div>
                            <button
                              className="text-neutral-400 hover:text-red-500 transition-colors h-fit"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-auto pt-3">
                            <div className="flex items-center border border-neutral-300 rounded-md">
                              <button className="px-3 py-1.5 hover:bg-neutral-100 transition-colors" onClick={() => updateQuantity(item.id, item.qty - 1)}>
                                <Minus className="w-4 h-4 text-neutral-600" />
                              </button>
                              <span className="w-10 text-center text-sm font-medium border-x border-neutral-300">{item.qty}</span>
                              <button className="px-3 py-1.5 hover:bg-neutral-100 transition-colors" onClick={() => updateQuantity(item.id, item.qty + 1)}>
                                <Plus className="w-4 h-4 text-neutral-600" />
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-neutral-900">
                                ₹{(item.unit_price * item.qty).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Continue Shopping Link */}
              <Link to={getLink('/products')} className="block mt-4">
                <div className="bg-white border border-neutral-200 rounded-lg p-4 hover:border-[#ff3f6c] transition-colors text-center">
                  <p className="text-[#ff3f6c] font-medium flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add More Items
                  </p>
                </div>
              </Link>
            </div>

            {/* Order Summary Sidebar */}
            <div className="w-full lg:w-[380px] shrink-0">
              <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-5 lg:p-6 sticky top-24">
                <h3 className="font-bold text-lg mb-5 text-neutral-900 pb-4 border-b border-neutral-200">Price Details</h3>

                <div className="space-y-3.5 mb-5 pb-5 border-b border-neutral-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-700">Price ({itemCount} items)</span>
                    <span className="font-medium text-neutral-900">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-700">Delivery Charges</span>
                    <span className="text-sm text-green-600 font-medium">To be calculated</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6 pb-5 border-b border-neutral-200">
                  <span className="text-base font-bold text-neutral-900">Total Amount</span>
                  <span className="text-2xl font-bold text-neutral-900">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>

                <Link to={getLink('/checkout')}>
                  <Button className="w-full rounded-md h-12 text-base font-bold bg-[#ff3f6c] hover:bg-[#ff1744] text-white transition-colors mb-4">
                    Place Order
                  </Button>
                </Link>

                <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span>Safe and Secure Payments</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
