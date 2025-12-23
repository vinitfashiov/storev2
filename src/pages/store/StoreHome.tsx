import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StoreHeader } from '@/components/storefront/StoreHeader';
import { StoreFooter } from '@/components/storefront/StoreFooter';
import { ProductCard } from '@/components/storefront/ProductCard';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { 
  ArrowRight,
  Package,
  Truck,
  Shield,
  Clock,
  Store,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Tenant {
  id: string;
  store_name: string;
  store_slug: string;
  business_type: 'ecommerce' | 'grocery';
  plan: 'trial' | 'pro';
  trial_ends_at: string;
  is_active: boolean;
  address: string | null;
  phone: string | null;
}

interface StoreSettings {
  logo_path: string | null;
  favicon_path: string | null;
  website_title: string | null;
  website_description: string | null;
  store_email: string | null;
  store_phone: string | null;
  store_address: string | null;
}

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_path: string;
  cta_text: string | null;
  cta_url: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  stock_qty: number;
  has_variants?: boolean;
  total_variant_stock?: number;
  category: { name: string } | null;
  brand?: { name: string } | null;
}

export default function StoreHome() {
  const { slug } = useParams<{ slug: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingProduct, setAddingProduct] = useState<string | null>(null);

  const { itemCount, addToCart } = useCart(slug || '', tenant?.id || null);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) {
        setError('Store not found');
        setLoading(false);
        return;
      }

      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('store_slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (tenantError || !tenantData) {
        setError('Store not found');
        setLoading(false);
        return;
      }

      // Check trial expiry
      const trialEnd = new Date(tenantData.trial_ends_at);
      const now = new Date();
      
      if (tenantData.plan === 'trial' && trialEnd < now) {
        setError('This store is currently unavailable');
        setLoading(false);
        return;
      }

      setTenant(tenantData as Tenant);

      // Fetch store settings
      const { data: settingsData } = await supabase
        .from('store_settings')
        .select('*')
        .eq('tenant_id', tenantData.id)
        .maybeSingle();

      if (settingsData) {
        setStoreSettings(settingsData);
      }

      // Fetch active banners
      const { data: bannersData } = await supabase
        .from('store_banners')
        .select('id, title, subtitle, image_path, cta_text, cta_url')
        .eq('tenant_id', tenantData.id)
        .eq('is_active', true)
        .order('position', { ascending: true });

      setBanners(bannersData || []);

      // Fetch categories
      const { data: cats } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('tenant_id', tenantData.id)
        .eq('is_active', true)
        .limit(6);

      setCategories(cats || []);

      // Fetch featured products with variant stock calculation
      const { data: prods } = await supabase
        .from('products')
        .select('id, name, slug, price, compare_at_price, images, stock_qty, has_variants, category:categories(name), brand:brands(name)')
        .eq('tenant_id', tenantData.id)
        .eq('is_active', true)
        .limit(8);

      // Calculate total_variant_stock for products with variants
      const productsWithVariantStock = await Promise.all(
        (prods || []).map(async (product: any) => {
          if (product.has_variants) {
            const { data: variants } = await supabase
              .from('product_variants')
              .select('stock_qty')
              .eq('product_id', product.id)
              .eq('is_active', true);
            
            const totalStock = variants?.reduce((sum, v) => sum + (v.stock_qty || 0), 0) || 0;
            return { ...product, total_variant_stock: totalStock };
          }
          return product;
        })
      );

      setProducts(productsWithVariantStock as Product[]);
      setLoading(false);
    };

    fetchData();
  }, [slug]);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const handleAddToCart = async (productId: string, price: number) => {
    setAddingProduct(productId);
    const success = await addToCart(productId, price);
    if (success) {
      toast.success('Added to cart!');
    } else {
      toast.error('Failed to add to cart');
    }
    setAddingProduct(null);
  };

  const nextBanner = () => setCurrentBanner((prev) => (prev + 1) % banners.length);
  const prevBanner = () => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card p-4">
          <div className="container mx-auto flex items-center justify-between">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-20">
          <Skeleton className="h-48 w-full mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">{error || 'Store not found'}</h1>
            <p className="text-muted-foreground mb-6">
              The store you're looking for doesn't exist or is currently unavailable.
            </p>
            <Link to="/">
              <Button>Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StoreHeader
        storeName={tenant.store_name}
        storeSlug={tenant.store_slug}
        businessType={tenant.business_type}
        cartCount={itemCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        logoPath={storeSettings?.logo_path}
      />

      {/* Hero Section with Banners */}
      {banners.length > 0 ? (
        <section className="relative overflow-hidden">
          <div className="relative">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`transition-opacity duration-500 ${index === currentBanner ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
              >
                <div className="relative h-[300px] md:h-[400px] lg:h-[500px] bg-gradient-to-br from-primary/20 to-accent/20">
                  <img
                    src={banner.image_path}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
                  <div className="absolute inset-0 flex items-center">
                    <div className="container mx-auto px-4">
                      <div className="max-w-lg">
                        <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4 animate-fade-in">
                          {banner.title}
                        </h2>
                        {banner.subtitle && (
                          <p className="text-lg md:text-xl text-muted-foreground mb-6 animate-slide-up">
                            {banner.subtitle}
                          </p>
                        )}
                        {banner.cta_text && banner.cta_url && (
                          <Link to={banner.cta_url.startsWith('/') ? `/store/${slug}${banner.cta_url}` : banner.cta_url}>
                            <Button size="lg" className="shadow-glow animate-scale-in">
                              {banner.cta_text}
                              <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {banners.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                onClick={prevBanner}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                onClick={nextBanner}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBanner(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${index === currentBanner ? 'bg-primary' : 'bg-primary/30'}`}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      ) : (
        <section className="gradient-hero py-16 md:py-20 px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4 animate-fade-in">
              Welcome to {tenant.store_name}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up">
              {storeSettings?.website_description || (tenant.business_type === 'grocery' 
                ? 'Fresh groceries and essentials delivered to your door'
                : 'Discover amazing products at great prices'
              )}
            </p>
            <Link to={`/store/${slug}/products`}>
              <Button size="lg" className="shadow-glow animate-scale-in">
                Start Shopping
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Package className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-sm md:text-base mb-1">Quality Products</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Handpicked items</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                  <Truck className="w-5 h-5 md:w-6 md:h-6 text-accent" />
                </div>
                <h3 className="font-display font-semibold text-sm md:text-base mb-1">Fast Delivery</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Quick shipping</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-5 h-5 md:w-6 md:h-6 text-success" />
                </div>
                <h3 className="font-display font-semibold text-sm md:text-base mb-1">Secure Payments</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Safe checkout</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-warning/10 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-5 h-5 md:w-6 md:h-6 text-warning" />
                </div>
                <h3 className="font-display font-semibold text-sm md:text-base mb-1">24/7 Support</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Always here</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-12 px-4">
          <div className="container mx-auto">
            <h2 className="text-2xl font-display font-bold mb-6">Shop by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <Link 
                  key={cat.id} 
                  to={`/store/${slug}/products?category=${cat.slug}`}
                  className="group"
                >
                  <Card className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="py-6">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-medium text-sm">{cat.name}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-12 px-4 bg-muted/30 flex-1">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold">Featured Products</h2>
            <Link to={`/store/${slug}/products`}>
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  storeSlug={slug!}
                  onAddToCart={handleAddToCart}
                  isAdding={addingProduct === product.id}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-medium mb-2">No products yet</h3>
                <p className="text-sm text-muted-foreground">Products will appear here soon!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <StoreFooter
        storeName={tenant.store_name}
        storeSlug={tenant.store_slug}
        address={storeSettings?.store_address || tenant.address}
        phone={storeSettings?.store_phone || tenant.phone}
        email={storeSettings?.store_email}
      />
    </div>
  );
}
