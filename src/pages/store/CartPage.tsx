import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabaseStore } from '@/integrations/supabase/storeClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StoreHeader } from '@/components/storefront/StoreHeader';
import { StoreFooter } from '@/components/storefront/StoreFooter';
import { GroceryBottomNav } from '@/components/storefront/grocery/GroceryBottomNav';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, Package, ChevronLeft, Truck, ChevronRight } from 'lucide-react';
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




  // E-commerce Layout (Refined D2C)
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
        <h1 className="text-2xl lg:text-3xl font-serif text-neutral-900 tracking-tight mb-8">Shopping Cart</h1>

        {!cart || cart.items.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center bg-neutral-50 p-6">
            <ShoppingCart className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="font-medium text-lg text-neutral-900 mb-2">Your cart is empty</h3>
            <p className="text-neutral-500 mb-6">Discover our latest collections to get started.</p>
            <Link to={getLink('/products')}>
              <Button className="rounded-none px-8 py-6 text-sm tracking-widest uppercase bg-black text-white hover:bg-neutral-800">
                Continue Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
            <div className="flex-1 space-y-0">
              {cart.items.map((item) => {
                const imageUrl = getImageUrl(item.product?.images);
                return (
                  <div key={item.id} className="py-6 border-b border-neutral-100 flex gap-6 group first:pt-0">
                    <Link to={getLink(`/product/${item.product?.slug || ''}`)} className="block shrink-0">
                      <div className="w-24 h-32 md:w-32 md:h-40 bg-neutral-50 overflow-hidden relative">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.product?.name || 'Product'}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-neutral-300" />
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <Link to={getLink(`/product/${item.product?.slug || ''}`)}>
                            <h3 className="font-serif text-lg text-neutral-900 hover:text-neutral-600 transition-colors line-clamp-2">
                              {item.product?.name || 'Product'}
                            </h3>
                          </Link>
                          <p className="text-neutral-500 mt-1">₹{item.unit_price.toFixed(2)}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-black hover:bg-transparent -mt-2 -mr-2" onClick={() => removeItem(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center border border-neutral-200">
                          <button className="px-3 py-1 text-neutral-500 hover:text-black hover:bg-neutral-50 transition-colors" onClick={() => updateQuantity(item.id, item.qty - 1)}>
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-10 text-center text-sm">{item.qty}</span>
                          <button className="px-3 py-1 text-neutral-500 hover:text-black hover:bg-neutral-50 transition-colors" onClick={() => updateQuantity(item.id, item.qty + 1)}>
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="font-medium text-lg text-neutral-900">
                          ₹{(item.unit_price * item.qty).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="w-full lg:w-[380px] shrink-0">
              <div className="bg-neutral-50 p-8 sticky top-24">
                <h3 className="font-serif tracking-tight text-xl mb-6">Order Summary</h3>
                <div className="space-y-4 text-neutral-600 mb-6">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>
                <div className="border-t border-neutral-200 pt-4 flex justify-between font-medium text-lg mb-8 text-neutral-900">
                  <span>Total</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <Link to={getLink('/checkout')}>
                  <Button className="w-full rounded-none py-6 tracking-widest uppercase bg-black text-white hover:bg-neutral-800">
                    Proceed to Checkout
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <StoreFooter storeName={tenant.store_name} storeSlug={tenant.store_slug} address={tenant.address} phone={tenant.phone} />
    </div>
  );
}
