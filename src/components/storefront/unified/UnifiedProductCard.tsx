import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Package } from 'lucide-react';
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
  variant_stock?: number;
  variant_price?: number;
}

interface UnifiedProductCardProps {
  product: Product;
  storeSlug: string;
  onAddToCart?: (productId: string, price: number, quantity: number) => void;
  cartQuantity?: number;
  isAdding?: boolean;
  accentColor?: string;
  variant?: 'compact' | 'standard';
}

export function UnifiedProductCard({
  product,
  storeSlug,
  onAddToCart,
  cartQuantity = 0,
  isAdding = false,
  accentColor = 'primary',
  variant = 'compact'
}: UnifiedProductCardProps) {
  const [quantity, setQuantity] = useState(cartQuantity);

  const getImageUrl = (img: string) => {
    if (img.startsWith('http')) return img;
    return supabase.storage.from('product-images').getPublicUrl(img).data.publicUrl;
  };

  const { isCustomDomain } = useCustomDomain();

  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${storeSlug}${cleanPath}`;
  };

  const effectiveStock = product.variant_stock ?? product.stock_qty;
  const isOutOfStock = effectiveStock <= 0;
  const effectivePrice = product.variant_price ?? product.price;

  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - effectivePrice) / product.compare_at_price) * 100)
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isAdding) return;
    const newQty = quantity + 1;
    setQuantity(newQty);
    onAddToCart?.(product.id, effectivePrice, 1);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity <= 0) return;
    const newQty = quantity - 1;
    setQuantity(newQty);
    onAddToCart?.(product.id, effectivePrice, -1);
  };

  const accentBg = accentColor === 'green' ? 'bg-green-600' : 'bg-primary';
  const accentBgLight = accentColor === 'green' ? 'bg-green-50' : 'bg-primary/10';
  const accentBorder = accentColor === 'green' ? 'border-green-600' : 'border-primary';
  const accentText = accentColor === 'green' ? 'text-green-600' : 'text-primary';
  const accentTextDark = accentColor === 'green' ? 'text-green-700' : 'text-primary';

  return (
    <Link
      to={getLink(`/product/${product.slug}`)}
      className={cn(
        "block bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:shadow-lg transition-shadow",
        variant === 'compact' ? 'p-3' : 'p-4'
      )}
    >
      {/* Image */}
      <div className="relative bg-neutral-50 rounded-xl mb-3 overflow-hidden aspect-square flex items-center justify-center p-4 lg:p-6">
        {product.images && product.images[0] ? (
          <img
            src={getImageUrl(product.images[0])}
            alt={product.name}
            className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-neutral-300" />
          </div>
        )}

        {/* Discount Badge */}
        {discount > 0 && (
          <div className={`absolute top-2 left-2 ${accentBg} text-white text-[10px] font-bold px-2 py-1 rounded-lg`}>
            {discount}% OFF
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="text-xs font-bold text-neutral-500">Out of Stock</span>
          </div>
        )}
      </div>

      <h3 className={cn(
        "font-semibold text-neutral-900 leading-tight mb-2",
        variant === 'compact' ? 'text-[13px] line-clamp-2 min-h-[2.5rem]' : 'text-sm md:text-base line-clamp-2'
      )}>
        {product.name}
      </h3>

      {/* Price & Add Button */}
      <div className="flex items-end justify-between">
        <div>
          <span className={cn(
            "font-bold text-neutral-900 leading-none block",
            variant === 'compact' ? 'text-lg' : 'text-xl'
          )}>
            ₹{effectivePrice}
          </span>
          {product.compare_at_price && (
            <span className="text-xs text-neutral-500 line-through ml-1 leading-none mt-1 inline-block">
              ₹{product.compare_at_price}
            </span>
          )}
        </div>

        {/* Add Button / Quantity Controls */}
        {!isOutOfStock && (
          <div onClick={(e) => e.preventDefault()}>
            {(quantity === 0 || cartQuantity === 0) ? (
              <button
                onClick={handleAdd}
                disabled={isAdding}
                className={cn(
                  `px-4 py-2 rounded-lg border-2 font-bold text-sm transition-all`,
                  accentBorder, accentText, accentBgLight,
                  `hover:${accentBg} hover:text-white`
                )}
              >
                ADD
              </button>
            ) : (
              <div className={cn(
                "flex items-center rounded-lg overflow-hidden border-2",
                accentBorder, accentBgLight
              )}>
                <button
                  onClick={handleRemove}
                  className={`p-2 ${accentText} transition-colors`}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className={`text-sm font-bold ${accentTextDark} w-6 text-center`}>
                  {cartQuantity || quantity}
                </span>
                <button
                  onClick={handleAdd}
                  className={`p-2 ${accentText} transition-colors`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
