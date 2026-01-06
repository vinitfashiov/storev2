import { useState, useCallback, memo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StoreHeader } from '@/components/storefront/StoreHeader';
import { StoreFooter } from '@/components/storefront/StoreFooter';
import { HeroBanner } from '@/components/storefront/HeroBanner';
import { CategorySection } from '@/components/storefront/CategorySection';
import { BrandSection } from '@/components/storefront/BrandSection';
import { ProductSection } from '@/components/storefront/ProductSection';
import { PromoStrip } from '@/components/storefront/PromoStrip';
import { GroceryHeader } from '@/components/storefront/grocery/GroceryHeader';
import { GroceryBottomNav } from '@/components/storefront/grocery/GroceryBottomNav';
import { GroceryPromoBanner } from '@/components/storefront/grocery/GroceryPromoBanner';
import { GroceryCategoryGrid } from '@/components/storefront/grocery/GroceryCategoryGrid';
import { GroceryBrandScroll } from '@/components/storefront/grocery/GroceryBrandScroll';
import { GroceryProductSection } from '@/components/storefront/grocery/GroceryProductSection';
import { GroceryMembershipCard } from '@/components/storefront/grocery/GroceryPromoElements';
import { GroceryDesktopHeader } from '@/components/storefront/grocery/GroceryDesktopHeader';
import { GroceryHeroBanner } from '@/components/storefront/grocery/GroceryHeroBanner';
import { GroceryPromoCards } from '@/components/storefront/grocery/GroceryPromoCards';
import { GroceryDesktopCategoryGrid } from '@/components/storefront/grocery/GroceryDesktopCategoryGrid';
import { GroceryDesktopProductSection } from '@/components/storefront/grocery/GroceryDesktopProductSection';
import { PageBuilderRenderer, usePublishedLayout } from '@/components/pageBuilder/PageBuilderRenderer';
import { useCart } from '@/hooks/useCart';
import { useCustomDomain } from '@/contexts/CustomDomainContext';
import { 
  useStoreData, 
  useStoreSettings, 
  useStoreBanners, 
  useStoreCategories, 
  useStoreBrands,
  useStoreProducts
} from '@/hooks/useOptimizedQueries';
import { toast } from 'sonner';
import { Store } from 'lucide-react';

// Memoized loading skeleton
const LoadingSkeleton = memo(() => (
  <div className="min-h-screen bg-white">
    <div className="p-4"><Skeleton className="h-16 w-full rounded-xl" /></div>
    <div className="p-4"><Skeleton className="h-40 w-full rounded-2xl" /></div>
    <div className="p-4 grid grid-cols-4 gap-3">
      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="aspect-square rounded-xl" />)}
    </div>
  </div>
));

// Error state component
const ErrorState = memo(({ error }: { error: string }) => (
  <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
    <Card className="max-w-md w-full text-center">
      <CardContent className="py-12">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8 text-neutral-400" />
        </div>
        <h1 className="text-2xl font-serif font-semibold mb-2">{error}</h1>
        <p className="text-neutral-500 mb-6">The store you're looking for doesn't exist or is currently unavailable.</p>
        <Link to="/"><Button>Go Home</Button></Link>
      </CardContent>
    </Card>
  </div>
));

