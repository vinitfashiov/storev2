import { useState, useCallback, memo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { StoreHeader } from '@/components/storefront/StoreHeader';
import { StoreFooter } from '@/components/storefront/StoreFooter';
import { HeroBanner } from '@/components/storefront/HeroBanner';
import { CategorySection } from '@/components/storefront/CategorySection';
import { BrandSection } from '@/components/storefront/BrandSection';
import { ProductSection } from '@/components/storefront/ProductSection';
import { PromoStrip } from '@/components/storefront/PromoStrip';
import { UnifiedBottomNav } from '@/components/storefront/unified/UnifiedBottomNav';
import { UnifiedProductCard } from '@/components/storefront/unified/UnifiedProductCard';
import { D2CHeader } from '@/components/storefront/d2c/D2CHeader';
import { D2CHeroBanner } from '@/components/storefront/d2c/D2CHeroBanner';
import { D2CProductSection } from '@/components/storefront/d2c/D2CProductSection';
import { D2CCategorySection } from '@/components/storefront/d2c/D2CCategorySection';
import { D2CFooter } from '@/components/storefront/d2c/D2CFooter';
import { D2CProductCard } from '@/components/storefront/d2c/D2CProductCard';
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
import { GroceryLocationModal } from '@/components/storefront/grocery/GroceryLocationModal';
import { GroceryNotDeliverable } from '@/components/storefront/grocery/GroceryNotDeliverable';
import { PageBuilderRenderer, usePublishedLayout } from '@/components/pageBuilder/PageBuilderRenderer';
import { GrapesJSRenderer, useHasGrapesJSLayout } from '@/components/pageBuilder/GrapesJSRenderer';
import { GroceryLocationProvider, useGroceryLocation } from '@/contexts/GroceryLocationContext';
import { useCart } from '@/hooks/useCart';
import { useCustomDomain } from '@/contexts/CustomDomainContext';
import { supabase } from '@/integrations/supabase/client';
import {
  useStoreData,
  useStoreSettings,
  useStoreBanners,
  useStoreCategories,
  useStoreBrands,
  useStoreProducts
} from '@/hooks/useOptimizedQueries';
import { toast } from 'sonner';
import { Store, Search, Heart, User, ShoppingCart, Package, ArrowRight } from 'lucide-react';
import SEOHead from '@/components/shared/SEOHead';
import { useDynamicManifest, useApplePWAConfig } from '@/hooks/useDynamicManifest';
import { StorefrontInstallBanner } from '@/components/pwa/StorefrontInstallBanner';

// Ultra-minimal loading - just a subtle indicator, content shell shows immediately
const LoadingSkeleton = memo(() => (
  <div className="min-h-screen bg-white">
    {/* Skeleton header */}
    <div className="h-14 bg-neutral-100 animate-pulse" />
    {/* Skeleton hero */}
    <div className="h-48 bg-neutral-50 animate-pulse" />
    {/* Skeleton content grid */}
    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 bg-neutral-100 rounded-lg animate-pulse" />
      ))}
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

// Inner component that uses the location context
function GroceryStoreContent({
  tenant,
  storeSettings,
  banners,
  categories,
  brands,
  products,
  newProducts,
  showHeader,
  showFooter,
  searchQuery,
  setSearchQuery,
  handleAddToCart,
  addingProduct,
  itemCount
}: {
  tenant: any;
  storeSettings: any;
  banners: any[];
  categories: any[];
  brands: any[];
  products: any[];
  newProducts: any[];
  showHeader: boolean;
  showFooter: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleAddToCart: (productId: string, price: number, quantity?: number) => void;
  addingProduct: string | null;
  itemCount: number;
}) {
  const navigate = useNavigate();
  const [showLocationModal, setShowLocationModal] = useState(false);

  const {
    isLocationSet,
    isDeliverable,
    isInitialized,
    isLoading: locationLoading
  } = useGroceryLocation();
  const { isCustomDomain } = useCustomDomain();

  const handleLocationClick = () => {
    setShowLocationModal(true);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      const path = `/products?q=${encodeURIComponent(searchQuery.trim())}`;
      const target = isCustomDomain ? path : `/store/${tenant.store_slug}${path}`;
      navigate(target);
    }
  };

  // Don't show not deliverable until location check is complete
  // This prevents the flash of "not deliverable" on page load
  const showNotDeliverable = isInitialized && isLocationSet && !isDeliverable && !locationLoading;

  // Show minimal loading while checking location (not full skeleton)
  if (!isInitialized && isLocationSet) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-neutral-500">Checking delivery...</p>
        </div>
      </div>
    );
  }

  if (showNotDeliverable) {
    return (
      <>
        <GroceryNotDeliverable
          storeName={tenant.store_name}
          onChangeLocation={handleLocationClick}
        />
        <GroceryLocationModal
          open={showLocationModal}
          onOpenChange={setShowLocationModal}
          tenantId={tenant.id}
        />
      </>
    );
  }

  // Show location modal if location not set (first time)
  const showFirstTimeModal = !isLocationSet;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col pb-20 lg:pb-0">
      {/* Location Modal */}
      <GroceryLocationModal
        open={showLocationModal || showFirstTimeModal}
        onOpenChange={setShowLocationModal}
        tenantId={tenant.id}
      />

      {/* Mobile Grocery Header */}
      {showHeader && (
        <div className="lg:hidden">
          <GroceryHeader
            storeName={tenant.store_name}
            storeSlug={tenant.store_slug}
            tenantId={tenant.id}
            logoPath={storeSettings?.logo_path}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
            onLocationClick={handleLocationClick}
          />
        </div>
      )}

      {/* Desktop Header */}
      {showHeader && (
        <div className="hidden lg:block">
          <GroceryDesktopHeader
            storeName={tenant.store_name}
            storeSlug={tenant.store_slug}
            logoPath={storeSettings?.logo_path}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
            deliveryAddress={storeSettings?.store_address || tenant.address || undefined}
            cartCount={itemCount}
            onLocationClick={handleLocationClick}
          />
        </div>
      )}

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
        {showFooter && (
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
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <GroceryBottomNav storeSlug={tenant.store_slug} cartCount={itemCount} />

      {/* PWA Install Banner - Mobile Only */}
      <StorefrontInstallBanner storeName={tenant.store_name} />
    </div>
  );
}

