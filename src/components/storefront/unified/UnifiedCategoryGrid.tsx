import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
}

interface UnifiedCategoryGridProps {
  categories: Category[];
  storeSlug: string;
  accentColor?: string;
}

// Category emoji icons for variety
const categoryIcons = [
  { emoji: '👕', bg: 'bg-blue-50' },
  { emoji: '👗', bg: 'bg-pink-50' },
  { emoji: '👟', bg: 'bg-orange-50' },
  { emoji: '👜', bg: 'bg-purple-50' },
  { emoji: '💍', bg: 'bg-amber-50' },
  { emoji: '🧢', bg: 'bg-green-50' },
  { emoji: '👔', bg: 'bg-slate-50' },
  { emoji: '🎒', bg: 'bg-red-50' },
  { emoji: '⌚', bg: 'bg-cyan-50' },
  { emoji: '🕶️', bg: 'bg-yellow-50' },
  { emoji: '👠', bg: 'bg-rose-50' },
  { emoji: '🧥', bg: 'bg-indigo-50' },
];

export function UnifiedCategoryGrid({ categories, storeSlug, accentColor = 'primary' }: UnifiedCategoryGridProps) {
  if (categories.length === 0) return null;

  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return supabase.storage.from('store-assets').getPublicUrl(imageUrl).data.publicUrl;
  };

  return (
    <section className="py-6">
      <h2 className="text-lg lg:text-xl font-bold text-neutral-900 px-4 lg:px-6 mb-4">
        Shop by Category
      </h2>
      
      {/* Mobile: Horizontal scroll */}
      <div className="lg:hidden">
        <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {categories.map((category, index) => {
            const imageUrl = getImageUrl(category.image_url);
            const iconData = categoryIcons[index % categoryIcons.length];

            return (
              <Link
                key={category.id}
                to={`/store/${storeSlug}/products?category=${category.slug}`}
                className="flex flex-col items-center shrink-0"
              >
                <div className={`w-16 h-16 rounded-2xl ${iconData.bg} flex items-center justify-center overflow-hidden`}>
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={category.name}
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <span className="text-2xl">{iconData.emoji}</span>
                  )}
                </div>
                <span className="text-xs text-center text-neutral-700 font-medium mt-2 max-w-[64px] line-clamp-2">
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop: Grid layout */}
      <div className="hidden lg:block px-6">
        <div className="flex flex-wrap justify-center gap-8">
          {categories.slice(0, 12).map((category, index) => {
            const imageUrl = getImageUrl(category.image_url);
            const iconData = categoryIcons[index % categoryIcons.length];

            return (
              <Link
                key={category.id}
                to={`/store/${storeSlug}/products?category=${category.slug}`}
                className="flex flex-col items-center group"
              >
                <div className={`w-24 h-24 rounded-full ${iconData.bg} flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform`}>
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={category.name}
                      className="w-16 h-16 object-contain"
                    />
                  ) : (
                    <span className="text-4xl">{iconData.emoji}</span>
                  )}
                </div>
                <span className="text-sm text-center text-neutral-700 font-medium mt-2 max-w-[96px]">
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
