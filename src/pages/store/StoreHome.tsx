import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StoreHeader } from '@/components/storefront/StoreHeader';
import { StoreFooter } from '@/components/storefront/StoreFooter';
import { HeroBanner } from '@/components/storefront/HeroBanner';
import { CategorySection } from '@/components/storefront/CategorySection';
import { BrandSection } from '@/components/storefront/BrandSection';
import { ProductSection } from '@/components/storefront/ProductSection';
import { PromoStrip } from '@/components/storefront/PromoStrip';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { Store } from 'lucide-react';

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

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_path: string | null;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
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

      const trialEnd = new Date(tenantData.trial_ends_at);
      const now = new Date();
      
      if (tenantData.plan === 'trial' && trialEnd < now) {
        setError('This store is currently unavailable');
        setLoading(false);
        return;
      }

      setTenant(tenantData as Tenant);

      // Fetch all data in parallel
      const [settingsRes, bannersRes, catsRes, brandsRes, prodsRes, newProdsRes] = await Promise.all([
        supabase.from('store_settings').select('*').eq('tenant_id', tenantData.id).maybeSingle(),
        supabase.from('store_banners').select('id, title, subtitle, image_path, cta_text, cta_url').eq('tenant_id', tenantData.id).eq('is_active', true).order('position', { ascending: true }),
        supabase.from('categories').select('id, name, slug').eq('tenant_id', tenantData.id).eq('is_active', true).limit(8),
        supabase.from('brands').select('id, name, slug, logo_path').eq('tenant_id', tenantData.id).eq('is_active', true).limit(6),
        supabase.from('products').select('id, name, slug, price, compare_at_price, images, stock_qty, has_variants, category:categories(name), brand:brands(name)').eq('tenant_id', tenantData.id).eq('is_active', true).limit(8),
        supabase.from('products').select('id, name, slug, price, compare_at_price, images, stock_qty, has_variants, category:categories(name), brand:brands(name)').eq('tenant_id', tenantData.id).eq('is_active', true).order('created_at', { ascending: false }).limit(8)
      ]);

      if (settingsRes.data) setStoreSettings(settingsRes.data);
      setBanners(bannersRes.data || []);
      setCategories(catsRes.data || []);
      setBrands(brandsRes.data || []);

      // Calculate variant stock
      const calcStock = async (prods: any[]) => {
        return Promise.all(prods.map(async (product: any) => {
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
        }));
      };

      setProducts(await calcStock(prodsRes.data || []) as Product[]);
      setNewProducts(await calcStock(newProdsRes.data || []) as Product[]);
      setLoading(false);
    };

    fetchData();
  }, [slug]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="border-b p-4"><Skeleton className="h-16 w-full" /></div>
        <Skeleton className="h-[400px] w-full" />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-neutral-400" />
            </div>
            <h1 className="text-2xl font-serif font-semibold mb-2">{error || 'Store not found'}</h1>
            <p className="text-neutral-500 mb-6">The store you're looking for doesn't exist or is currently unavailable.</p>
            <Link to="/"><Button>Go Home</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <StoreHeader
        storeName={tenant.store_name}
        storeSlug={tenant.store_slug}
        businessType={tenant.business_type}
        cartCount={itemCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        logoPath={storeSettings?.logo_path}
        categories={categories}
      />

      <HeroBanner
        banners={banners}
        storeSlug={tenant.store_slug}
        storeName={tenant.store_name}
        storeDescription={storeSettings?.website_description}
      />

      <CategorySection categories={categories} storeSlug={tenant.store_slug} />

      <ProductSection
        title="Best Sellers"
        subtitle="Top picks our customers can't get enough of — for good reason. They're equal parts stylish and versatile!"
        products={products}
        storeSlug={tenant.store_slug}
        onAddToCart={handleAddToCart}
        addingProductId={addingProduct}
      />

      <BrandSection brands={brands} storeSlug={tenant.store_slug} />

      <ProductSection
        title="Now Trending"
        subtitle="These aren't just new pieces — they're the ones everyone's talking about."
        products={newProducts}
        storeSlug={tenant.store_slug}
        onAddToCart={handleAddToCart}
        addingProductId={addingProduct}
        bgColor="bg-neutral-50"
        variant="carousel"
      />

      <PromoStrip storeSlug={tenant.store_slug} />

      <StoreFooter
        storeName={tenant.store_name}
        storeSlug={tenant.store_slug}
        address={storeSettings?.store_address || tenant.address}
        phone={storeSettings?.store_phone || tenant.phone}
        email={storeSettings?.store_email}
        logoPath={storeSettings?.logo_path}
      />
    </div>
  );
}
