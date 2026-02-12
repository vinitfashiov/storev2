import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StoreHeader } from '@/components/storefront/StoreHeader';
import { StoreFooter } from '@/components/storefront/StoreFooter';
import { GroceryBottomNav } from '@/components/storefront/grocery/GroceryBottomNav';
import { useCart } from '@/hooks/useCart';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import { useCustomDomain } from '@/contexts/CustomDomainContext';
import { toast } from 'sonner';
import {
  Package,
  ShoppingCart,
  Minus,
  Plus,
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

  // Helper helper to generate correct links based on domain context
  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${effectiveSlug}${cleanPath}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      // If on custom domain, we might already have the tenant
      let currentTenant = customDomainTenant as Tenant | null;

      if (!currentTenant) {
        if (!slug) return; // Can't fetch without slug if not context provided

        const { data: tenantData } = await supabase
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

      const { data: productData } = await supabase
        .from('products')
        .select('*, category:categories(name), brand:brands(name)')
        .eq('tenant_id', currentTenant.id)
        .eq('slug', productSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (productData) {
        setProduct(productData as Product);

        if (productData.has_variants) {
          const { data: variantsData } = await supabase
            .from('product_variants')
            .select('id, sku, price, compare_at_price, stock_qty, is_active')
            .eq('product_id', productData.id)
            .eq('is_active', true);

          if (variantsData && variantsData.length > 0) {
            const variantIds = variantsData.map(v => v.id);
            const { data: variantAttrsData } = await supabase
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
      const { data } = await supabase
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
      await supabase
        .from('wishlists')
        .delete()
        .eq('tenant_id', tenant.id)
        .eq('customer_id', customer.id)
        .eq('product_id', product.id);
      setIsWishlisted(false);
      toast.success('Removed from wishlist');
    } else {
      await supabase.from('wishlists').insert({
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

  const getImageUrl = (img: string) => {
    if (img.startsWith('http')) return img;
    return supabase.storage.from('product-images').getPublicUrl(img).data.publicUrl;
  };

  const displayPrice = selectedVariant?.price ?? product?.price ?? 0;
  const displayComparePrice = selectedVariant?.compare_at_price ?? product?.compare_at_price;
  const displayStockQty = selectedVariant?.stock_qty ?? product?.stock_qty ?? 0;

  const discount = displayComparePrice
    ? Math.round(((displayComparePrice - displayPrice) / displayComparePrice) * 100)
    : 0;

  const isOutOfStock = displayStockQty <= 0;
  const isGrocery = tenant?.business_type === 'grocery';

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="p-4"><Skeleton className="h-12 w-full" /></div>
        <Skeleton className="aspect-square w-full" />
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="py-12">
            <Package className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Product not found</h1>
            <p className="text-neutral-500 mb-4">This product doesn't exist or has been removed.</p>
            <Link to={getLink('/products')}>
              <Button>Browse Products</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Common Product Detail Layout - Works for both Grocery and E-commerce
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-neutral-100">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handleToggleWishlist} className="p-2">
              <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <button className="p-2">
              <Share2 className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block">
        <StoreHeader
          storeName={tenant.store_name}
          storeSlug={tenant.store_slug}
          businessType={tenant.business_type}
          cartCount={itemCount}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      <main className="flex-1">
        {/* Mobile Layout */}
        <div className="lg:hidden pb-32">
          {/* Product Image */}
          <div className="relative bg-neutral-50">
            <div className="aspect-square overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img
                  src={getImageUrl(product.images[selectedImage])}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-24 h-24 text-neutral-300" />
                </div>
              )}
            </div>

            {/* Discount Badge */}
            {discount > 0 && (
              <div className="absolute top-4 left-4">
                <Badge className={isGrocery ? "bg-green-600 text-white" : "bg-primary text-primary-foreground"}>{discount}% OFF</Badge>
              </div>
            )}

            {/* Image Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-white/80 rounded-full px-3 py-2">
                {product.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${selectedImage === idx ? (isGrocery ? 'bg-green-600 w-4' : 'bg-primary w-4') : 'bg-neutral-400'
                      }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-4 space-y-4">
            {/* Delivery Time Badge (Grocery only) */}
            {isGrocery && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-neutral-100 rounded-full px-3 py-1">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">10-15 mins</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-neutral-500">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>4.5 (1.2k)</span>
                </div>
              </div>
            )}

            {/* Product Name */}
            <div>
              <h1 className="text-xl font-bold text-neutral-900">{product.name}</h1>
              {product.brand && (
                <p className="text-sm text-neutral-500">{product.brand.name}</p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-neutral-900">₹{displayPrice}</span>
              {displayComparePrice && (
                <>
                  <span className="text-lg text-neutral-400 line-through">₹{displayComparePrice}</span>
                  <span className={`text-sm font-medium ${isGrocery ? 'text-green-600' : 'text-primary'}`}>{discount}% off</span>
                </>
              )}
            </div>

            {/* Variant Selectors */}
            {product.has_variants && attributeOptions.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-neutral-100">
                {attributeOptions.map(attr => (
                  <div key={attr.name}>
                    <label className="text-sm font-medium text-neutral-700 mb-2 block">{attr.name}</label>
                    <div className="flex gap-2 flex-wrap">
                      {attr.values.map(value => (
                        <button
                          key={value}
                          onClick={() => setSelectedAttributes(prev => ({ ...prev, [attr.name]: value }))}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${selectedAttributes[attr.name] === value
                            ? (isGrocery ? 'border-green-600 bg-green-50 text-green-700' : 'border-primary bg-primary/10 text-primary')
                            : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
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

            {/* Description */}
            {product.description && (
              <div className="pt-4 border-t border-neutral-100">
                <h3 className="font-medium text-neutral-900 mb-2">Description</h3>
                <p className="text-neutral-600 text-sm">{product.description}</p>
              </div>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2 text-sm">
              {isOutOfStock ? (
                <span className="text-red-600 font-medium">Out of Stock</span>
              ) : displayStockQty <= 5 ? (
                <span className="text-orange-600 font-medium">Only {displayStockQty} left!</span>
              ) : (
                <span className={`font-medium flex items-center gap-1 ${isGrocery ? 'text-green-600' : 'text-primary'}`}>
                  <Check className="w-4 h-4" /> In Stock
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Layout - 2 Column Grid */}
        <div className="hidden lg:block max-w-7xl mx-auto px-6 py-8">
          <Link
            to={getLink('/products')}
            className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 mb-6"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Products
          </Link>

          <div className="grid grid-cols-2 gap-12">
            {/* Left Column - Images */}
            <div className="space-y-4">
              <div className="aspect-square rounded-2xl bg-neutral-50 overflow-hidden relative">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={getImageUrl(product.images[selectedImage])}
                    alt={product.name}
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-32 h-32 text-neutral-300" />
                  </div>
                )}

                {/* Discount Badge */}
                {discount > 0 && (
                  <div className="absolute top-4 left-4">
                    <Badge className={`${isGrocery ? 'bg-green-600' : 'bg-primary'} text-white text-sm px-3 py-1`}>
                      {discount}% OFF
                    </Badge>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-3">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === idx
                        ? (isGrocery ? 'border-green-600' : 'border-primary')
                        : 'border-transparent hover:border-neutral-300'
                        }`}
                    >
                      <img src={getImageUrl(img)} alt="" className="w-full h-full object-contain bg-neutral-50 p-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              {/* Badges */}
              <div className="flex items-center gap-2">
                {product.brand && (
                  <Badge variant="outline" className="text-sm">{product.brand.name}</Badge>
                )}
                {product.category && (
                  <Badge variant="secondary" className="text-sm">{product.category.name}</Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-neutral-900">{product.name}</h1>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-neutral-900">₹{displayPrice}</span>
                {displayComparePrice && (
                  <>
                    <span className="text-xl text-neutral-400 line-through">₹{displayComparePrice}</span>
                    <Badge className={`${isGrocery ? 'bg-green-600' : 'bg-primary'} text-white`}>{discount}% OFF</Badge>
                  </>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                {isOutOfStock ? (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Out of Stock</span>
                  </div>
                ) : displayStockQty <= 5 ? (
                  <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Only {displayStockQty} left!</span>
                  </div>
                ) : (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isGrocery ? 'text-green-600 bg-green-50' : 'text-primary bg-primary/10'}`}>
                    <Check className="w-5 h-5" />
                    <span className="font-medium">In Stock</span>
                  </div>
                )}
              </div>

              {/* Variant Selectors */}
              {product.has_variants && attributeOptions.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-neutral-200">
                  {attributeOptions.map(attr => (
                    <div key={attr.name}>
                      <label className="text-sm font-medium text-neutral-700 mb-3 block">{attr.name}</label>
                      <div className="flex gap-2 flex-wrap">
                        {attr.values.map(value => (
                          <button
                            key={value}
                            onClick={() => setSelectedAttributes(prev => ({ ...prev, [attr.name]: value }))}
                            className={`px-5 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${selectedAttributes[attr.name] === value
                              ? (isGrocery ? 'border-green-600 bg-green-50 text-green-700' : 'border-primary bg-primary/10 text-primary')
                              : 'border-neutral-200 text-neutral-700 hover:border-neutral-400'
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

              {/* Quantity & Add to Cart */}
              <div className="flex items-center gap-4 pt-4">
                <div className="flex items-center border-2 border-neutral-200 rounded-xl">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock}
                    className="p-3 hover:bg-neutral-100 rounded-l-xl transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-14 text-center font-bold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(displayStockQty, quantity + 1))}
                    disabled={isOutOfStock || quantity >= displayStockQty}
                    className="p-3 hover:bg-neutral-100 rounded-r-xl transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <Button
                  size="lg"
                  className={`flex-1 h-14 text-lg font-bold rounded-xl ${isGrocery ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  disabled={isOutOfStock || adding || (product.has_variants && !selectedVariant)}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {adding ? 'Adding...' : 'Add to Cart'}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 w-14 rounded-xl"
                  onClick={handleToggleWishlist}
                >
                  <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              </div>

              {/* Description */}
              {product.description && (
                <div className="pt-6 border-t border-neutral-200">
                  <h3 className="font-bold text-lg text-neutral-900 mb-3">Description</h3>
                  <p className="text-neutral-600 leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* SKU */}
              {(selectedVariant?.sku || product.sku) && (
                <p className="text-sm text-neutral-500">SKU: {selectedVariant?.sku || product.sku}</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 p-4 safe-area-bottom">
        <div className="flex items-center gap-4">
          {/* Price Summary */}
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold">₹{displayPrice}</span>
              {displayComparePrice && (
                <span className="text-sm text-neutral-400 line-through">₹{displayComparePrice}</span>
              )}
            </div>
            <p className="text-xs text-neutral-500">Inclusive of all taxes</p>
          </div>

          {/* Add to Cart Button */}
          <Button
            size="lg"
            className={`px-8 font-bold ${isGrocery ? 'bg-green-600 hover:bg-green-700' : ''}`}
            disabled={isOutOfStock || adding || (product.has_variants && !selectedVariant)}
            onClick={handleAddToCart}
          >
            {adding ? 'Adding...' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>

      {/* Desktop Footer */}
      <div className="hidden lg:block">
        <StoreFooter
          storeName={tenant.store_name}
          storeSlug={tenant.store_slug}
          address={tenant.address}
          phone={tenant.phone}
        />
      </div>
    </div>
  );
}


