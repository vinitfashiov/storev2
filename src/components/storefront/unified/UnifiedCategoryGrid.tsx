import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCustomDomain } from '@/contexts/CustomDomainContext';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_path?: string | null;
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

  const getImageUrl = (imagePath: string | null | undefined) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return supabase.storage.from('store-assets').getPublicUrl(imagePath).data.publicUrl;
  };

  const { isCustomDomain } = useCustomDomain();

  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${storeSlug}${cleanPath}`;
  };

  return (
    <section className="py-8">
      <h2 className="text-lg lg:text-xl font-bold text-neutral-900 px-4 lg:px-6 mb-6 text-center">
        Shop Categories
      </h2>

      {/* Mobile: Horizontal scroll */}
      <div className="lg:hidden">
        <div className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide justify-start">
          {categories.map((category, index) => {
            const imageUrl = getImageUrl(category.image_path);
            const iconData = categoryIcons[index % categoryIcons.length];

            return (
              <Link
                key={category.id}
                to={`${getLink('/products')}?category=${category.slug}`}
                className="flex flex-col items-center shrink-0 w-20"
              >
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border border-neutral-100 shadow-sm transition-transform active:scale-95",
                  !imageUrl && iconData.bg
                )}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">{iconData.emoji}</span>
                  )}
                </div>
                <span className="text-xs text-center text-neutral-800 font-medium mt-2 leading-tight line-clamp-2 w-full break-words">
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
            const imageUrl = getImageUrl(category.image_path);
            const iconData = categoryIcons[index % categoryIcons.length];

            return (
              <Link
                key={category.id}
                to={`${getLink('/products')}?category=${category.slug}`}
                className="flex flex-col items-center group w-24"
              >
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center overflow-hidden border border-neutral-100 shadow-sm group-hover:shadow-md transition-all group-hover:scale-105",
                  !imageUrl && iconData.bg
                )}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">{iconData.emoji}</span>
                  )}
                </div>
                <span className="text-sm text-center text-neutral-800 font-medium mt-3 max-w-[96px] leading-tight group-hover:text-primary transition-colors">
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
