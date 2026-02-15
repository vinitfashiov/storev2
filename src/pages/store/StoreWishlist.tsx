import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabaseStore } from '@/integrations/supabase/storeClient';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import { useCustomDomain } from '@/contexts/CustomDomainContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_at_price: number | null;
    images: string[] | null;
    stock_qty: number;
  };
}

// Loading skeleton for wishlist page
const WishlistSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-4 h-4 bg-muted rounded animate-pulse" />
        <div className="w-24 h-4 bg-muted rounded animate-pulse" />
      </div>
      <div className="w-32 h-8 bg-muted rounded animate-pulse mb-6" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-card rounded-lg overflow-hidden">
            <div className="w-full h-48 bg-muted animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="w-3/4 h-4 bg-muted rounded animate-pulse" />
              <div className="flex justify-between">
                <div className="w-20 h-5 bg-muted rounded animate-pulse" />
                <div className="w-8 h-8 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function StoreWishlist() {
  const { slug: paramSlug } = useParams();
  const { customer, loading: authLoading } = useStoreAuth();
  const { isCustomDomain, tenant: cdTenant } = useCustomDomain();
  const slug = isCustomDomain ? cdTenant?.store_slug : paramSlug;
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${slug}${cleanPath}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!slug || !customer) { setLoading(false); return; }

      const { data: tenantData } = await supabaseStore
        .from('tenants')
        .select('id')
        .eq('store_slug', slug)
        .single();

      if (tenantData) {
        const { data: wishlistData } = await supabaseStore
          .from('wishlists')
          .select('id, product:products(id, name, slug, price, compare_at_price, images, stock_qty)')
          .eq('tenant_id', tenantData.id)
          .eq('customer_id', customer.id);

        setWishlist(wishlistData as WishlistItem[] || []);
      }
      setLoading(false);
    };

    if (!authLoading) {
      fetchData();
    }
  }, [slug, customer, authLoading]);

  const removeFromWishlist = async (wishlistId: string) => {
    const { error } = await supabaseStore.from('wishlists').delete().eq('id', wishlistId);
    if (error) { toast.error('Failed to remove'); return; }
    setWishlist(wishlist.filter(w => w.id !== wishlistId));
    toast.success('Removed from wishlist');
  };

  const getImageUrl = (images: string[] | null) => {
    if (!images || images.length === 0) return '/placeholder.svg';
    const img = images[0];
    if (img.startsWith('http')) return img;
    return supabaseStore.storage.from('product-images').getPublicUrl(img).data.publicUrl;
  };

  // Show skeleton while loading
  if (authLoading || loading) return <WishlistSkeleton />;

  if (!customer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-12 text-center">
            <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sign in to view your wishlist</h1>
            <p className="text-muted-foreground mb-6">Save your favorite products for later</p>
            <Button asChild><Link to={getLink('/login')}>Sign In</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to={getLink('/')}><ArrowLeft className="w-4 h-4 mr-2" /> Back to shop</Link>
        </Button>

        <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>

        {wishlist.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6">Save products you love by clicking the heart icon</p>
              <Button asChild><Link to={getLink('/')}>Start Shopping</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wishlist.map(item => (
              <Card key={item.id} className="overflow-hidden">
                <Link to={getLink(`/product/${item.product.slug}`)}>
                  <img src={getImageUrl(item.product.images)} alt={item.product.name} className="w-full h-48 object-cover" />
                </Link>
                <CardContent className="p-4">
                  <Link to={getLink(`/product/${item.product.slug}`)}>
                    <h3 className="font-medium mb-2 hover:underline">{item.product.name}</h3>
                  </Link>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">₹{item.product.price.toFixed(2)}</span>
                    <Button variant="outline" size="icon" onClick={() => removeFromWishlist(item.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
