import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCustomDomain } from '@/contexts/CustomDomainContext';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_path?: string | null;
}

interface GroceryDesktopCategoryGridProps {
  categories: Category[];
  storeSlug: string;
}

// Category icons for variety - matching Blinkit style
const categoryIcons = [
  { emoji: '🥛', bg: 'bg-amber-50' },
  { emoji: '🍞', bg: 'bg-orange-50' },
  { emoji: '🍎', bg: 'bg-red-50' },
  { emoji: '🥤', bg: 'bg-cyan-50' },
  { emoji: '🍪', bg: 'bg-yellow-50' },
  { emoji: '🥣', bg: 'bg-amber-50' },
  { emoji: '🍰', bg: 'bg-pink-50' },
  { emoji: '🍵', bg: 'bg-green-50' },
  { emoji: '🍚', bg: 'bg-slate-50' },
  { emoji: '🧴', bg: 'bg-blue-50' },
  { emoji: '🧹', bg: 'bg-purple-50' },
  { emoji: '🌿', bg: 'bg-emerald-50' },
  { emoji: '🧼', bg: 'bg-sky-50' },
  { emoji: '🍫', bg: 'bg-amber-100' },
  { emoji: '🥜', bg: 'bg-orange-100' },
  { emoji: '🍶', bg: 'bg-rose-50' }
];

export function GroceryDesktopCategoryGrid({ categories, storeSlug }: GroceryDesktopCategoryGridProps) {
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

  // Split into 2 rows for Blinkit style
  const firstRow = categories.slice(0, 8);
  const secondRow = categories.slice(8, 16);

  const renderCategory = (category: Category, index: number) => {
    const imageUrl = getImageUrl(category.image_path);
    const iconData = categoryIcons[index % categoryIcons.length];

    return (
      <Link
        key={category.id}
        to={`${getLink('/products')}?category=${category.slug}`}
        className="flex flex-col items-center group"
      >
        <div className={`w-20 h-20 rounded-full ${iconData.bg} flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform mb-2`}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={category.name}
              className="w-14 h-14 object-contain"
            />
          ) : (
            <span className="text-4xl">{iconData.emoji}</span>
          )}
        </div>
        <span className="text-xs text-center text-neutral-700 font-medium leading-tight max-w-[80px]">
          {category.name}
        </span>
      </Link>
    );
  };

  return (
    <div className="mx-6 py-6">
      <div className="flex justify-center gap-8 mb-6">
        {firstRow.map((cat, idx) => renderCategory(cat, idx))}
      </div>
      {secondRow.length > 0 && (
        <div className="flex justify-center gap-8">
          {secondRow.map((cat, idx) => renderCategory(cat, idx + 8))}
        </div>
      )}
    </div>
  );
}
