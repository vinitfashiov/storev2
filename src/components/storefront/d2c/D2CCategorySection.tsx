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
    <section className="py-16 lg:py-24 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-10 lg:mb-14">
          <h2 className="text-2xl lg:text-3xl font-light tracking-wide text-neutral-900">
            SHOP BY CATEGORY
          </h2>
        </div>

        {variant === 'scroll' ? (
          <div className="flex gap-4 lg:gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
            {categories.slice(0, 6).map((category, index) => {
              const imageUrl = getImageUrl(category.image_path) || placeholderImages[index % placeholderImages.length];

              return (
                <Link
                  key={category.id}
                  to={`${getLink('/products')}?category=${category.slug}`}
                  className="group flex-shrink-0 w-40 lg:w-56"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-neutral-200">
                    <img
                      src={imageUrl}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-4 text-center text-sm tracking-wide font-medium text-neutral-900">
                    {category.name.toUpperCase()}
                  </h3>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {categories.slice(0, 4).map((category, index) => {
              const imageUrl = getImageUrl(category.image_path) || placeholderImages[index % placeholderImages.length];

              return (
                <Link
                  key={category.id}
                  to={`${getLink('/products')}?category=${category.slug}`}
                  className="group relative aspect-[3/4] overflow-hidden"
                >
                  <img
                    src={imageUrl}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                  <div className="absolute inset-0 flex items-end p-6">
                    <h3 className="text-white text-lg lg:text-xl font-light tracking-wide">
                      {category.name.toUpperCase()}
                    </h3>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  );
}
