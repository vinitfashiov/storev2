import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { GroceryProductCard } from './GroceryProductCard';
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

interface GroceryProductSectionProps {
  title: string;
  products: Product[];
  storeSlug: string;
  onAddToCart?: (productId: string, price: number, quantity: number) => void;
  addingProductId?: string | null;
  showViewAll?: boolean;
}

export function GroceryProductSection({
  title,
  products,
  storeSlug,
  onAddToCart,
  addingProductId,
  showViewAll = true
}: GroceryProductSectionProps) {
  const { isCustomDomain } = useCustomDomain();

  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${storeSlug}${cleanPath}`;
  };

  if (products.length === 0) return null;

  return (
    <section className="py-4">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-lg font-bold text-neutral-900">{title}</h2>
        {showViewAll && (
          <Link
            to={getLink('/products')}
            className="flex items-center gap-1 text-green-600 text-sm font-medium"
          >
            See all
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {products.map((product) => (
          <div key={product.id} className="w-36 shrink-0">
            <GroceryProductCard
              product={product}
              storeSlug={storeSlug}
              onAddToCart={onAddToCart}
              isAdding={addingProductId === product.id}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
