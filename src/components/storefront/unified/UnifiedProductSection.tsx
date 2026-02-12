import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { UnifiedProductCard } from './UnifiedProductCard';
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

interface UnifiedProductSectionProps {
  title: string;
  products: Product[];
  storeSlug: string;
  onAddToCart?: (productId: string, price: number, quantity: number) => void;
  addingProductId?: string | null;
  showViewAll?: boolean;
  accentColor?: string;
  variant?: 'scroll' | 'grid';
}

export function UnifiedProductSection({
  title,
  products,
  storeSlug,
  onAddToCart,
  addingProductId,
  showViewAll = true,
  accentColor = 'primary',
  variant = 'scroll'
}: UnifiedProductSectionProps) {
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

  const accentText = accentColor === 'green' ? 'text-green-600' : 'text-primary';

  // Mobile: Horizontal scroll layout
  // Desktop: Grid or scroll based on variant
  return (
    <section className="py-6">
      <div className="flex items-center justify-between px-4 lg:px-6 mb-4">
        <h2 className="text-lg lg:text-xl font-bold text-neutral-900">{title}</h2>
        {showViewAll && (
          <Link
            to={getLink('/products')}
            className={`flex items-center gap-1 ${accentText} text-sm font-semibold hover:underline`}
          >
            See all
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Mobile: Always horizontal scroll */}
      <div className="lg:hidden">
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {products.map((product) => (
            <div key={product.id} className="w-40 shrink-0">
              <UnifiedProductCard
                product={product}
                storeSlug={storeSlug}
                onAddToCart={onAddToCart}
                isAdding={addingProductId === product.id}
                accentColor={accentColor}
                variant="compact"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: Grid or scroll based on variant */}
      <div className="hidden lg:block relative group px-6">
        {variant === 'scroll' ? (
          <>
            {/* Left Arrow */}
            <button
              onClick={() => scroll('left')}
              className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Products Scroll */}
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            >
              {products.map((product) => (
                <div key={product.id} className="w-48 shrink-0">
                  <UnifiedProductCard
                    product={product}
                    storeSlug={storeSlug}
                    onAddToCart={onAddToCart}
                    isAdding={addingProductId === product.id}
                    accentColor={accentColor}
                    variant="standard"
                  />
                </div>
              ))}
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => scroll('right')}
              className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.slice(0, 10).map((product) => (
              <UnifiedProductCard
                key={product.id}
                product={product}
                storeSlug={storeSlug}
                onAddToCart={onAddToCart}
                isAdding={addingProductId === product.id}
                accentColor={accentColor}
                variant="standard"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
