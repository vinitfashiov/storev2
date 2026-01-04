import { Link } from 'react-router-dom';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

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

interface GroceryDesktopProductCardProps {
  product: Product;
  storeSlug: string;
  onAddToCart?: (productId: string, price: number, quantity: number) => void;
  cartQuantity?: number;
  isAdding?: boolean;
}

export function GroceryDesktopProductCard({ 
  product, 
  storeSlug, 
  onAddToCart,
  cartQuantity = 0,
  isAdding = false
}: GroceryDesktopProductCardProps) {
  const [quantity, setQuantity] = useState(cartQuantity);

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
    }
  };

  return (
    <Link
      to={`/store/${storeSlug}/product/${product.slug}`}
      className="bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col relative group hover:shadow-md transition-shadow"
    >
      {/* Delivery Time Badge */}
      <div className="absolute top-2 left-2 z-10">
        <span className="bg-neutral-100 text-neutral-600 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
          <span className="text-neutral-400">⚡</span>
          8 MINS
        </span>
      </div>

      {/* Discount Badge */}
      {discount > 0 && (
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            {discount}% OFF
          </span>
        </div>
      )}

      {/* Image */}
      <div className="aspect-square bg-white relative overflow-hidden p-3">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={product.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400">
            <span className="text-5xl">📦</span>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="text-sm font-medium text-neutral-500">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-3 flex-1 flex flex-col border-t border-neutral-100">
        <h3 className="text-sm font-medium text-neutral-900 line-clamp-2 mb-1 leading-tight">
          {product.name}
        </h3>
        <span className="text-xs text-neutral-500 mb-2">{product.unit || '1 unit'}</span>
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-neutral-900">₹{product.price}</span>
            {product.compare_at_price && (
              <span className="text-xs text-neutral-400 line-through">₹{product.compare_at_price}</span>
            )}
          </div>

          {/* Add Button */}
          {!isOutOfStock && (
            <div>
              {quantity === 0 ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAdd}
                  disabled={isAdding}
                  className="h-8 px-4 border-green-600 text-green-600 font-bold hover:bg-green-50 rounded"
                >
                  ADD
                </Button>
              ) : (
                <div className="flex items-center border border-green-600 rounded overflow-hidden">
                  <button
                    onClick={handleRemove}
                    className="p-1.5 text-green-600 hover:bg-green-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-green-600 font-bold text-sm w-6 text-center">{quantity}</span>
                  <button
                    onClick={handleAdd}
                    className="p-1.5 text-green-600 hover:bg-green-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
