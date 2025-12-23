import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
}

interface CategorySectionProps {
  categories: Category[];
  storeSlug: string;
  title?: string;
}

export function CategorySection({ categories, storeSlug, title = "Shop by Category" }: CategorySectionProps) {
  if (categories.length === 0) return null;

  // Category icons/colors for visual variety
  const categoryStyles = [
    { bg: 'bg-rose-50', icon: '💍' },
    { bg: 'bg-amber-50', icon: '📿' },
    { bg: 'bg-emerald-50', icon: '💎' },
    { bg: 'bg-sky-50', icon: '⭐' },
    { bg: 'bg-purple-50', icon: '👑' },
    { bg: 'bg-orange-50', icon: '✨' },
    { bg: 'bg-teal-50', icon: '🌸' },
    { bg: 'bg-pink-50', icon: '💫' },
  ];

  return (
    <section className="py-10 md:py-14 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="font-serif text-2xl md:text-3xl font-semibold text-center text-neutral-900 mb-10">
          {title}
        </h2>
        
        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          {categories.map((category, index) => {
            const style = categoryStyles[index % categoryStyles.length];
            
            return (
              <Link
                key={category.id}
                to={`/store/${storeSlug}/products?category=${category.slug}`}
                className="group flex flex-col items-center gap-3 w-20 md:w-24"
              >
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full ${style.bg} flex items-center justify-center text-2xl md:text-3xl group-hover:scale-110 transition-transform shadow-sm`}>
                  {category.image_url ? (
                    <img 
                      src={category.image_url} 
                      alt={category.name}
                      className="w-10 h-10 md:w-12 md:h-12 object-contain"
                    />
                  ) : (
                    <span>{style.icon}</span>
                  )}
                </div>
                <span className="text-xs md:text-sm text-neutral-700 text-center font-medium leading-tight">
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
