import { Link } from 'react-router-dom';
import { ShoppingCart, Package, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface ProductCardProps {
  product: Product;
  storeSlug: string;
  onAddToCart: (productId: string, price: number) => void;
  isAdding?: boolean;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
}

export function ProductCard({
  product,
  storeSlug,
  onAddToCart,
  isAdding,
  isWishlisted,
  onToggleWishlist
}: ProductCardProps) {
  const { isCustomDomain } = useCustomDomain();

  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${storeSlug}${cleanPath}`;
  };

  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  // For products with variants, check total_variant_stock; otherwise check stock_qty
  const effectiveStock = product.has_variants
    ? (product.total_variant_stock ?? 0)
    : product.stock_qty;
  const isOutOfStock = effectiveStock <= 0;

  const getImageUrl = (images: string[] | null) => {
    if (!images || images.length === 0) return null;
    const img = images[0];
    if (img.startsWith('http')) return img;
    return supabase.storage.from('product-images').getPublicUrl(img).data.publicUrl;
  };

  const imageUrl = getImageUrl(product.images);

  return (
    <div className="group bg-white rounded-xl overflow-hidden border border-neutral-100 hover:shadow-lg transition-all duration-300">
      <Link to={getLink(`/product/${product.slug}`)}>
        <div className="aspect-square bg-neutral-50 relative overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-neutral-300" />
            </div>
          )}

          {/* Discount Badge */}
          {discount > 0 && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
              -{discount}%
            </span>
          )}

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <span className="bg-neutral-900 text-white text-sm font-medium px-4 py-2 rounded">
                Out of Stock
              </span>
            </div>
          )}

          {/* Wishlist Button */}
          {onToggleWishlist && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleWishlist(product.id);
              }}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform"
            >
              <Heart
                className={cn(
                  "w-4 h-4 transition-colors",
                  isWishlisted ? "fill-red-500 text-red-500" : "text-neutral-400"
                )}
              />
            </button>
          )}

          {/* Quick Add Button - Shows on Hover */}
          {!isOutOfStock && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                className="w-full bg-white text-neutral-900 hover:bg-neutral-100"
                disabled={isAdding}
                onClick={(e) => {
                  e.preventDefault();
                  onAddToCart(product.id, product.price);
                }}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {isAdding ? 'Adding...' : 'Add to Cart'}
              </Button>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        {/* Brand */}
        {product.brand && (
          <p className="text-xs text-amber-700 font-medium mb-1 uppercase tracking-wide">
            {product.brand.name}
          </p>
        )}

        {/* Product Name */}
        <Link to={getLink(`/product/${product.slug}`)}>
          <h3 className="font-medium text-neutral-800 line-clamp-2 hover:text-amber-700 transition-colors text-sm md:text-base">
            {product.name}
          </h3>
        </Link>

        {/* Rating - Placeholder */}
        <div className="flex items-center gap-1 my-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className="w-3 h-3 fill-amber-400 text-amber-400"
            />
          ))}
          <span className="text-xs text-neutral-500 ml-1">4.5</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-neutral-900">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.compare_at_price && (
            <span className="text-sm text-neutral-400 line-through">
              ₹{product.compare_at_price.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
