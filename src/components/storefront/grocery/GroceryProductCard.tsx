import { Link } from 'react-router-dom';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
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
  unit?: string;
}

interface GroceryProductCardProps {
  product: Product;
  storeSlug: string;
  onAddToCart?: (productId: string, price: number, quantity: number) => void;
  cartQuantity?: number;
  isAdding?: boolean;
}

export function GroceryProductCard({
  product,
  storeSlug,
  onAddToCart,
  cartQuantity = 0,
  isAdding = false
}: GroceryProductCardProps) {
  const [quantity, setQuantity] = useState(cartQuantity);
  const { isCustomDomain } = useCustomDomain();

  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${storeSlug}${cleanPath}`;
  };

  const getImageUrl = (img: string) => {
    if (img.startsWith('http')) return img;
    return supabase.storage.from('product-images').getPublicUrl(img).data.publicUrl;
  };

  const imageUrl = product.images?.[0] ? getImageUrl(product.images[0]) : null;

  // Check stock - for products with variants, use total_variant_stock
  const effectiveStock = product.has_variants
    ? (product.total_variant_stock ?? 0)
    : product.stock_qty;
  const isOutOfStock = effectiveStock <= 0;
  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    const newQty = quantity + 1;
    setQuantity(newQty);
    onAddToCart?.(product.id, product.price, 1);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity > 0) {
      setQuantity(quantity - 1);
      // In a real app, you'd call a removeFromCart function here
    }
  };

  return (
    <Link
      to={getLink(`/product/${product.slug}`)}
      className="bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col relative group"
    >
      {/* Discount Badge */}
      {discount > 0 && (
        <div className="absolute top-2 left-2 z-10">
          <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            {discount}% OFF
          </span>
        </div>
      )}

      {/* Image */}
      <div className="aspect-square bg-neutral-50 relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400">
            <span className="text-4xl">📦</span>
          </div>
        )}

        {/* Add Button */}
        {!isOutOfStock && (
          <div className="absolute bottom-2 right-2">
            {quantity === 0 ? (
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={isAdding}
                className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg"
              >
                ADD
              </Button>
            ) : (
              <div className="flex items-center gap-1 bg-green-600 rounded-lg shadow-lg">
                <button
                  onClick={handleRemove}
                  className="p-1.5 text-white hover:bg-green-700 rounded-l-lg"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-white font-bold text-sm w-6 text-center">{quantity}</span>
                <button
                  onClick={handleAdd}
                  className="p-1.5 text-white hover:bg-green-700 rounded-r-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Out of Stock */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="text-sm font-medium text-neutral-500">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-sm font-medium text-neutral-900 line-clamp-2 mb-1">
          {product.name}
        </h3>
        {product.unit && (
          <span className="text-xs text-neutral-500 mb-2">{product.unit}</span>
        )}
        <div className="mt-auto flex items-baseline gap-2">
          <span className="font-bold text-neutral-900">₹{product.price}</span>
          {product.compare_at_price && (
            <span className="text-xs text-neutral-500 line-through">₹{product.compare_at_price}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
