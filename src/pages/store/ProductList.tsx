import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { StoreHeader } from '@/components/storefront/StoreHeader';
import { StoreFooter } from '@/components/storefront/StoreFooter';
import { ProductCard } from '@/components/storefront/ProductCard';
import { GroceryProductCard } from '@/components/storefront/grocery/GroceryProductCard';
import { GroceryBottomNav } from '@/components/storefront/grocery/GroceryBottomNav';
import { useCart } from '@/hooks/useCart';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import { useCustomDomain } from '@/contexts/CustomDomainContext';
import { toast } from 'sonner';
import { Package, Search, SlidersHorizontal, MapPin, X, ArrowLeft } from 'lucide-react';

interface Tenant {
  id: string;
  store_name: string;
  store_slug: string;
  business_type: 'ecommerce' | 'grocery';
  address: string | null;
  phone: string | null;
}

interface Category { id: string; name: string; slug: string; parent_id: string | null; }
interface Brand { id: string; name: string; slug: string; }
interface DeliveryZone { id: string; name: string; pincodes: string[]; }

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  stock_qty: number;
  has_variants: boolean;
  total_variant_stock?: number;
  category: { name: string } | null;
  brand: { name: string } | null;
}

export default function ProductList() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { customer } = useStoreAuth();
  const { tenant: customDomainTenant, isCustomDomain } = useCustomDomain();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [unavailableProductIds, setUnavailableProductIds] = useState<Set<string>>(new Set());
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [pincode, setPincode] = useState(searchParams.get('pincode') || '');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || 'all');
  const [sortBy, setSortBy] = useState('name');
  const [addingProduct, setAddingProduct] = useState<string | null>(null);

  // Price filter state
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [maxPrice, setMaxPrice] = useState(100000);

  // Live search results
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Use either the URL slug or the custom domain tenant slug
  const effectiveSlug = slug || customDomainTenant?.store_slug;
  const effectiveTenantId = tenant?.id || customDomainTenant?.id;

  const { itemCount, addToCart } = useCart(effectiveSlug || '', effectiveTenantId || null);

  // Helper to generate correct links based on domain context
  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${effectiveSlug}${cleanPath}`;
  };

  useEffect(() => {
    const fetchTenant = async () => {
      let currentTenant = customDomainTenant as Tenant | null;

      if (!currentTenant) {
        if (!slug) return;

        const { data } = await supabase
          .from('tenants')
          .select('id, store_name, store_slug, business_type, address, phone')
          .eq('store_slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (!data) return;
        currentTenant = data as Tenant;
      }

      setTenant(currentTenant);

      const [catsRes, brandsRes] = await Promise.all([
        supabase.from('categories').select('id, name, slug, parent_id').eq('tenant_id', currentTenant.id).eq('is_active', true),
        supabase.from('brands').select('id, name, slug').eq('tenant_id', currentTenant.id).eq('is_active', true)
      ]);
      setCategories(catsRes.data || []);
      setBrands(brandsRes.data || []);

      // Fetch zones for grocery stores
      if (currentTenant.business_type === 'grocery') {
        const { data: zonesData } = await supabase.from('delivery_zones').select('id, name, pincodes').eq('tenant_id', currentTenant.id).eq('is_active', true);
        setZones(zonesData || []);
      }
    };

    fetchTenant();
  }, [slug, customDomainTenant]);

  // Fetch wishlist for logged in customer
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!customer || !tenant) return;
      const { data } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('tenant_id', tenant.id)
        .eq('customer_id', customer.id);
      setWishlistedIds(new Set(data?.map(w => w.product_id) || []));
    };
    fetchWishlist();
  }, [customer, tenant]);

  // Handle zone selection from pincode
  useEffect(() => {
    if (!pincode || pincode.length < 6 || tenant?.business_type !== 'grocery') {
      setSelectedZone(null);
      return;
    }
    const matchedZone = zones.find(z => z.pincodes.includes(pincode));
    setSelectedZone(matchedZone || null);
  }, [pincode, zones, tenant?.business_type]);

  // Fetch product availability for selected zone
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedZone || !tenant) {
        setUnavailableProductIds(new Set());
        return;
      }
      const { data } = await supabase
        .from('product_zone_availability')
        .select('product_id')
        .eq('tenant_id', tenant.id)
        .eq('zone_id', selectedZone.id)
        .eq('is_available', false);

      setUnavailableProductIds(new Set(data?.map(p => p.product_id) || []));
    };
    fetchAvailability();
  }, [selectedZone, tenant]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!tenant) return;

      setLoading(true);
      let query = supabase
        .from('products')
        .select('id, name, slug, price, compare_at_price, images, stock_qty, has_variants, category:categories(name), brand:brands(name)')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true);

      if (selectedCategory && selectedCategory !== 'all') {
        const cat = categories.find(c => c.slug === selectedCategory);
        if (cat) query = query.eq('category_id', cat.id);
      }

      if (selectedBrand && selectedBrand !== 'all') {
        const brand = brands.find(b => b.slug === selectedBrand);
        if (brand) query = query.eq('brand_id', brand.id);
      }

      if (sortBy === 'price-asc') query = query.order('price', { ascending: true });
      else if (sortBy === 'price-desc') query = query.order('price', { ascending: false });
      else query = query.order('name', { ascending: true });

      const { data } = await query;

      // Fetch variant stock for products with variants
      const productsWithStock: Product[] = [];
      for (const p of (data || [])) {
        let totalVariantStock = 0;
        if (p.has_variants) {
          const { data: variants } = await supabase
            .from('product_variants')
            .select('stock_qty')
            .eq('product_id', p.id)
            .eq('is_active', true);
          totalVariantStock = variants?.reduce((sum, v) => sum + v.stock_qty, 0) || 0;
        }
        productsWithStock.push({
          ...p,
          images: Array.isArray(p.images) ? p.images : [],
          total_variant_stock: totalVariantStock
        } as Product);
      }

      // Update max price for filter
      const prices = productsWithStock.map(p => p.price);
      if (prices.length > 0) {
        const max = Math.ceil(Math.max(...prices) / 100) * 100;
        setMaxPrice(max || 100000);
        setPriceRange([0, max || 100000]);
      }

      setProducts(productsWithStock);
      setLoading(false);
    };

    fetchProducts();
  }, [tenant, selectedCategory, selectedBrand, sortBy, categories, brands]);

  const handleAddToCart = async (productId: string, price: number) => {
    setAddingProduct(productId);
    const success = await addToCart(productId, price);
    if (success) toast.success('Added to cart!');
    else toast.error('Failed to add to cart');
    setAddingProduct(null);
  };

  const handleToggleWishlist = async (productId: string) => {
    if (!customer || !tenant) {
      toast.error('Please sign in to add to wishlist');
      return;
    }

    if (wishlistedIds.has(productId)) {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('tenant_id', tenant.id)
        .eq('customer_id', customer.id)
        .eq('product_id', productId);

      if (!error) {
        setWishlistedIds(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        toast.success('Removed from wishlist');
      }
    } else {
      const { error } = await supabase.from('wishlists').insert({
        tenant_id: tenant.id,
        customer_id: customer.id,
        product_id: productId
      });

      if (!error) {
        setWishlistedIds(prev => new Set(prev).add(productId));
        toast.success('Added to wishlist');
      }
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowSearchResults(query.length > 0);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    const params = new URLSearchParams(searchParams);
    if (cat && cat !== 'all') params.set('category', cat);
    else params.delete('category');
    setSearchParams(params);
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    const params = new URLSearchParams(searchParams);
    if (brand && brand !== 'all') params.set('brand', brand);
    else params.delete('brand');
    setSearchParams(params);
  };

  const handlePincodeChange = (newPincode: string) => {
    setPincode(newPincode);
    const params = new URLSearchParams(searchParams);
    if (newPincode) params.set('pincode', newPincode);
    else params.delete('pincode');
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setPriceRange([0, maxPrice]);
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchParams({});
  };

  // Filter products by search, price, and zone availability
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Zone availability filter
      if (unavailableProductIds.has(p.id)) return false;

      // Search filter
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      // Price filter
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;

      return true;
    });
  }, [products, unavailableProductIds, searchQuery, priceRange]);

  // Live search results (top 5)
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    return products
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 5);
  }, [products, searchQuery]);

  // Get parent categories for display
  const parentCategories = categories.filter(c => !c.parent_id);

  const hasActiveFilters = selectedCategory !== 'all' || selectedBrand !== 'all' || searchQuery || priceRange[0] > 0 || priceRange[1] < maxPrice;

  // Get cart item quantities for grocery products - MUST be before any conditional returns
  const cartQuantities = useMemo(() => {
    const quantities: Record<string, number> = {};
    return quantities;
  }, []);

  if (!tenant) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-20 text-center">
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  const isGrocery = tenant.business_type === 'grocery';

  // Grocery Layout
  if (isGrocery) {
    return (
      <div className="min-h-screen bg-white flex flex-col pb-20">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
          <div className="flex items-center gap-3 px-4 h-14">
            <Link to={getLink('/')} className="p-1">
              <ArrowLeft className="w-5 h-5 text-neutral-700" />
            </Link>
            <h1 className="flex-1 font-semibold text-neutral-900 truncate">
              {selectedCategory !== 'all'
                ? parentCategories.find(c => c.slug === selectedCategory)?.name || 'Products'
                : 'All Products'}
            </h1>
            <button className="p-2">
              <Search className="w-5 h-5 text-neutral-600" />
            </button>
            <button className="p-2">
              <SlidersHorizontal className="w-5 h-5 text-neutral-600" />
            </button>
          </div>

          {/* Filter Bar */}
          <div className="px-4 py-2 flex gap-2 overflow-x-auto">
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-auto min-w-[130px] h-9 text-sm bg-neutral-100 border-0">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {parentCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {brands.length > 0 && (
              <Select value={selectedBrand} onValueChange={handleBrandChange}>
                <SelectTrigger className="w-auto min-w-[110px] h-9 text-sm bg-neutral-100 border-0">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map(brand => (
                    <SelectItem key={brand.id} value={brand.slug}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-auto min-w-[120px] h-9 text-sm bg-neutral-100 border-0">
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-white">
          {/* Price Filter (compact) */}
          <div className="px-4 py-3 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium text-neutral-600">Price Range:</Label>
              <div className="flex-1 max-w-[200px]">
                <Slider
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  max={maxPrice}
                  min={0}
                  step={100}
                  className="w-full"
                />
              </div>
              <span className="text-sm text-neutral-600">₹{priceRange[0]} - ₹{priceRange[1]}</span>
            </div>
          </div>

          {/* Product Count */}
          <div className="px-4 py-2 text-sm text-neutral-500">
            {filteredProducts.length} products
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="p-3 grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="p-3 grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <GroceryProductCard
                  key={product.id}
                  product={product as any}
                  storeSlug={effectiveSlug!}
                  onAddToCart={handleAddToCart}
                  cartQuantity={cartQuantities[product.id] || 0}
                  isAdding={addingProduct === product.id}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <span className="text-4xl mb-3">📦</span>
              <p className="text-neutral-600 font-medium">No products found</p>
              <p className="text-sm text-neutral-400 mt-1">
                {searchQuery ? 'Try a different search' : 'Check back later'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </main>

        {/* Bottom Navigation */}
        <GroceryBottomNav storeSlug={effectiveSlug!} cartCount={itemCount} />
      </div>
    );
  }

  // E-commerce Layout (existing)
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StoreHeader
        storeName={tenant.store_name}
        storeSlug={tenant.store_slug}
        businessType={tenant.business_type}
        cartCount={itemCount}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Live Search Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="relative mb-4">
            <Card className="absolute z-50 w-full max-w-md shadow-lg">
              <CardContent className="p-2">
                {searchResults.map(product => (
                  <Link
                    key={product.id}
                    to={getLink(`/product/${product.slug}`)}
                    className="flex items-center gap-3 p-2 hover:bg-muted rounded-md"
                    onClick={() => setShowSearchResults(false)}
                  >
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                      {product.images?.[0] ? (
                        <img
                          src={supabase.storage.from('product-images').getPublicUrl(product.images[0]).data.publicUrl}
                          alt={product.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Package className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-primary">₹{product.price}</p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative md:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {parentCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {brands.length > 0 && (
                <Select value={selectedBrand} onValueChange={handleBrandChange}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands.map(brand => (
                      <SelectItem key={brand.id} value={brand.slug}>{brand.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <Label className="whitespace-nowrap font-medium">Price Range:</Label>
            <div className="flex-1 w-full sm:max-w-xs">
              <Slider
                value={priceRange}
                onValueChange={(value) => setPriceRange(value as [number, number])}
                max={maxPrice}
                min={0}
                step={100}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>₹{priceRange[0]}</span>
              <span>-</span>
              <span>₹{priceRange[1]}</span>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" /> Clear Filters
              </Button>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            {filteredProducts.length} products
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                storeSlug={effectiveSlug!}
                onAddToCart={handleAddToCart}
                isAdding={addingProduct === product.id}
                isWishlisted={wishlistedIds.has(product.id)}
                onToggleWishlist={customer ? handleToggleWishlist : undefined}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium mb-2">No products found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try a different search term' : selectedZone ? 'No products available in this zone' : 'Products will appear here soon!'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      <StoreFooter
        storeName={tenant.store_name}
        storeSlug={tenant.store_slug}
        address={tenant.address}
        phone={tenant.phone}
      />
    </div>
  );
}
