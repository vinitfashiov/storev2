import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StoreHeader } from '@/components/storefront/StoreHeader';
import { StoreFooter } from '@/components/storefront/StoreFooter';
import { GroceryBottomNav } from '@/components/storefront/grocery/GroceryBottomNav';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, Package, ChevronLeft, MapPin, Clock, Calendar, ChevronRight, Tag } from 'lucide-react';

interface Tenant {
  id: string;
  store_name: string;
  store_slug: string;
  business_type: 'ecommerce' | 'grocery';
  address: string | null;
  phone: string | null;
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
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const { cart, loading, itemCount, updateQuantity, removeItem, getSubtotal } = useCart(slug || '', tenant?.id || null);

  useEffect(() => {
    const fetchTenant = async () => {
      if (!slug) {
        setTenantLoading(false);
        return;
      }
      const { data } = await supabase
        .from('tenants')
        .select('id, store_name, store_slug, business_type, address, phone')
        .eq('store_slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (data) setTenant(data as Tenant);
      setTenantLoading(false);
    };
    fetchTenant();
  }, [slug]);

  const getImageUrl = (images: any) => {
    if (!images) return null;
    const imageArray = Array.isArray(images) ? images : (typeof images === 'string' ? [images] : []);
    if (imageArray.length === 0) return null;
    const img = imageArray[0];
    if (typeof img === 'string') {
      if (img.startsWith('http')) return img;
      return supabase.storage.from('product-images').getPublicUrl(img).data.publicUrl;
    }
    return null;
  };

  // Show skeleton while loading tenant data
  if (tenantLoading) return <CartSkeleton />;
  if (!tenant) return <CartSkeleton />;

  const subtotal = getSubtotal();
  const deliveryFee = 32;
  const taxes = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryFee + taxes;
  const isGrocery = tenant.business_type === 'grocery';

  // Grocery Mobile Layout
  if (isGrocery) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col pb-40 lg:pb-0">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-neutral-100">
          <div className="flex items-center gap-3 p-4">
            <button onClick={() => navigate(-1)} className="p-1">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Cart</h1>
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

        <main className="flex-1">
          {!cart || cart.items.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                <ShoppingCart className="w-10 h-10 text-neutral-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">Your cart is empty</h3>
              <p className="text-neutral-500 text-sm mb-6">Add some products to get started!</p>
              <Link to={`/store/${slug}/products`}>
                <Button className="bg-green-600 hover:bg-green-700">Browse Products</Button>
              </Link>
            </div>
          ) : (
            <div className="bg-white">
              {/* Delivery Address */}
              <div className="p-4 border-b border-neutral-100">
                <button className="flex items-center gap-3 w-full text-left">
                  <MapPin className="w-5 h-5 text-neutral-500" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Delivery Address</p>
                    <p className="text-xs text-neutral-500 truncate">2nd Cross, 1st Main HSR Layout, Bengaluru...</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="p-4">
                <h2 className="font-bold text-sm mb-3">Items in your cart</h2>
                <div className="space-y-4">
                  {cart.items.map((item) => {
                    const imageUrl = getImageUrl(item.product?.images);
                    return (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-16 h-16 bg-neutral-100 rounded-lg shrink-0 overflow-hidden flex items-center justify-center">
                          {imageUrl ? (
                            <img 
                              src={imageUrl} 
                              alt={item.product?.name || 'Product'} 
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <Package className="w-8 h-8 text-neutral-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm line-clamp-2">{item.product?.name || 'Product'}</h3>
                          <p className="text-xs text-neutral-500">₹{item.unit_price} / unit</p>
                        </div>
                        <div className="flex items-center gap-1 border border-green-600 rounded-lg">
                          <button 
                            onClick={() => updateQuantity(item.id, item.qty - 1)}
                            className="p-1.5 text-green-600"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-bold text-green-600 w-6 text-center">{item.qty}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.qty + 1)}
                            className="p-1.5 text-green-600"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Time Options */}
              <div className="p-4 border-t border-neutral-100">
                <h2 className="font-bold text-sm mb-3">Delivery Time</h2>
                <div className="flex gap-3">
                  <button className="flex-1 p-3 border-2 border-green-600 rounded-xl bg-green-50">
                    <div className="flex items-center gap-2 justify-center">
                      <Clock className="w-4 h-4" />
                      <span className="font-semibold text-sm">Standard</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">25-30 Mins</p>
                  </button>
                  <button className="flex-1 p-3 border border-neutral-200 rounded-xl">
                    <div className="flex items-center gap-2 justify-center">
                      <Calendar className="w-4 h-4" />
                      <span className="font-semibold text-sm">Schedule</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">Select Time</p>
                  </button>
                </div>
              </div>

              {/* Promo Code */}
              <div className="p-4 border-t border-neutral-100">
                <button className="flex items-center gap-3 w-full text-left">
                  <Tag className="w-5 h-5 text-neutral-500" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Add Promo code</p>
                    <p className="text-xs text-neutral-500">Apply promo code for discount</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              {/* Bill Details */}
              <div className="p-4 border-t border-neutral-100">
                <h2 className="font-bold text-sm mb-3">Bill Details</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Delivery fee</span>
                    <span>₹{deliveryFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Tax & other fees</span>
                    <span>₹{taxes}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-neutral-100">
                    <span>Total</span>
                    <span>₹{total}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Sticky Bottom */}
        {cart && cart.items.length > 0 && (
          <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 p-4">
            <Link to={`/store/${slug}/checkout`}>
              <Button className="w-full h-14 bg-green-700 hover:bg-green-800 text-white font-bold text-base rounded-xl">
                Make Payment
              </Button>
            </Link>
          </div>
        )}

        {/* Mobile Bottom Nav */}
        <GroceryBottomNav storeSlug={tenant.store_slug} cartCount={itemCount} />

        {/* Desktop Footer */}
        <div className="hidden lg:block">
          <StoreFooter storeName={tenant.store_name} storeSlug={tenant.store_slug} address={tenant.address} phone={tenant.phone} />
        </div>
      </div>
    );
  }

  // E-commerce Layout (Original)
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StoreHeader
        storeName={tenant.store_name}
        storeSlug={tenant.store_slug}
        businessType={tenant.business_type}
        cartCount={itemCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-display font-bold mb-6">Shopping Cart</h1>

        {!cart || cart.items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground mb-4">Add some products to get started!</p>
              <Link to={`/store/${slug}/products`}>
                <Button>Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => {
                const imageUrl = getImageUrl(item.product?.images);
                return (
                  <Card key={item.id}>
                    <CardContent className="p-4 flex gap-4">
                      <div className="w-20 h-20 bg-muted rounded-lg shrink-0 overflow-hidden flex items-center justify-center">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={item.product?.name || 'Product'} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-muted-foreground/30" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.product?.name || 'Product'}</h3>
                        <p className="text-primary font-bold">₹{item.unit_price.toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.qty - 1)}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center">{item.qty}</span>
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.qty + 1)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 ml-2 text-destructive" onClick={() => removeItem(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right font-bold">₹{(item.unit_price * item.qty).toFixed(2)}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="h-fit">
              <CardContent className="p-6">
                <h3 className="font-display font-bold mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Delivery</span><span>Calculated at checkout</span></div>
                </div>
                <div className="border-t pt-4 flex justify-between font-bold text-lg mb-4">
                  <span>Total</span><span>₹{subtotal.toFixed(2)}</span>
                </div>
                <Link to={`/store/${slug}/checkout`}>
                  <Button className="w-full" size="lg">
                    Checkout <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <StoreFooter storeName={tenant.store_name} storeSlug={tenant.store_slug} address={tenant.address} phone={tenant.phone} />
    </div>
  );
}
