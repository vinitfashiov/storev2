import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from './ProductCard';
import { useRef } from 'react';
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

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  products: Product[];
  storeSlug: string;
  onAddToCart: (productId: string, price: number) => void;
  addingProductId?: string | null;
  showViewAll?: boolean;
  viewAllLink?: string;
  variant?: 'default' | 'carousel';
  bgColor?: string;
}

export function ProductSection({
  title,
  subtitle,
  products,
  storeSlug,
  onAddToCart,
  addingProductId,
  showViewAll = true,
  viewAllLink,
  variant = 'default',
  bgColor = 'bg-white'
}: ProductSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isCustomDomain } = useCustomDomain();

  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${storeSlug}${cleanPath}`;
  };

  const resolveLink = (link: string | undefined) => {
    if (!link) return getLink('/products');
    if (link.startsWith('http')) return link;
    return getLink(link);
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
    <section className={`py-12 md:py-16 ${bgColor}`}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-neutral-900 mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-neutral-500 max-w-xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Products */}
        {variant === 'carousel' ? (
          <div className="relative">
            <div
              ref={scrollRef}
              className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
            >
              {products.map((product) => (
                <div key={product.id} className="flex-shrink-0 w-64 md:w-72 snap-start">
                  <ProductCard
                    product={product}
                    storeSlug={storeSlug}
                    onAddToCart={onAddToCart}
                    isAdding={addingProductId === product.id}
                  />
                </div>
              ))}
            </div>

            {/* Carousel Controls */}
            {products.length > 4 && (
              <>
                <button
                  onClick={() => scroll('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-neutral-50 transition-colors hidden md:flex"
                >
                  <ChevronLeft className="w-5 h-5 text-neutral-700" />
                </button>
                <button
                  onClick={() => scroll('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-neutral-50 transition-colors hidden md:flex"
                >
                  <ChevronRight className="w-5 h-5 text-neutral-700" />
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                storeSlug={storeSlug}
                onAddToCart={onAddToCart}
                isAdding={addingProductId === product.id}
              />
            ))}
          </div>
        )}

        {/* View All Button */}
        {showViewAll && (
          <div className="text-center mt-10">
            <Link to={resolveLink(viewAllLink)}>
              <Button variant="outline" className="rounded-full px-8 border-neutral-300 hover:bg-neutral-100">
                View All Products
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