export default function StoreHome() {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const customDomain = useCustomDomain();
  
  const slug = customDomain.isCustomDomain && customDomain.tenant 
    ? customDomain.tenant.store_slug 
    : urlSlug;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [addingProduct, setAddingProduct] = useState<string | null>(null);

  // Optimized queries with caching
  const { data: tenant, isLoading: tenantLoading, error: tenantError } = useStoreData(slug);
  const { data: storeSettings } = useStoreSettings(tenant?.id);
  const { data: banners = [] } = useStoreBanners(tenant?.id);
  const { data: categories = [] } = useStoreCategories(tenant?.id, 12);
  const { data: brands = [] } = useStoreBrands(tenant?.id, 8);
  
  // IMPORTANT: Call hooks unconditionally before any returns
  const { data: publishedLayout, isLoading: layoutLoading } = usePublishedLayout(tenant?.id);
  
  const { data: productsData } = useStoreProducts({ 
    tenantId: tenant?.id, 
    limit: 10,
    sortBy: 'created'
  });
  const products = productsData?.products || [];

  const { data: newProductsData } = useStoreProducts({ 
    tenantId: tenant?.id, 
    limit: 10,
    sortBy: 'created'
  });
  const newProducts = newProductsData?.products || [];

  const { itemCount, addToCart } = useCart(slug || '', tenant?.id || null);

  // Check trial expiry
  const isExpired = tenant && tenant.plan === 'trial' && new Date(tenant.trial_ends_at) < new Date();

  const handleAddToCart = useCallback(async (productId: string, price: number, quantity: number = 1) => {
    setAddingProduct(productId);
    const success = await addToCart(productId, price, quantity);
    if (success) {
      toast.success('Added to cart!');
    } else {
      toast.error('Failed to add to cart');
    }
    setAddingProduct(null);
  }, [addToCart]);

  // Check if there's a valid published layout
  const hasPublishedLayout = publishedLayout && publishedLayout.sections && publishedLayout.sections.length > 0;

  // Loading state
  if (tenantLoading || layoutLoading) {
    return <LoadingSkeleton />;
  }

  // Error states
  if (tenantError || !tenant) {
    return <ErrorState error="Store not found" />;
  }

  if (isExpired) {
    return <ErrorState error="This store is currently unavailable" />;
  }

  const isGrocery = tenant.business_type === 'grocery';

  // Grocery Store Layout
  if (isGrocery) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col pb-20 lg:pb-0">
        {/* Mobile Grocery Header */}
        <div className="lg:hidden">
          <GroceryHeader
            storeName={tenant.store_name}
            storeSlug={tenant.store_slug}
            logoPath={storeSettings?.logo_path}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            deliveryAddress={storeSettings?.store_address || tenant.address || undefined}
          />
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <GroceryDesktopHeader
            storeName={tenant.store_name}
            storeSlug={tenant.store_slug}
            logoPath={storeSettings?.logo_path}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            deliveryAddress={storeSettings?.store_address || tenant.address || undefined}
            cartCount={itemCount}
          />
        </div>

        <main className="flex-1 bg-white lg:bg-neutral-50">
          {/* Mobile Layout */}
          <div className="lg:hidden">
            <GroceryPromoBanner banners={banners} storeSlug={tenant.store_slug} />
            <GroceryMembershipCard storeSlug={tenant.store_slug} />
            <GroceryProductSection
              title="Bestsellers"
              products={products as any}
              storeSlug={tenant.store_slug}
              onAddToCart={handleAddToCart}
              addingProductId={addingProduct}
            />
            <GroceryCategoryGrid 
              categories={categories} 
              storeSlug={tenant.store_slug}
            />
            <GroceryBrandScroll 
              brands={brands} 
              storeSlug={tenant.store_slug}
            />
            <GroceryProductSection
              title="New Arrivals"
              products={newProducts as any}
              storeSlug={tenant.store_slug}
              onAddToCart={handleAddToCart}
              addingProductId={addingProduct}
            />
          </div>

          {/* Desktop Layout - Blinkit Style */}
          <div className="hidden lg:block max-w-7xl mx-auto">
            <GroceryHeroBanner banners={banners} storeSlug={tenant.store_slug} />
            <GroceryPromoCards storeSlug={tenant.store_slug} />
            <GroceryDesktopCategoryGrid 
              categories={categories} 
              storeSlug={tenant.store_slug}
            />
            <GroceryDesktopProductSection
              title="Dairy, Bread & Eggs"
              products={products as any}
              storeSlug={tenant.store_slug}
              onAddToCart={handleAddToCart}
              addingProductId={addingProduct}
            />
            <GroceryDesktopProductSection
              title="Snacks & Munchies"
              products={newProducts as any}
              storeSlug={tenant.store_slug}
              onAddToCart={handleAddToCart}
              addingProductId={addingProduct}
            />
            <GroceryDesktopProductSection
              title="Cold Drinks & Juices"
              products={products.slice().reverse() as any}
              storeSlug={tenant.store_slug}
              onAddToCart={handleAddToCart}
              addingProductId={addingProduct}
            />
            <GroceryDesktopProductSection
              title="Bestsellers"
              products={[...products, ...newProducts].slice(0, 10) as any}
              storeSlug={tenant.store_slug}
              onAddToCart={handleAddToCart}
              addingProductId={addingProduct}
            />
          </div>

          {/* Desktop Footer */}
          <div className="hidden lg:block mt-8">
            <StoreFooter
              storeName={tenant.store_name}
              storeSlug={tenant.store_slug}
              address={storeSettings?.store_address || tenant.address}
              phone={storeSettings?.store_phone || tenant.phone}
              email={storeSettings?.store_email}
              logoPath={storeSettings?.logo_path}
            />
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <GroceryBottomNav storeSlug={tenant.store_slug} cartCount={itemCount} />
      </div>
    );
  }

  // E-commerce Store Layout - Use Page Builder if available
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

      {/* Render Page Builder content if available, otherwise default layout */}
      {hasPublishedLayout ? (
        <PageBuilderRenderer
          tenantId={tenant.id}
          storeSlug={tenant.store_slug}
          onAddToCart={handleAddToCart}
          addingProductId={addingProduct}
        />
      ) : (
        <>
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
            products={products as any}
            storeSlug={tenant.store_slug}
            onAddToCart={handleAddToCart}
            addingProductId={addingProduct}
          />

          <BrandSection brands={brands} storeSlug={tenant.store_slug} />

          <ProductSection
            title="Now Trending"
            subtitle="These aren't just new pieces — they're the ones everyone's talking about."
            products={newProducts as any}
            storeSlug={tenant.store_slug}
            onAddToCart={handleAddToCart}
            addingProductId={addingProduct}
            bgColor="bg-neutral-50"
            variant="carousel"
          />

          <PromoStrip storeSlug={tenant.store_slug} />
        </>
      )}

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
