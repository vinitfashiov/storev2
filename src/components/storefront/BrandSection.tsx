import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_path: string | null;
}

interface BrandSectionProps {
  brands: Brand[];
  storeSlug: string;
  title?: string;
}

export function BrandSection({ brands, storeSlug, title = "Shop by Brand" }: BrandSectionProps) {
  if (brands.length === 0) return null;

  const getLogoUrl = (logoPath: string | null) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http')) return logoPath;
    return supabase.storage.from('brand-logos').getPublicUrl(logoPath).data.publicUrl;
  };

  // Brand colors for visual variety when no logo
  const brandColors = [
    'bg-neutral-100',
    'bg-amber-50',
    'bg-rose-50',
    'bg-sky-50',
    'bg-emerald-50',
    'bg-purple-50',
  ];

  return (
    <section className="py-10 md:py-14 bg-neutral-50">
      <div className="container mx-auto px-4">
        <h2 className="font-serif text-2xl md:text-3xl font-semibold text-center text-neutral-900 mb-10">
          {title}
        </h2>
        
        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          {brands.map((brand, index) => {
            const logoUrl = getLogoUrl(brand.logo_path);
            const bgColor = brandColors[index % brandColors.length];
            
            return (
              <Link
                key={brand.id}
                to={`/store/${storeSlug}/products?brand=${brand.slug}`}
                className="group flex flex-col items-center gap-3 w-24 md:w-28"
              >
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl ${bgColor} flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm overflow-hidden`}>
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt={brand.name}
                      className="w-14 h-14 md:w-16 md:h-16 object-contain"
                    />
                  ) : (
                    <span className="text-lg md:text-xl font-serif font-semibold text-neutral-600">
                      {brand.name.charAt(0)}
                    </span>
                  )}
                </div>
                <span className="text-xs md:text-sm text-neutral-700 text-center font-medium leading-tight">
                  {brand.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
