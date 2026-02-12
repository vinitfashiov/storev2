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
    <Link
      to={getLink(`/product/${product.slug}`)}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className={cn(
        "relative overflow-hidden bg-neutral-100",
        variant === 'featured' ? 'aspect-[3/4]' : 'aspect-square',
        "rounded-none"
      )}>
        {/* Image */}
        {product.images && product.images[0] ? (
          <>
            <img
              src={getImageUrl(product.images[0])}
              alt={product.name}
              onLoad={() => setImageLoaded(true)}
              className={cn(
                "w-full h-full object-cover transition-all duration-700 ease-out",
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
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-neutral-300" />
          </div>
        )}

        {/* Overlay Actions */}
        <div className={cn(
          "absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"
        )}>
          {/* Wishlist Button */}
          {onToggleWishlist && (
            <button
              onClick={handleWishlist}
              className={cn(
                "absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                isWishlisted
                  ? "bg-white text-red-500"
                  : "bg-white/80 text-neutral-600 hover:bg-white hover:text-red-500",
                "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
              )}
            >
              <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
            </button>
          )}

          {/* Quick Add Button */}
          {!isOutOfStock && onAddToCart && (
            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              className={cn(
                "absolute bottom-4 left-4 right-4 py-3 bg-neutral-900 text-white text-sm font-medium tracking-wide",
                "opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0",
                "transition-all duration-300 hover:bg-neutral-800",
                "flex items-center justify-center gap-2"
              )}
            >
              <ShoppingBag className="w-4 h-4" />
              {isAdding ? 'ADDING...' : 'ADD TO BAG'}
            </button>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {discount > 0 && (
            <span className="bg-neutral-900 text-white text-xs font-medium tracking-wider px-3 py-1.5">
              -{discount}%
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-white text-neutral-900 text-xs font-medium tracking-wider px-3 py-1.5 border border-neutral-200">
              SOLD OUT
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="pt-4 space-y-1">
        {/* Brand */}
        {product.brand && (
          <p className="text-[11px] font-medium tracking-[0.2em] text-neutral-500 uppercase">
            {product.brand.name}
          </p>
        )}

        {/* Name */}
        <h3 className={cn(
          "font-normal text-neutral-900 group-hover:text-neutral-600 transition-colors",
          variant === 'minimal' ? 'text-sm' : 'text-base'
        )}>
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2 pt-1">
          <span className={cn(
            "font-medium text-neutral-900",
            variant === 'minimal' ? 'text-sm' : 'text-base'
          )}>
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.compare_at_price && (
            <span className="text-sm text-neutral-400 line-through">
              ₹{product.compare_at_price.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Rating Placeholder */}
        {variant === 'featured' && (
          <div className="flex items-center gap-1.5 pt-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-3 h-3 fill-neutral-900 text-neutral-900"
                />
              ))}
            </div>
            <span className="text-xs text-neutral-500">(128)</span>
          </div>
        )}
      </div>
    </Link>
  );
}
