import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabaseStore } from '@/integrations/supabase/storeClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StoreHeader } from '@/components/storefront/StoreHeader';
import { StoreFooter } from '@/components/storefront/StoreFooter';
import { D2CProductCard } from '@/components/storefront/d2c/D2CProductCard';
import { useCart } from '@/hooks/useCart';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import { useCustomDomain } from '@/contexts/CustomDomainContext';
import { toast } from 'sonner';
import {
  Package,
  ShoppingCart,
  Minus,
  Plus,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Heart,
  Clock,
  Star,
  Share2
} from 'lucide-react';

interface Tenant {
  id: string;
  store_name: string;
  store_slug: string;
  business_type: 'ecommerce' | 'grocery';
  address: string | null;
  phone: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  images: string[];
  stock_qty: number;
  has_variants: boolean;
  category_id: string | null;
  category: { name: string } | null;
  brand: { name: string } | null;
}

interface Variant {
  id: string;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  stock_qty: number;
  is_active: boolean;
  attributes: { attribute_name: string; value: string }[];
}

interface AttributeOption {
  name: string;
  values: string[];
}

export default function ProductDetail() {
  const { slug, productSlug } = useParams<{ slug: string; productSlug: string }>();
  const navigate = useNavigate();
  const { customer } = useStoreAuth();
  const { tenant: customDomainTenant, isCustomDomain } = useCustomDomain();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [attributeOptions, setAttributeOptions] = useState<AttributeOption[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);

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
    const fetchData = async () => {
      let currentTenant = customDomainTenant as Tenant | null;

      if (!currentTenant) {
        if (!slug) return;

        const { data: tenantData } = await supabaseStore
          .from('tenants')
          .select('id, store_name, store_slug, business_type, address, phone')
          .eq('store_slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (!tenantData) {
          setLoading(false);
          return;
        }
        currentTenant = tenantData as Tenant;
      }

      setTenant(currentTenant);

      if (!productSlug) return;

      const { data: productData } = await supabaseStore
        .from('products')
        .select('*, category:categories(name), brand:brands(name)')
        .eq('tenant_id', currentTenant.id)
        .eq('slug', productSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (productData) {
        setProduct(productData as Product);

        // Fetch similar products
        if (productData.category_id) {
          const { data: similarData } = await supabaseStore
            .from('products')
            .select('*, category:categories(name), brand:brands(name)')
            .eq('tenant_id', currentTenant.id)
            .eq('category_id', productData.category_id)
            .neq('id', productData.id)
            .eq('is_active', true)
            .limit(8);
          if (similarData) setSimilarProducts(similarData as Product[]);
        }

        if (productData.has_variants) {
          const { data: variantsData } = await supabaseStore
            .from('product_variants')
            .select('id, sku, price, compare_at_price, stock_qty, is_active')
            .eq('product_id', productData.id)
            .eq('is_active', true);

          if (variantsData && variantsData.length > 0) {
            const variantIds = variantsData.map(v => v.id);
            const { data: variantAttrsData } = await supabaseStore
              .from('variant_attributes')
              .select('variant_id, attribute:attributes(name), attribute_value:attribute_values(value)')
              .in('variant_id', variantIds);

            const variantsWithAttrs = variantsData.map(v => ({
              ...v,
              attributes: (variantAttrsData || [])
                .filter(va => va.variant_id === v.id)
                .map(va => ({
                  attribute_name: (va.attribute as any)?.name || '',
                  value: (va.attribute_value as any)?.value || ''
                }))
            }));

            setVariants(variantsWithAttrs);

            const attrMap: Record<string, Set<string>> = {};
            variantsWithAttrs.forEach(v => {
              v.attributes.forEach(a => {
                if (!attrMap[a.attribute_name]) attrMap[a.attribute_name] = new Set();
                attrMap[a.attribute_name].add(a.value);
              });
            });

            const options = Object.entries(attrMap).map(([name, values]) => ({
              name,
              values: Array.from(values)
            }));

            setAttributeOptions(options);

            if (options.length > 0) {
              const initialSelection: Record<string, string> = {};
              options.forEach(opt => {
                initialSelection[opt.name] = opt.values[0];
              });
              setSelectedAttributes(initialSelection);
            }
          }
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [slug, productSlug, customDomainTenant]);

  useEffect(() => {
    if (!product?.has_variants || variants.length === 0) {
      setSelectedVariant(null);
      return;
    }

    const matchingVariant = variants.find(v => {
      return v.attributes.every(a => selectedAttributes[a.attribute_name] === a.value);
    });

    setSelectedVariant(matchingVariant || null);
  }, [selectedAttributes, variants, product?.has_variants]);

  useEffect(() => {
    const checkWishlist = async () => {
      if (!customer || !tenant || !product) return;
      const { data } = await supabaseStore
        .from('wishlists')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('customer_id', customer.id)
        .eq('product_id', product.id)
        .maybeSingle();
      setIsWishlisted(!!data);
    };
    checkWishlist();
  }, [customer, tenant, product]);

  const handleToggleWishlist = async () => {
    if (!customer || !tenant || !product) {
      toast.error('Please sign in to add to wishlist');
      return;
    }

    if (isWishlisted) {
      await supabaseStore
        .from('wishlists')
        .delete()
        .eq('tenant_id', tenant.id)
        .eq('customer_id', customer.id)
        .eq('product_id', product.id);
      setIsWishlisted(false);
      toast.success('Removed from wishlist');
    } else {
      await supabaseStore.from('wishlists').insert({
        tenant_id: tenant.id,
        customer_id: customer.id,
        product_id: product.id
      });
      setIsWishlisted(true);
      toast.success('Added to wishlist');
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    const price = selectedVariant?.price ?? product.price;
    const stockQty = selectedVariant?.stock_qty ?? product.stock_qty;

    if (stockQty <= 0) {
      toast.error('This item is out of stock');
      return;
    }

    setAdding(true);
    const success = await addToCart(product.id, price, quantity);
    if (success) {
      toast.success(`Added ${quantity} item(s) to cart!`);
    } else {
      toast.error('Failed to add to cart');
    }
    setAdding(false);
  };

  const handleBuyNow = async () => {
    if (!product) return;

    const price = selectedVariant?.price ?? product.price;
    const stockQty = selectedVariant?.stock_qty ?? product.stock_qty;

    if (stockQty <= 0) {
      toast.error('This item is out of stock');
      return;
    }

    setAdding(true);
    const success = await addToCart(product.id, price, quantity);
    setAdding(false);

    if (success) {
      navigate(getLink('/checkout'));
    } else {
      toast.error('Failed to initiate checkout');
    }
  };

  const getImageUrl = (img: string) => {
    if (img.startsWith('http')) return img;
    return supabaseStore.storage.from('product-images').getPublicUrl(img).data.publicUrl;
  };

  const displayPrice = selectedVariant?.price ?? product?.price ?? 0;
  const displayComparePrice = selectedVariant?.compare_at_price ?? product?.compare_at_price;
  const displayStockQty = selectedVariant?.stock_qty ?? product?.stock_qty ?? 0;

  const discount = displayComparePrice
    ? Math.round(((displayComparePrice - displayPrice) / displayComparePrice) * 100)
    : 0;

  const isOutOfStock = displayStockQty <= 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="p-4"><Skeleton className="h-12 w-full" /></div>
        <Skeleton className="aspect-[4/5] w-full" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!tenant || !product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <Package className="w-16 h-16 text-neutral-200 mb-6" />
        <h1 className="text-2xl font-normal tracking-wide text-neutral-900 mb-2">Product not found</h1>
        <p className="text-neutral-500 mb-8 text-center max-w-sm">We couldn't find the product you're looking for. It may have been removed or is currently unavailable.</p>
        <Link to={getLink('/products')}>
          <Button className="rounded-none h-12 px-8 bg-black text-white hover:bg-neutral-800 uppercase tracking-widest text-xs font-bold">Back to Shop</Button>
        </Link>
      </div>
    );
  }

  // Premium D2C Layout
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-black selection:text-white">
      {/* Universal Header - No longer hidden on mobile */}
      <StoreHeader
        storeName={tenant.store_name}
        storeSlug={tenant.store_slug}
        businessType={tenant.business_type}
        cartCount={itemCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1 pb-24 lg:pb-0">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-medium tracking-wide text-neutral-400 mb-6 lg:mb-10 pb-4 border-b border-neutral-100 overflow-x-auto whitespace-nowrap hide-scrollbar">
            <Link to={getLink('/')} className="hover:text-black transition-colors uppercase">Home</Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <Link to={getLink('/products')} className="hover:text-black transition-colors uppercase">Shop</Link>
            {product.category && (
              <>
                <ChevronRight className="w-3 h-3 shrink-0" />
                <span className="text-black uppercase">{product.category.name}</span>
              </>
            )}
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-black uppercase truncate max-w-[200px] sm:max-w-none">{product.name}</span>
          </nav>

          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16">

            {/* Left Column: Images */}
            <div className="lg:col-span-7 xl:col-span-7 relative">

              {/* Desktop: Image Grid Strategy */}
              <div className="hidden lg:grid grid-cols-2 gap-4">
                {product.images?.map((img, idx) => (
                  <div key={idx} className={`bg-neutral-50 overflow-hidden ${idx === 0 && product.images.length % 2 !== 0 ? 'col-span-2' : ''}`}>
                    <img src={getImageUrl(img)} alt={product.name} className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700 ease-out cursor-crosshair min-h-[500px]" />
                  </div>
                ))}
                {(!product.images || product.images.length === 0) && (
                  <div className="col-span-2 aspect-[3/4] bg-neutral-50 flex items-center justify-center">
                    <Package className="w-24 h-24 text-neutral-300" />
                  </div>
                )}
              </div>

              {/* Mobile: Horizontal Snap Carousel */}
              <div className="lg:hidden -mx-4 sm:mx-0 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
                {product.images?.length > 0 ? (
                  product.images.map((img, idx) => (
                    <div key={idx} className="w-full flex-none snap-center relative aspect-[4/5] bg-neutral-50">
                      <img src={getImageUrl(img)} alt={product.name} className="absolute inset-0 w-full h-full object-cover object-top" />
                    </div>
                  ))
                ) : (
                  <div className="w-full flex-none snap-center relative aspect-[4/5] bg-neutral-50 flex items-center justify-center">
                    <Package className="w-24 h-24 text-neutral-300" />
                  </div>
                )}

                {/* Mobile Discount Badge Overlay */}
                {discount > 0 && (
                  <div className="absolute top-4 left-4 z-10 lg:hidden">
                    <Badge className="bg-green-600 hover:bg-green-600 text-white border-none rounded-sm px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                      {discount}% OFF
                    </Badge>
                  </div>
                )}
                {/* Mobile Wishlist Overlay */}
                <div className="absolute top-4 right-4 z-10 lg:hidden">
                  <button onClick={handleToggleWishlist} className="w-10 h-10 bg-white/90 backdrop-blur-sm shadow-sm rounded-full flex items-center justify-center text-neutral-900 border border-neutral-100">
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Scroll indicator text for mobile */}
              {product.images?.length > 1 && (
                <div className="lg:hidden text-center mt-3 text-[10px] text-neutral-400 font-medium uppercase tracking-widest">
                  Swipe for more images
                </div>
              )}
            </div>

            {/* Right Column: Sticky Details */}
            <div className="lg:col-span-5 xl:col-span-5 mt-8 lg:mt-0 relative">
              <div className="lg:sticky lg:top-32 flex flex-col">

                {/* Share & Wishlist (Desktop) */}
                <div className="hidden lg:flex justify-end mb-4">
                  <button onClick={handleToggleWishlist} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-black transition-colors group">
                    <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'group-hover:fill-black group-hover:text-black'}`} />
                    {isWishlisted ? 'Saved' : 'Save'}
                  </button>
                </div>

                {/* Header info */}
                <div className="mb-6 lg:mb-8">
                  {product.brand && (
                    <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-500 mb-3">{product.brand.name}</h2>
                  )}
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-normal text-neutral-900 leading-[1.1] tracking-tight">{product.name}</h1>
                </div>

                {/* Pricing */}
                <div className="flex items-end gap-3 mb-8">
                  <span className="text-2xl lg:text-3xl font-bold tracking-tight text-neutral-900">₹{displayPrice}</span>
                  {displayComparePrice && (
                    <>
                      <span className="text-lg lg:text-xl text-neutral-400 line-through font-light">₹{displayComparePrice}</span>
                      {/* Discount Badge */}
                      <div className="ml-2">
                        <Badge className="bg-green-600 hover:bg-green-600 text-white rounded-sm px-2.5 py-1 text-xs font-bold tracking-wider uppercase">
                          Save {discount}%
                        </Badge>
                      </div>
                    </>
                  )}
                </div>

                {/* Stock Status */}
                <div className="mb-8">
                  {isOutOfStock ? (
                    <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-red-600 bg-red-50 px-3 py-1.5 rounded-sm">
                      <AlertCircle className="w-4 h-4" />
                      Out of Stock
                    </div>
                  ) : displayStockQty <= 5 ? (
                    <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-amber-600 bg-amber-50 px-3 py-1.5 rounded-sm">
                      <Clock className="w-4 h-4" />
                      Only {displayStockQty} left
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-green-600 bg-green-50 px-3 py-1.5 rounded-sm">
                      <Check className="w-4 h-4" />
                      In Stock
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-neutral-200 mb-8" />

                {/* Variant Selectors */}
                {product.has_variants && attributeOptions.length > 0 && (
                  <div className="space-y-6 mb-8">
                    {attributeOptions.map(attr => (
                      <div key={attr.name}>
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-neutral-900">{attr.name}</label>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          {attr.values.map(value => (
                            <button
                              key={value}
                              onClick={() => setSelectedAttributes(prev => ({ ...prev, [attr.name]: value }))}
                              className={`px-6 py-3 border text-sm font-medium transition-all ${selectedAttributes[attr.name] === value
                                ? 'border-black bg-black text-white'
                                : 'border-neutral-200 text-neutral-900 hover:border-black'
                                }`}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="mb-10">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-neutral-900 mb-3 block">Quantity</label>
                  <div className="inline-flex items-center border border-neutral-200 h-12 w-32">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={isOutOfStock}
                      className="flex-1 h-full hover:bg-neutral-50 flex items-center justify-center transition-colors disabled:opacity-50 text-neutral-500"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-medium text-sm text-neutral-900">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(displayStockQty, quantity + 1))}
                      disabled={isOutOfStock || quantity >= displayStockQty}
                      className="flex-1 h-full hover:bg-neutral-50 flex items-center justify-center transition-colors disabled:opacity-50 text-neutral-500"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Actions (Desktop) */}
                <div className="hidden lg:flex flex-col gap-3 mb-10">
                  <Button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || adding || (product.has_variants && !selectedVariant)}
                    variant="outline"
                    className="w-full h-14 text-sm font-bold tracking-widest uppercase border-black text-black hover:bg-black hover:text-white rounded-none transition-colors"
                  >
                    {adding ? 'Adding...' : 'Add to Cart'}
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock || adding || (product.has_variants && !selectedVariant)}
                    className="w-full h-14 text-sm font-bold tracking-widest uppercase bg-black text-white hover:bg-neutral-800 rounded-none transition-colors"
                  >
                    Buy it Now
                  </Button>
                </div>

                {/* Services Information */}
                <div className="grid grid-cols-2 gap-4 py-6 border-y border-neutral-200 mb-10">
                  <div className="flex flex-col items-center justify-center text-center gap-2 p-4 bg-neutral-50">
                    <Package className="w-6 h-6 text-neutral-700 font-light" strokeWidth={1.5} />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-600">Secure<br />Delivery</span>
                  </div>
                  <div className="flex flex-col items-center justify-center text-center gap-2 p-4 bg-neutral-50">
                    <Star className="w-6 h-6 text-neutral-700 font-light" strokeWidth={1.5} />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-600">Premium<br />Quality Assured</span>
                  </div>
                </div>

                {/* Description Header */}
                {product.description && (
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b border-neutral-200 pb-3">Product Details</h3>
                    <div className="prose prose-sm text-neutral-600 max-w-none leading-relaxed font-light">
                      <p className="whitespace-pre-line">{product.description}</p>
                    </div>
                    {/* SKU */}
                    {(selectedVariant?.sku || product.sku) && (
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-4">
                        SKU: {selectedVariant?.sku || product.sku}
                      </p>
                    )}
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* Similar Products Section */}
          {similarProducts.length > 0 && (
            <div className="mt-20 lg:mt-32 pt-16 border-t border-neutral-200 mb-8">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-normal text-neutral-900 tracking-wide uppercase">You Might Also Like</h2>
                {product.category && (
                  <Link to={getLink('/products')} className="text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-black hidden sm:block border-b border-transparent hover:border-black pb-1 transition-all">
                    View More
                  </Link>
                )}
              </div>

              {/* Scrollable Row */}
              <div className="flex overflow-x-auto gap-4 lg:gap-8 pb-8 snap-x hide-scrollbar">
                {similarProducts.map((p) => (
                  <div key={p.id} className="min-w-[240px] lg:min-w-[280px] w-[65vw] lg:w-1/4 shrink-0 snap-start">
                    <D2CProductCard product={p} storeSlug={effectiveSlug || ''} />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Universal Footer - Unhidden on mobile */}
      <StoreFooter
        storeName={tenant.store_name}
        storeSlug={tenant.store_slug}
        address={tenant.address}
        phone={tenant.phone}
      />

      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 p-3 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex gap-2">
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock || adding || (product.has_variants && !selectedVariant)}
            variant="outline"
            className="flex-1 h-12 text-xs font-bold tracking-widest uppercase border-black text-black hover:bg-neutral-100 rounded-none transition-colors"
          >
            {adding ? 'Adding...' : 'Add to Cart'}
          </Button>
          <Button
            onClick={handleBuyNow}
            disabled={isOutOfStock || adding || (product.has_variants && !selectedVariant)}
            className="flex-1 h-12 text-xs font-bold tracking-widest uppercase bg-black text-white hover:bg-neutral-800 rounded-none transition-colors"
          >
            Buy it Now
          </Button>
        </div>
      </div>

      <style>{`
        .hide-scrollbar {
            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
            display: none; /* Chrome, Safari and Opera */
        }
        .pb-safe {
            padding-bottom: env(safe-area-inset-bottom, 1rem); /* Accommodate iOS home indicator */
        }
      `}</style>
    </div>
  );
}
