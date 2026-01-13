import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { GroceryHeader } from '@/components/storefront/grocery/GroceryHeader';
import { GroceryBottomNav } from '@/components/storefront/grocery/GroceryBottomNav';
import { GroceryProductCard } from '@/components/storefront/grocery/GroceryProductCard';
import { GroceryLocationModal } from '@/components/storefront/grocery/GroceryLocationModal';
import { GroceryLocationProvider, useGroceryLocation } from '@/contexts/GroceryLocationContext';
import { useCart } from '@/hooks/useCart';
import { useCustomDomain } from '@/contexts/CustomDomainContext';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import { toast } from 'sonner';
import { ArrowLeft, Search, SlidersHorizontal, Mic, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

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
  unit?: string;
}

interface Tenant {
  id: string;
  store_name: string;
  store_slug: string;
  business_type: string;
}

// Default category icons
const categoryEmojis = ['🥬', '🥛', '🥣', '☕', '🥜', '🍪', '🍚', '🫙', '🧴', '🍫', '🧹', '🌿'];

export default function GroceryCategoriesPage() {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const customDomain = useCustomDomain();
  
  const slug = customDomain.isCustomDomain && customDomain.tenant 
    ? customDomain.tenant.store_slug 
    : urlSlug;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingProduct, setAddingProduct] = useState<string | null>(null);

  const selectedCategorySlug = searchParams.get('category') || '';

  const { itemCount, addToCart, cart } = useCart(slug || '', tenant?.id || null);

  // Find selected category
  const selectedCategory = useMemo(() => {
    return categories.find(c => c.slug === selectedCategorySlug) || categories[0];
  }, [categories, selectedCategorySlug]);

  // Get parent categories only
  const parentCategories = useMemo(() => {
    return categories.filter(c => !c.parent_id);
  }, [categories]);

  // Get cart item quantities for products
  const cartQuantities = useMemo(() => {
    const quantities: Record<string, number> = {};
    if (cart?.items) {
      cart.items.forEach(item => {
        quantities[item.product_id] = item.qty;
      });
    }
    return quantities;
  }, [cart]);

  // Fetch tenant and categories
  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      setLoading(true);

      const { data: tenantData } = await supabase
        .from('tenants')
        .select('id, store_name, store_slug, business_type')
        .eq('store_slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (tenantData) {
        setTenant(tenantData);

        const { data: catsData } = await supabase
          .from('categories')
          .select('id, name, slug, parent_id')
          .eq('tenant_id', tenantData.id)
          .eq('is_active', true)
          .order('name');

        setCategories(catsData || []);

        // If no category selected, select first parent category
        if (!selectedCategorySlug && catsData && catsData.length > 0) {
          const firstParent = catsData.find(c => !c.parent_id);
          if (firstParent) {
            setSearchParams({ category: firstParent.slug });
          }
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [slug, selectedCategorySlug, setSearchParams]);

  // Fetch products for selected category
  useEffect(() => {
    const fetchProducts = async () => {
      if (!tenant || !selectedCategory) {
        setProducts([]);
        return;
      }

      setProductsLoading(true);
      
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, price, compare_at_price, images, stock_qty, has_variants')
        .eq('tenant_id', tenant.id)
        .eq('category_id', selectedCategory.id)
        .eq('is_active', true)
        .order('name');

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

      setProducts(productsWithStock);
      setProductsLoading(false);
    };

    fetchProducts();
  }, [tenant, selectedCategory]);

  const handleCategorySelect = (categorySlug: string) => {
    setSearchParams({ category: categorySlug });
  };

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


  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Skeleton className="h-14 w-full" />
        <div className="flex">
          <div className="w-20 p-2 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-20 w-16 rounded-lg" />
            ))}
          </div>
          <div className="flex-1 p-4 grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p>Store not found</p>
      </div>
    );
  }

  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  
  const { isListening, isSupported, startListening, stopListening } = useVoiceSearch({
    onResult: (result) => {
      setSearchQuery(result);
    }
  });

  // Filter products by search
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  return (
    <div className="min-h-screen bg-white flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
        <div className="flex items-center gap-3 px-4 h-14">
          <Link to={`/store/${slug}`} className="p-1">
            <ArrowLeft className="w-5 h-5 text-neutral-700" />
          </Link>
          
          {showSearch ? (
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 relative">
                <Input
                  autoFocus
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pr-10"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-neutral-400" />
                  </button>
                )}
              </div>
              {isSupported && (
                <button 
                  onClick={isListening ? stopListening : startListening}
                  className={cn(
                    "p-2 rounded-full",
                    isListening ? "bg-red-500 text-white" : "bg-neutral-100"
                  )}
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>
          ) : (
            <>
              <h1 className="flex-1 font-semibold text-neutral-900 truncate">
                {selectedCategory?.name || 'Categories'}
              </h1>
              <button className="p-2" onClick={() => setShowSearch(true)}>
                <Search className="w-5 h-5 text-neutral-600" />
              </button>
              <button className="p-2">
                <SlidersHorizontal className="w-5 h-5 text-neutral-600" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Two Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Categories */}
        <aside className="w-20 bg-neutral-50 border-r border-neutral-200 overflow-y-auto flex-shrink-0">
          <div className="py-2">
            {parentCategories.map((category, index) => {
              const isSelected = selectedCategory?.id === category.id;
              const emoji = categoryEmojis[index % categoryEmojis.length];

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.slug)}
                  className={cn(
                    "w-full py-3 px-2 flex flex-col items-center gap-1.5 relative transition-colors",
                    isSelected 
                      ? "bg-white border-l-4 border-green-600" 
                      : "hover:bg-neutral-100"
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden",
                    isSelected ? "bg-green-50" : "bg-neutral-100"
                  )}>
                    <span className="text-2xl">{emoji}</span>
                  </div>
                  <span className={cn(
                    "text-[10px] text-center leading-tight line-clamp-2",
                    isSelected ? "text-green-700 font-semibold" : "text-neutral-600"
                  )}>
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Section - Products Grid */}
        <main className="flex-1 overflow-y-auto bg-white">
          {productsLoading ? (
            <div className="p-4 grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <span className="text-4xl mb-3">📦</span>
              <p className="text-neutral-600 font-medium">
                {searchQuery ? 'No products found' : 'No products in this category'}
              </p>
              <p className="text-sm text-neutral-400 mt-1">
                {searchQuery ? 'Try a different search' : 'Check back later for updates'}
              </p>
            </div>
          ) : (
            <div className="p-3 grid grid-cols-2 gap-3">
              {filteredProducts.map(product => (
                <GroceryProductCard
                  key={product.id}
                  product={product}
                  storeSlug={slug!}
                  onAddToCart={handleAddToCart}
                  cartQuantity={cartQuantities[product.id] || 0}
                  isAdding={addingProduct === product.id}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Bottom Navigation */}
      <GroceryBottomNav storeSlug={slug!} cartCount={itemCount} />
    </div>
  );
}
