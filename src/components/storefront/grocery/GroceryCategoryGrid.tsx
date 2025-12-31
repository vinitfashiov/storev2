import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
}

interface GroceryCategoryGridProps {
  categories: Category[];
  storeSlug: string;
  title?: string;
}

// Default category icons for variety
const categoryEmojis = ['🥬', '🥛', '🥣', '☕', '🥜', '🍪', '🍚', '🫙', '🧴', '🍫', '🧹', '🌿'];

export function GroceryCategoryGrid({ categories, storeSlug, title = "Top categories" }: GroceryCategoryGridProps) {
  if (categories.length === 0) return null;

  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return supabase.storage.from('store-assets').getPublicUrl(imageUrl).data.publicUrl;
  };

  return (
    <section className="px-4 py-4">
      <h2 className="text-lg font-bold text-neutral-900 mb-4">{title}</h2>
      <div className="grid grid-cols-4 gap-3">
        {categories.map((category, index) => {
          const imageUrl = getImageUrl(category.image_url);
          const emoji = categoryEmojis[index % categoryEmojis.length];
          
          return (
            <Link
              key={category.id}
              to={`/store/${storeSlug}/products?category=${category.slug}`}
              className="flex flex-col items-center group"
            >
              <div className="w-full aspect-square rounded-xl bg-neutral-100 flex items-center justify-center overflow-hidden group-hover:bg-neutral-200 transition-colors mb-2">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={category.name}
                    className="w-3/4 h-3/4 object-contain"
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
