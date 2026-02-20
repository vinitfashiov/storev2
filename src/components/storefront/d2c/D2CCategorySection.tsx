import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useCustomDomain } from '@/contexts/CustomDomainContext';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_path?: string | null;
}

interface D2CCategorySectionProps {
  categories: Category[];
  storeSlug: string;
  variant?: 'grid' | 'scroll';
}

export function D2CCategorySection({
  categories,
  storeSlug,
  variant = 'grid'
}: D2CCategorySectionProps) {
  const { isCustomDomain } = useCustomDomain();

  if (categories.length === 0) return null;

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return supabase.storage.from('store-assets').getPublicUrl(path).data.publicUrl;
  };

  // Helper to generate correct links based on domain context
  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${storeSlug}${cleanPath}`;
  };

  // Placeholder category images (fallback)
  const placeholderImages = [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=800&fit=crop',
  ];

  return (
    <section className="py-8 lg:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-8 lg:mb-12">
          <h2 className="text-2xl lg:text-4xl font-bold tracking-tight text-neutral-900 uppercase">
            SHOP BY CATEGORY
          </h2>
        </div>

        <div className="flex gap-4 lg:gap-8 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap lg:justify-center">
          {categories.map((category, index) => {
            const imageUrl = getImageUrl(category.image_path) || placeholderImages[index % placeholderImages.length];

            return (
              <Link
                key={category.id}
                to={`${getLink('/products')}?category=${category.slug}`}
                className="group flex flex-col items-center flex-shrink-0 w-[80px] lg:w-[120px]"
              >
                <div className="w-[80px] h-[80px] lg:w-[120px] lg:h-[120px] rounded-full overflow-hidden border border-neutral-100 shadow-sm group-hover:shadow-md transition-all group-hover:scale-105 mb-3 bg-neutral-50 flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-center text-[11px] lg:text-sm tracking-wide font-medium text-neutral-800 line-clamp-2 w-full px-1">
                  {category.name.toUpperCase()}
                </h3>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  );
}