export default function StoreHome() {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
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
  const { hasLayout: hasGrapesLayout, isLoading: grapesLoading } = useHasGrapesJSLayout(tenant?.id);

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

  // Set dynamic PWA manifest for this storefront
  useDynamicManifest({
    type: 'storefront',
    slug: slug || undefined,
    tenantId: tenant?.id
  });

  // Update Apple PWA meta tags with store name
  useApplePWAConfig(
    storeSettings?.website_title || tenant?.store_name || 'Store',
    tenant?.business_type === 'grocery' ? '#059669' : '#6366f1'
  );

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

  const showHeader = storeSettings?.show_header ?? true;
  const showFooter = storeSettings?.show_footer ?? true;

  // Only show loading if we have NO tenant data yet - show skeleton with partial content ASAP
  if (tenantLoading && !tenant) {
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

  // Grocery Store Layout - wrapped with location provider
  if (isGrocery) {
    return (
      <GroceryLocationProvider tenantId={tenant.id}>
        <SEOHead
          title={`${tenant.store_name} Online Store – Powered by Storekriti`}
          description={storeSettings?.website_description || `Shop online from ${tenant.store_name}. Powered by Storekriti – India’s D2C ecommerce platform.`}
          canonicalUrl={`https://storekriti.com/store/${tenant.store_slug}`}
          type="website"
        />
        <GroceryStoreContent
          tenant={tenant}
          storeSettings={storeSettings}
          banners={banners}
          categories={categories}
          brands={brands}
          products={products}
          newProducts={newProducts}
          showHeader={showHeader}
          showFooter={showFooter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleAddToCart={handleAddToCart}
          addingProduct={addingProduct}
          itemCount={itemCount}
        />
      </GroceryLocationProvider>
    );
  }

  // Helper helper to generate correct links based on domain context
  // This logic is duplicated here because we pass strings to children like D2CProductSection
  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return customDomain.isCustomDomain ? cleanPath : `/store/${slug}${cleanPath}`;
  };

  // E-commerce Store Layout - Premium D2C Brand Design
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SEOHead
        title={`${tenant.store_name} Online Store – Powered by Storekriti`}
        description={storeSettings?.website_description || `Shop online from ${tenant.store_name}. Powered by Storekriti – India’s D2C ecommerce platform.`}
        canonicalUrl={`https://storekriti.com/store/${tenant.store_slug}`}
        type="website"
      />
      {/* D2C Header */}
      {showHeader && (
        <D2CHeader
          storeName={tenant.store_name}
          storeSlug={tenant.store_slug}
          logoPath={storeSettings?.logo_path}
          cartCount={itemCount}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categories={categories}
        />
      )}

      {/* Render builder content if available */}
      {hasGrapesLayout ? (
        <GrapesJSRenderer tenantId={tenant.id} />
      ) : hasPublishedLayout ? (
        <PageBuilderRenderer
          tenantId={tenant.id}
          storeSlug={tenant.store_slug}
          onAddToCart={handleAddToCart}
          addingProductId={addingProduct}
        />
      ) : (
        <main className="flex-1">
          <D2CHeroBanner
            banners={banners}
            storeSlug={tenant.store_slug}
            storeName={tenant.store_name}
            storeDescription={storeSettings?.website_description}
          />

          <D2CProductSection
            title="NEW ARRIVALS"
            subtitle="Fresh additions to elevate your everyday"
            products={newProducts}
            storeSlug={tenant.store_slug}
            onAddToCart={handleAddToCart}
            addingProductId={addingProduct}
            viewAllLink={getLink('/products')}
            columns={4}
            variant="featured"
          />

          <D2CCategorySection
            categories={categories}
            storeSlug={tenant.store_slug}
            variant="grid"
          />

          <D2CProductSection
            title="BEST SELLERS"
            subtitle="Our most-loved pieces, tried and trusted by our community"
            products={products}
            storeSlug={tenant.store_slug}
            onAddToCart={handleAddToCart}
            addingProductId={addingProduct}
            viewAllLink={getLink('/products')}
            columns={4}
          />
        </main>
      )}

      {showFooter && (
        <D2CFooter
          storeName={tenant.store_name}
          storeSlug={tenant.store_slug}
          logoPath={storeSettings?.logo_path}
          address={storeSettings?.store_address || tenant.address}
          phone={storeSettings?.store_phone || tenant.phone}
          email={storeSettings?.store_email}
        />
      )}

      {/* PWA Install Banner - Mobile Only */}
      <StorefrontInstallBanner storeName={tenant.store_name} />
    </div>
  );
}
