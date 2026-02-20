import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Package, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useCustomDomain } from '@/contexts/CustomDomainContext';

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
  category?: { name: string } | null;
  brand?: { name: string } | null;
}

interface D2CProductCardProps {
  product: Product;
  storeSlug: string;
  onAddToCart?: (productId: string, price: number, quantity: number) => void;
  isAdding?: boolean;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  variant?: 'default' | 'featured' | 'minimal';
}

export function D2CProductCard({
  product,
  storeSlug,
  onAddToCart,
  isAdding = false,
  isWishlisted = false,
  onToggleWishlist,
  variant = 'default'
}: D2CProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { isCustomDomain } = useCustomDomain();

  const getImageUrl = (img: string) => {
    if (img.startsWith('http')) return img;
    return supabase.storage.from('product-images').getPublicUrl(img).data.publicUrl;
  };

  // Helper to generate correct links based on domain context
  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${storeSlug}${cleanPath}`;
  };

  const effectiveStock = product.has_variants
    ? (product.total_variant_stock ?? 0)
    : product.stock_qty;
  const isOutOfStock = effectiveStock <= 0;

  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isAdding) return;
    onAddToCart?.(product.id, product.price, 1);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleWishlist?.(product.id);
  };

  return (
    <div
      className="group block bg-white border border-neutral-100 rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={getLink(`/product/${product.slug}`)} className="flex-1 flex flex-col">
        {/* Image Container */}
        <div className={cn(
          "relative overflow-hidden bg-neutral-50 shrink-0",
          variant === 'featured' ? 'aspect-[3/4]' : 'aspect-[4/5]'
        )}>
          {/* Image */}
          {product.images && product.images[0] ? (
            <>
              <img
                src={getImageUrl(product.images[0])}
                alt={product.name}
                onLoad={() => setImageLoaded(true)}
                className={cn(
                  "w-full h-full object-cover transition-transform duration-700 ease-out",
                  isHovered ? "scale-105" : "scale-100",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
              />
              {/* Second image on hover if available */}
              {product.images[1] && (
                <img
                  src={getImageUrl(product.images[1])}
                  alt={product.name}
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
                    isHovered ? "opacity-100" : "opacity-0"
                  )}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-50">
              <Package className="w-12 h-12 text-neutral-300" />
            </div>
          )}

          {/* Overlay Actions */}
          <div className="absolute inset-x-0 top-0 p-3 flex justify-between items-start pointer-events-none">
            {/* Badges */}
            <div className="flex flex-col gap-1.5 pointer-events-auto">
              {discount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold tracking-wider px-2 py-1 rounded-sm shadow-sm">
                  {discount}% OFF
                </span>
              )}
              {isOutOfStock && (
                <span className="bg-neutral-900 text-white text-[10px] font-bold tracking-wider px-2 py-1 rounded-sm shadow-sm">
                  SOLD OUT
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            {onToggleWishlist && (
              <button
                onClick={handleWishlist}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm pointer-events-auto",
                  isWishlisted
                    ? "bg-white text-red-500"
                    : "bg-white/90 text-neutral-400 hover:bg-white hover:text-red-500 hover:scale-105",
                )}
              >
                <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
              </button>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 flex flex-col flex-1">
          {/* Brand */}
          {product.brand && (
            <p className="text-[10px] font-bold tracking-[0.1em] text-neutral-400 uppercase mb-1.5">
              {product.brand.name}
            </p>
          )}

          {/* Name */}
          <h3 className={cn(
            "font-medium text-neutral-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors mb-2 flex-1",
            variant === 'minimal' ? 'text-xs' : 'text-sm'
          )}>
            {product.name}
          </h3>

          {/* Rating Placeholder */}
          {variant === 'featured' && (
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0"
                  />
                ))}
              </div>
              <span className="text-[10px] text-neutral-500 font-medium">(4.8)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className={cn(
              "font-bold text-neutral-900",
              variant === 'minimal' ? 'text-sm' : 'text-lg'
            )}>
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.compare_at_price && (
              <span className="text-xs font-medium text-neutral-400 line-through">
                ₹{product.compare_at_price.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Quick Add Button underneath */}
          {!isOutOfStock && onAddToCart && (
            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              className={cn(
                "w-full py-2.5 rounded-xl border-2 text-[11px] font-bold tracking-[0.1em] transition-all duration-300 flex items-center justify-center gap-2 mt-auto",
                isAdding
                  ? "bg-neutral-100 border-neutral-100 text-neutral-500"
                  : "bg-white border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white"
              )}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {isAdding ? 'ADDING...' : 'ADD TO CART'}
            </button>
          )}

          {isOutOfStock && onAddToCart && (
            <button
              disabled
              className="w-full py-2.5 rounded-xl bg-neutral-100 border-2 border-neutral-100 text-neutral-400 text-[11px] font-bold tracking-[0.1em] cursor-not-allowed mt-auto"
            >
              OUT OF STOCK
            </button>
          )}
        </div>
      </Link>
    </div>
  );
}
