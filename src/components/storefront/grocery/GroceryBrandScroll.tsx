import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_path: string | null;
}

interface GroceryBrandScrollProps {
  brands: Brand[];
  storeSlug: string;
  title?: string;
}

export function GroceryBrandScroll({ brands, storeSlug, title = "Popular brands" }: GroceryBrandScrollProps) {
  if (brands.length === 0) return null;

  const getLogoUrl = (logoPath: string | null) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http')) return logoPath;
    return supabase.storage.from('brand-logos').getPublicUrl(logoPath).data.publicUrl;
  };

  return (
    <section className="py-4">
      <h2 className="text-lg font-bold text-neutral-900 mb-4 px-4">{title}</h2>
      <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {brands.map((brand) => {
          const logoUrl = getLogoUrl(brand.logo_path);
          
          return (
            <Link
              key={brand.id}
              to={`/store/${storeSlug}/products?brand=${brand.slug}`}
              className="flex flex-col items-center shrink-0"
            >
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden border-2 border-neutral-200 hover:border-green-500 transition-colors">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={brand.name}
                    className="w-10 h-10 object-contain"
                  />
                ) : (
                  <span className="text-lg font-bold text-neutral-600">
                    {brand.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-xs text-center text-neutral-700 font-medium mt-2 max-w-[64px] truncate">
                {brand.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
