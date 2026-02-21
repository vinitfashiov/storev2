import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useCustomDomain } from '@/contexts/CustomDomainContext';

interface Brand {
    id: string;
    name: string;
    slug: string;
    logo_path?: string | null;
}

interface D2CBrandSectionProps {
    brands: Brand[];
    storeSlug: string;
    variant?: 'grid' | 'scroll';
}

export function D2CBrandSection({
    brands,
    storeSlug,
    variant = 'grid'
}: D2CBrandSectionProps) {
    const { isCustomDomain } = useCustomDomain();

    if (brands.length === 0) return null;

    const getImageUrl = (path: string | null | undefined) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return supabase.storage.from('store-assets').getPublicUrl(path).data.publicUrl;
    };

    const getLink = (path: string) => {
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return isCustomDomain ? cleanPath : `/store/${storeSlug}${cleanPath}`;
    };

    return (
        <section className="py-6 lg:py-10 bg-white">
            <div className="max-w-7xl mx-auto px-4 lg:px-8">
                <div className="text-center mb-6 lg:mb-10">
                    <h2 className="text-xl lg:text-2xl font-serif font-medium tracking-wide text-neutral-900">
                        Shop by Brand
                    </h2>
                </div>

                <div className="flex gap-4 lg:gap-8 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap lg:justify-center">
                    {brands.map((brand) => {
                        const imageUrl = getImageUrl(brand.logo_path);

                        return (
                            <Link
                                key={brand.id}
                                to={`${getLink('/products')}?brand=${brand.slug}`}
                                className="group flex flex-col items-center flex-shrink-0 w-[84px] lg:w-[120px]"
                            >
                                <div className="w-[84px] h-[84px] lg:w-[120px] lg:h-[120px] rounded-full overflow-hidden transition-transform group-hover:scale-105 mb-2 lg:mb-3 flex items-center justify-center relative bg-neutral-50 border border-neutral-100 p-2">
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={brand.name}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs lg:text-sm font-medium text-neutral-400 bg-neutral-100 rounded-full">
                                            {brand.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-center text-[11px] lg:text-sm font-normal text-neutral-800 line-clamp-2 w-full px-1 capitalize tracking-wide">
                                    {brand.name}
                                </h3>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </section>
    );
}
