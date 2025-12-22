import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { StoreHeader } from '@/components/storefront/StoreHeader';
import { StoreFooter } from '@/components/storefront/StoreFooter';
import { ProductCard } from '@/components/storefront/ProductCard';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { Package, Search, SlidersHorizontal, MapPin } from 'lucide-react';

interface Tenant {
  id: string;
  store_name: string;
  store_slug: string;
  business_type: 'ecommerce' | 'grocery';
  address: string | null;
  phone: string | null;
}

interface Category { id: string; name: string; slug: string; }
interface DeliveryZone { id: string; name: string; pincodes: string[]; }

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  stock_qty: number;
  category: { name: string } | null;
}

export default function ProductList() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [unavailableProductIds, setUnavailableProductIds] = useState<Set<string>>(new Set());
  const [pincode, setPincode] = useState(searchParams.get('pincode') || '');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('name');
  const [addingProduct, setAddingProduct] = useState<string | null>(null);

  const { itemCount, addToCart } = useCart(slug || '', tenant?.id || null);

  useEffect(() => {
    const fetchTenant = async () => {
      if (!slug) return;

      const { data } = await supabase
        .from('tenants')
        .select('id, store_name, store_slug, business_type, address, phone')
        .eq('store_slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        setTenant(data as Tenant);
        
        const { data: cats } = await supabase.from('categories').select('id, name, slug').eq('tenant_id', data.id).eq('is_active', true);
        setCategories(cats || []);

        // Fetch zones for grocery stores
        if (data.business_type === 'grocery') {
          const { data: zonesData } = await supabase.from('delivery_zones').select('id, name, pincodes').eq('tenant_id', data.id).eq('is_active', true);
          setZones(zonesData || []);
        }
      }
    };

    fetchTenant();
  }, [slug]);

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
        .select('id, name, slug, price, compare_at_price, images, stock_qty, category:categories(name)')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true);

      if (selectedCategory && selectedCategory !== 'all') {
        const cat = categories.find(c => c.slug === selectedCategory);
        if (cat) query = query.eq('category_id', cat.id);
      }

      if (searchQuery) query = query.ilike('name', `%${searchQuery}%`);

      if (sortBy === 'price-asc') query = query.order('price', { ascending: true });
      else if (sortBy === 'price-desc') query = query.order('price', { ascending: false });
      else query = query.order('name', { ascending: true });

      const { data } = await query;
      setProducts(data as Product[] || []);
      setLoading(false);
    };

    fetchProducts();
  }, [tenant, selectedCategory, searchQuery, sortBy, categories]);

  const handleAddToCart = async (productId: string, price: number) => {
    setAddingProduct(productId);
    const success = await addToCart(productId, price);
    if (success) toast.success('Added to cart!');
    else toast.error('Failed to add to cart');
    setAddingProduct(null);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const params = new URLSearchParams(searchParams);
    if (query) params.set('q', query);
    else params.delete('q');
    setSearchParams(params);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    const params = new URLSearchParams(searchParams);
    if (cat && cat !== 'all') params.set('category', cat);
    else params.delete('category');
    setSearchParams(params);
  };

  const handlePincodeChange = (newPincode: string) => {
    setPincode(newPincode);
    const params = new URLSearchParams(searchParams);
    if (newPincode) params.set('pincode', newPincode);
    else params.delete('pincode');
    setSearchParams(params);
  };

  // Filter out unavailable products for grocery stores with zone selected
  const filteredProducts = products.filter(p => !unavailableProductIds.has(p.id));

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
        {/* Grocery zone selector */}
        {isGrocery && zones.length > 0 && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="font-medium">Check delivery availability:</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Enter pincode"
                  value={pincode}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  className="w-32"
                  maxLength={6}
                />
                {selectedZone && (
                  <Badge variant="secondary" className="whitespace-nowrap">
                    {selectedZone.name}
                  </Badge>
                )}
                {pincode.length >= 6 && !selectedZone && zones.length > 0 && (
                  <span className="text-sm text-destructive">Not serviceable</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
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
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

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

          <div className="text-sm text-muted-foreground self-center">
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
              <h3 className="font-medium mb-2">No products found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try a different search term' : selectedZone ? 'No products available in this zone' : 'Products will appear here soon!'}
              </p>
              {searchQuery && (
                <Button variant="outline" className="mt-4" onClick={() => handleSearch('')}>
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      <StoreFooter
        storeName={tenant.store_name}
        address={tenant.address}
        phone={tenant.phone}
      />
    </div>
  );
}
