import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabaseStore } from '@/integrations/supabase/storeClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
  ChevronLeft,
  Check,
  AlertCircle,
  Heart,
  Clock,
  Star,
  Share2,
  ShieldCheck,
  Users,
  MapPin,
  Truck,
  IndianRupee,
  Gift,
  Tag,
  ChevronRight
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
  product_delivery_fee_enabled?: boolean;
  product_delivery_fee?: number | null;
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
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Phase 5: Functional Coupons and Shiprocket Checker
  const [coupons, setCoupons] = useState<any[]>([]);
  const [hasShiprocket, setHasShiprocket] = useState(false);
  const [deliveryPincode, setDeliveryPincode] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [deliveryData, setDeliveryData] = useState<any>(null);
  const [deliveryError, setDeliveryError] = useState('');
  const [d2cDeliverySettings, setD2cDeliverySettings] = useState<any>(null);

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

      if (currentTenant) {
        // Fetch active coupons
        const { data: couponsData } = await supabaseStore
          .from('coupons')
          .select('code, type, value, min_cart_amount, max_discount_amount, starts_at, ends_at')
          .eq('tenant_id', currentTenant.id)
          .eq('is_active', true);

        if (couponsData) {
          const now = new Date();
          const validCoupons = couponsData.filter(c => {
            if (c.starts_at && new Date(c.starts_at) > now) return false;
            if (c.ends_at && new Date(c.ends_at) < now) return false;
            return true;
          });
          setCoupons(validCoupons);
        }

        // Fetch Shiprocket integration status
        const { data: integrations } = await supabaseStore
          .from('tenant_integrations_safe')
          .select('has_shiprocket_password')
          .eq('tenant_id', currentTenant.id)
          .maybeSingle();

        setHasShiprocket(!!integrations?.has_shiprocket_password);

        // Fetch D2C Delivery Settings
        if (currentTenant.business_type === 'ecommerce') {
          const { data: d2cSettings } = await supabaseStore
            .from('tenant_delivery_settings_d2c')
            .select('*')
            .eq('tenant_id', currentTenant.id)
            .maybeSingle();
          if (d2cSettings) setD2cDeliverySettings(d2cSettings);
        }
      }

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

  const handleCheckDelivery = async () => {
    if (!deliveryPincode || deliveryPincode.length !== 6) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }
    setDeliveryStatus('loading');
    setDeliveryError('');
    setDeliveryData(null);
    try {
      const { data, error } = await supabaseStore.functions.invoke('shiprocket-check-serviceability', {
        body: { delivery_postcode: deliveryPincode, cod: true }
      });

      if (error || !data.success) {
        setDeliveryStatus('error');
        setDeliveryError(data?.error || "Delivery not available for this pincode.");
      } else {
        setDeliveryStatus('success');
        setDeliveryData(data.data);
      }
    } catch (err) {
      setDeliveryStatus('error');
      setDeliveryError("Failed to check delivery.");
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
    const success = await addToCart(product.id, price, 1);
    if (success) {
      toast.success(`Added item to cart!`);
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
    const success = await addToCart(product.id, price, 1);
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

  // Premium D2C Layout matching the user reference images
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-black selection:text-white pb-24 lg:pb-0">
      <StoreHeader
        storeName={tenant.store_name}
        storeSlug={tenant.store_slug}
        businessType={tenant.business_type}
        cartCount={itemCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto sm:px-6 lg:px-8 sm:py-6 lg:py-10">

          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16 sm:mt-4 lg:mt-6">

            {/* Left Column: Images */}
            <div className="lg:col-span-7 xl:col-span-7 relative">

              {/* Desktop: Image Gallery */}
              <div className="hidden lg:flex gap-4">
                {/* Thumbnails */}
                {product.images && product.images.length > 1 && (
                  <div className="flex flex-col gap-3 w-20 shrink-0">
                    {product.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`aspect-[3/4] rounded bg-neutral-50 overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-black' : 'border-transparent hover:border-neutral-300'}`}
                      >
                        <img src={getImageUrl(img)} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover object-top" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Main Image */}
                <div className="flex-1 rounded-md overflow-hidden bg-neutral-50">
                  {product.images?.length > 0 ? (
                    <img
                      src={getImageUrl(product.images[selectedImage] || product.images[0])}
                      alt={product.name}
                      className="w-full h-auto min-h-[500px] object-cover object-top aspect-[4/5] lg:aspect-[3/4]"
                    />
                  ) : (
                    <div className="w-full aspect-[4/5] lg:aspect-[3/4] flex items-center justify-center">
                      <Package className="w-24 h-24 text-neutral-300" />
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile: Horizontal Snap Carousel */}
              <div className="lg:hidden flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
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

                {/* Mobile Wishlist Overlay */}
                <div className="absolute top-4 right-4 z-10 lg:hidden">
                  <button onClick={handleToggleWishlist} className="w-10 h-10 bg-white/90 shadow-sm rounded-full flex items-center justify-center text-neutral-900 border border-neutral-100">
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Scroll indicator text for mobile */}
              {product.images?.length > 1 && (
                <div className="lg:hidden flex justify-center mt-3 gap-1">
                  {product.images.map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === selectedImage ? 'bg-black' : 'bg-neutral-300'}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Sticky Details */}
            <div className="lg:col-span-5 xl:col-span-5 relative mt-6 lg:mt-0 px-4 sm:px-0">
              <div className="lg:sticky lg:top-32 flex flex-col">

                {/* Share & Wishlist (Desktop) */}
                <div className="hidden lg:flex justify-end mb-4 gap-4">
                  <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-black transition-colors group">
                    <Share2 className="w-4 h-4 transition-colors group-hover:text-black" />
                  </button>
                  <button onClick={handleToggleWishlist} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-black transition-colors group">
                    <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'group-hover:fill-black group-hover:text-black'}`} />
                  </button>
                </div>

                {/* Header info */}
                <div className="mb-4">
                  {product.brand && (
                    <h2 className="text-[11px] font-bold uppercase text-neutral-500 mb-2 tracking-wide">{product.brand.name}</h2>
                  )}
                  <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 leading-[1.2]">{product.name}</h1>
                </div>

                {/* Pricing */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-bold text-neutral-900">₹{displayPrice}</span>
                  {displayComparePrice && (
                    <>
                      <span className="text-lg text-neutral-400 line-through">₹{displayComparePrice}</span>
                      {/* Yellow Discount Highlight */}
                      <div className="ml-1 px-2 py-0.5 bg-[#fce000] text-black text-[11px] font-bold tracking-wider uppercase">
                        {discount}% OFF
                      </div>
                    </>
                  )}
                </div>

                {/* Cashback Text */}
                <div className="flex items-center gap-1.5 mb-6 text-sm text-green-600 font-medium">
                  <span className="flex items-center justify-center w-4 h-4 rounded-full border border-green-600">
                    <IndianRupee className="w-[10px] h-[10px]" strokeWidth={3} />
                  </span>
                  Earn 10% CASHBACK
                </div>

                {/* Offers Box - Functional Carousel */}
                {coupons.length > 0 && (
                  <div className="mb-6 rounded-lg border border-dashed border-neutral-400 bg-white p-4 relative mx-px mt-4 overflow-hidden">
                    <div className="absolute -top-3 left-4 bg-white p-1 rounded-full border border-dashed border-neutral-400 text-neutral-600 z-10">
                      <div className="bg-neutral-200 rounded-full p-1">
                        <Tag className="w-3 h-3 text-neutral-600" />
                      </div>
                    </div>

                    <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar -mx-4 px-4 pb-2">
                      {coupons.map((coupon, idx) => (
                        <div key={idx} className="flex-none w-full snap-start pr-4 border-r border-neutral-100 mr-4 last:border-0 last:mr-0 last:pr-0">
                          <div className="mt-2 text-sm">
                            <p className="font-bold text-[#14833D]">
                              {coupon.type === 'percent' ? `Get Flat ${coupon.value}% OFF` : `Get ₹${coupon.value} OFF`}
                            </p>
                            <p className="text-neutral-600 mt-1">
                              {coupon.min_cart_amount > 0 ? `Add items worth ₹${coupon.min_cart_amount}+ to unlock this offer.` : 'Valid on this order!'}
                              {coupon.max_discount_amount ? ` Max discount ₹${coupon.max_discount_amount}.` : ''}
                            </p>
                            <div className="flex justify-between items-center mt-4 border-t border-neutral-100 pt-3">
                              <span className="text-neutral-700 font-medium cursor-pointer hover:text-black hover:underline" onClick={() => { navigator.clipboard.writeText(coupon.code); toast.success('Coupon code copied to clipboard!'); }}>Tap to copy coupon</span>
                              <span className="font-medium text-neutral-900 border border-neutral-200 px-2 py-1 rounded bg-neutral-50">{coupon.code}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prepaid Banner */}
                <div className="mb-8 flex items-center justify-between bg-[#f4f6ff] p-3 rounded-md text-xs sm:text-sm text-neutral-700">
                  <span className="font-medium">Additional Prepaid Discount At Checkout</span>
                  <div className="flex gap-1.5 items-center">
                    <span className="bg-[#5c2d91] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Pe</span>
                    <span className="bg-white border text-[#1a1f71] text-[9px] font-bold px-1.5 py-0.5 rounded italic">VISA</span>
                    <span className="bg-sky-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Pay</span>
                  </div>
                </div>

                {/* Variant Selectors */}
                {product.has_variants && attributeOptions.length > 0 && (
                  <div className="space-y-6 mb-8">
                    {attributeOptions.map(attr => (
                      <div key={attr.name}>
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-base font-bold text-neutral-900">
                            {attr.name} <span className="text-neutral-500 font-normal">({selectedAttributes[attr.name]})</span>
                          </label>
                          {attr.name.toLowerCase() === 'size' && (
                            <span className="text-sm font-medium text-neutral-600 cursor-pointer hover:underline flex items-center">
                              Size Guide <ChevronRight className="w-4 h-4 ml-0.5" />
                            </span>
                          )}
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          {attr.values.map(value => (
                            <button
                              key={value}
                              onClick={() => setSelectedAttributes(prev => ({ ...prev, [attr.name]: value }))}
                              className={`px-4 py-2 min-w-[3rem] min-h-[3rem] border rounded-md text-sm font-medium transition-all flex items-center justify-center ${selectedAttributes[attr.name] === value
                                ? 'border-black text-black ring-1 ring-black ring-offset-1 bg-white'
                                : 'border-neutral-300 text-neutral-700 hover:border-black bg-white'
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

                {/* Dynamic Shipping Fee Display */}
                {(() => {
                  if (product.product_delivery_fee_enabled && product.product_delivery_fee != null) {
                    return (
                      <div className="mb-6 flex items-center gap-3 text-sm text-neutral-900 font-medium">
                        <Truck className="w-5 h-5 text-neutral-500" strokeWidth={1.5} />
                        Shipping Charge: <span className="text-green-600">₹{product.product_delivery_fee}</span>
                      </div>
                    );
                  }
                  if (d2cDeliverySettings?.fixed_delivery_fee_enabled) {
                    return (
                      <div className="mb-6 flex items-center gap-3 text-sm text-neutral-900 font-medium">
                        <Truck className="w-5 h-5 text-neutral-500" strokeWidth={1.5} />
                        Shipping Charge: <span className="text-green-600">₹{d2cDeliverySettings.fixed_delivery_fee}</span>
                      </div>
                    );
                  }
                  if (d2cDeliverySettings?.free_delivery_enabled) {
                    return (
                      <div className="mb-6 flex items-center gap-3 text-sm text-green-600 font-medium">
                        <Truck className="w-5 h-5 text-green-600" strokeWidth={1.5} />
                        Free Shipping
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Check Delivery Date - Functional */}
                {hasShiprocket && (
                  <div className="mb-8">
                    <h3 className="font-bold text-base mb-3">Check Delivery Date</h3>
                    <div className="flex h-12 w-full max-w-sm rounded overflow-hidden border border-neutral-300 focus-within:ring-1 focus-within:ring-black">
                      <Input
                        placeholder="Enter Pincode"
                        value={deliveryPincode}
                        onChange={(e) => setDeliveryPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="rounded-none border-none h-full focus-visible:ring-0 px-4 text-base shadow-none"
                      />
                      <Button
                        onClick={handleCheckDelivery}
                        disabled={deliveryStatus === 'loading' || deliveryPincode.length !== 6}
                        className="h-full rounded-none px-6 bg-[#222222] hover:bg-black text-white uppercase font-bold tracking-wider disabled:bg-neutral-400"
                      >
                        {deliveryStatus === 'loading' ? '...' : 'Check'}
                      </Button>
                    </div>

                    {deliveryStatus === 'error' && (
                      <div className="mt-3 text-sm text-red-500 font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {deliveryError}
                      </div>
                    )}

                    {deliveryStatus === 'success' && deliveryData?.available_courier_companies?.length > 0 && (
                      <div className="mt-4 p-3 bg-green-50 rounded border border-green-100">
                        <p className="text-sm text-green-800 font-medium">
                          Delivery available to {deliveryPincode}.
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          Expected delivery by: <span className="font-bold">{deliveryData.available_courier_companies[0]?.etd?.split(' ')[0] || "3-5 days"}</span>
                        </p>
                      </div>
                    )}

                    <div className="mt-5 space-y-3">
                      <div className="flex items-center gap-3 text-sm text-neutral-700 font-medium">
                        <div className="border border-neutral-500 rounded p-[2px] flex items-center font-bold text-[10px] uppercase">
                          COD
                        </div>
                        {deliveryStatus === 'success' && deliveryData?.available_courier_companies?.length > 0
                          ? (deliveryData.available_courier_companies.some((c: any) => c.cod === 1) ? 'Cash On Delivery Available' : 'Cash On Delivery Not Available for this Pincode')
                          : 'Cash On Delivery Available'
                        }
                      </div>
                    </div>
                  </div>
                )}


                {/* Actions (Desktop) */}
                <div className="hidden lg:flex gap-1.5 mb-10 w-full xl:max-w-md">
                  <Button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || adding || (product.has_variants && !selectedVariant)}
                    className="flex-1 h-14 text-sm font-bold uppercase tracking-wider bg-[#222222] text-white hover:bg-black rounded-[0.25rem] transition-colors shadow-none"
                  >
                    {adding ? 'Adding...' : 'Add to Cart'}
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock || adding || (product.has_variants && !selectedVariant)}
                    className="flex-1 h-14 text-sm font-bold uppercase tracking-wider bg-[#fce000] text-black hover:bg-[#ebd000] rounded-[0.25rem] transition-colors shadow-none"
                  >
                    Buy Now
                  </Button>
                </div>

                {/* Accordion For Description & Policies */}
                <div className="mb-10 text-neutral-800">
                  <Accordion type="single" collapsible className="w-full" defaultValue="overview">
                    <AccordionItem value="overview">
                      <AccordionTrigger className="text-sm font-bold hover:no-underline py-4">
                        Product overview and details
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line pb-4">
                        {product.description || "No specific details provided for this product."}
                        {(selectedVariant?.sku || product.sku) && (
                          <span className="block mt-4 text-xs font-bold text-neutral-400 uppercase">SKU: {selectedVariant?.sku || product.sku}</span>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="returns">
                      <AccordionTrigger className="text-sm font-bold hover:no-underline py-4">
                        Returns, Exchange, & Refund Policy
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-neutral-500 pb-4">
                        7 days easy returns and exchange
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="marketed">
                      <AccordionTrigger className="text-sm font-bold hover:no-underline py-4 border-b-0">
                        Marketed By
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-neutral-500 pb-4">
                        Company and distributor information
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-2 py-8 border-y border-neutral-100 mb-10 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center relative">
                      <ShieldCheck className="w-8 h-8 text-neutral-700 absolute z-10" strokeWidth={1.5} />
                      <div className="absolute inset-0 border-2 border-neutral-700/20 rotate-12 rounded-full border-dashed"></div>
                      <div className="absolute inset-0 border-2 border-neutral-700/20 -rotate-12 rounded-full"></div>
                    </div>
                    <span className="text-[12px] font-bold text-neutral-800 leading-tight">Genuine<br />Product</span>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center relative">
                      <Users className="w-8 h-8 text-neutral-700 z-10" strokeWidth={1.5} />
                      <div className="absolute inset-0 border-[1.5px] border-neutral-700/20 rounded-full border-dashed"></div>
                      <div className="absolute inset-3 border-[1.5px] border-neutral-700/20 rounded-full"></div>
                    </div>
                    <span className="text-[12px] font-bold text-neutral-800 leading-tight">3M+ Happy<br />Customers</span>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center relative">
                      <MapPin className="w-8 h-8 text-neutral-700 z-10" strokeWidth={1.5} />
                      <div className="absolute inset-0 border-[1.5px] border-neutral-700/20 rounded-full"></div>
                      <div className="absolute bottom-2 left-3 w-8 h-[2px] bg-neutral-700/20"></div>
                    </div>
                    <span className="text-[12px] font-bold text-neutral-800 leading-tight">Made in<br />India</span>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Similar Products Section */}
          {similarProducts.length > 0 && (
            <div className="mt-16 lg:mt-24 pt-8 mb-8 border-t-8 border-neutral-50/50 px-4 sm:px-0">
              <div className="mb-6 lg:mb-8">
                <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Similar Products</h2>
              </div>

              {/* Scrollable Row */}
              <div className="flex flex-wrap lg:flex-nowrap overflow-x-auto gap-4 lg:gap-6 pb-8 snap-x hide-scrollbar">
                {similarProducts.map((p) => (
                  <div key={p.id} className="min-w-[160px] lg:min-w-[240px] w-[calc(50%-8px)] lg:w-1/4 shrink-0 snap-start">
                    <D2CProductCard product={p} storeSlug={effectiveSlug || ''} />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <StoreFooter
        storeName={tenant.store_name}
        storeSlug={tenant.store_slug}
        address={tenant.address}
        phone={tenant.phone}
      />

      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-100 py-2.5 px-2.5 pb-[max(env(safe-area-inset-bottom),0.75rem)] shadow-[0_-4px_15px_rgba(0,0,0,0.03)]">
        <div className="flex gap-2 w-full">
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock || adding || (product.has_variants && !selectedVariant)}
            className="flex-1 h-[52px] text-[13px] font-extrabold uppercase tracking-widest bg-[#202020] text-white hover:bg-black rounded-[5px] transition-colors shadow-none"
          >
            {adding ? 'Adding...' : 'Add to Cart'}
          </Button>
          <Button
            onClick={handleBuyNow}
            disabled={isOutOfStock || adding || (product.has_variants && !selectedVariant)}
            className="flex-1 h-[52px] text-[13px] font-extrabold uppercase tracking-widest bg-[#ffdd00] text-black hover:bg-[#eacb00] rounded-[5px] transition-colors shadow-none"
          >
            Buy Now
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
