import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { D2CProductCard } from './D2CProductCard';

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

interface D2CProductSectionProps {
  title: string;
  subtitle?: string;
  products: Product[];
  storeSlug: string;
  onAddToCart: (productId: string, price: number, quantity: number) => void;
  addingProductId?: string | null;
  viewAllLink?: string;
  columns?: 2 | 3 | 4 | 5;
  variant?: 'default' | 'featured';
}

export function D2CProductSection({
  title,
  subtitle,
  products,
  storeSlug,
  onAddToCart,
  addingProductId,
  viewAllLink,
  columns = 4,
  variant = 'default'
}: D2CProductSectionProps) {
  if (products.length === 0) return null;

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 lg:grid-cols-5'
  };

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 lg:mb-14 flex flex-col items-center">
          <h2 className="text-2xl lg:text-3xl font-serif font-medium tracking-wide text-neutral-900 uppercase">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-3 text-neutral-600 text-sm lg:text-base max-w-2xl font-light">
              {subtitle}
            </p>
          )}
        </div>

        {/* Products Grid */}
        <div className={`grid ${gridCols[columns]} gap-4 lg:gap-8`}>
          {products.map((product) => (
            <D2CProductCard
              key={product.id}
              product={product}
              storeSlug={storeSlug}
              onAddToCart={onAddToCart}
              isAdding={addingProductId === product.id}
              variant={variant === 'featured' ? 'featured' : 'default'}
            />
          ))}
        </div>

        {/* View All */}
        {viewAllLink && (
          <div className="text-center mt-10 lg:mt-14">
            <Link
              to={viewAllLink}
              className="inline-flex items-center justify-center px-10 py-3.5 border border-neutral-300 text-xs font-bold tracking-[0.1em] text-neutral-900 uppercase hover:border-neutral-900 transition-colors"
            >
              VIEW ALL
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
