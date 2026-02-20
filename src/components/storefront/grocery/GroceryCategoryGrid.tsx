import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCustomDomain } from '@/contexts/CustomDomainContext';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_path?: string | null;
}

interface GroceryCategoryGridProps {
  categories: Category[];
  storeSlug: string;
  title?: string;
}

// Default category icons for variety
const categoryEmojis = ['🥬', '🥛', '🥣', '☕', '🥜', '🍪', '🍚', '🫙', '🧴', '🍫', '🧹', '🌿'];

export function GroceryCategoryGrid({ categories, storeSlug, title = "Top categories" }: GroceryCategoryGridProps) {
  const { isCustomDomain } = useCustomDomain();

  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${storeSlug}${cleanPath}`;
  };

  if (categories.length === 0) return null;

  const getImageUrl = (imagePath: string | null | undefined) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return supabase.storage.from('store-assets').getPublicUrl(imagePath).data.publicUrl;
  };

  return (
    <section className="px-4 py-6">
      <h2 className="text-lg font-bold text-neutral-900 mb-4">{title}</h2>
      <div className="grid grid-cols-4 gap-3">
        {categories.map((category, index) => {
          const imageUrl = getImageUrl(category.image_path);
          const emoji = categoryEmojis[index % categoryEmojis.length];

          return (
            <Link
              key={category.id}
              to={`${getLink('/products')}?category=${category.slug}`}
              className="flex flex-col items-center group"
            >
              <div className="w-full aspect-square rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden border border-neutral-200 group-hover:border-emerald-500 transition-colors mb-2">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">{emoji}</span>
                )}
              </div>
              <span className="text-xs text-center text-neutral-700 font-medium leading-tight line-clamp-2">
                {category.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
