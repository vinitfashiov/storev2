import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { GroceryDesktopProductCard } from './GroceryDesktopProductCard';
import { useCustomDomain } from '@/contexts/CustomDomainContext';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  stock_qty: number;
}

interface GroceryDesktopProductSectionProps {
  title: string;
  products: Product[];
  storeSlug: string;
  onAddToCart?: (productId: string, price: number, quantity: number) => void;
  addingProductId?: string | null;
  showViewAll?: boolean;
}

export function GroceryDesktopProductSection({
  title,
  products,
  storeSlug,
  onAddToCart,
  addingProductId,
  showViewAll = true
}: GroceryDesktopProductSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isCustomDomain } = useCustomDomain();

  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${storeSlug}${cleanPath}`;
  };

  if (products.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="mx-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
        {showViewAll && (
          <Link
            to={getLink('/products')}
            className="text-green-600 text-sm font-semibold hover:underline"
          >
            see all
          </Link>
        )}
      </div>

      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-50"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Products Scroll */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        >
          {products.map((product) => (
            <div key={product.id} className="w-44 shrink-0">
              <GroceryDesktopProductCard
                product={product}
                storeSlug={storeSlug}
                onAddToCart={onAddToCart}
                isAdding={addingProductId === product.id}
              />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-50"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
