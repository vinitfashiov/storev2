import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StoreHeader } from '@/components/storefront/StoreHeader';
import { StoreFooter } from '@/components/storefront/StoreFooter';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, Package } from 'lucide-react';

interface Tenant {
  id: string;
  store_name: string;
  store_slug: string;
  business_type: 'ecommerce' | 'grocery';
  address: string | null;
  phone: string | null;
}

export default function CartPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { cart, loading, itemCount, updateQuantity, removeItem, getSubtotal } = useCart(slug || '', tenant?.id || null);

  useEffect(() => {
    const fetchTenant = async () => {
      if (!slug) return;
      const { data } = await supabase
        .from('tenants')
        .select('id, store_name, store_slug, business_type, address, phone')
        .eq('store_slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (data) setTenant(data as Tenant);
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

  if (!tenant) return null;

  const subtotal = getSubtotal();

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

      <StoreFooter storeName={tenant.store_name} address={tenant.address} phone={tenant.phone} />
    </div>
  );
}
