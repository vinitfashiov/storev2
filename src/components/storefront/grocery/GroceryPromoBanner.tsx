import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCustomDomain } from '@/contexts/CustomDomainContext';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_path: string;
  cta_text: string | null;
  cta_url: string | null;
  device_type?: 'desktop' | 'mobile' | 'all';
}

interface GroceryPromoBannerProps {
  banners: Banner[];
  storeSlug: string;
}

function GroceryPromoSlider({ banners, storeSlug, className }: GroceryPromoBannerProps & { className?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { isCustomDomain } = useCustomDomain();

  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${storeSlug}${cleanPath}`;
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) {
    // Default promotional banner
    return (
      <div className={className}>
        <div className="mx-4 my-4">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-green-500 to-green-600 p-5">
            <div className="relative z-10">
              <div className="text-white/80 text-xs font-medium mb-1">Discount</div>
              <div className="text-white text-4xl font-bold mb-2">30%</div>
              <div className="text-white text-sm mb-3">All Vegetables & Fruits</div>
              <Link
                to={getLink('/products')}
                className="inline-block bg-neutral-900 text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                Shop Now
              </Link>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/2">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith('http')) return imagePath;
    return supabase.storage.from('store-assets').getPublicUrl(imagePath).data.publicUrl;
  };

  const currentBanner = banners[currentIndex];

  return (
    <div className={className}>
      <div className="mx-4 my-4">
        <div className="relative rounded-2xl overflow-hidden aspect-[2/1] bg-gradient-to-r from-green-500 to-green-600">
          <img
            src={getImageUrl(currentBanner.image_path)}
            alt={currentBanner.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
          <div className="absolute inset-0 p-5 flex flex-col justify-center">
            <div className="text-white/80 text-xs font-medium mb-1">{currentBanner.subtitle || 'Special Offer'}</div>
            <div className="text-white text-2xl md:text-3xl font-bold mb-2">{currentBanner.title}</div>
            {currentBanner.cta_text && currentBanner.cta_url && (
              <Link
                to={currentBanner.cta_url}
                className="inline-block bg-neutral-900 text-white text-sm font-medium px-4 py-2 rounded-lg w-fit"
              >
                {currentBanner.cta_text}
              </Link>
            )}
          </div>

          {/* Navigation Arrows */}
          {banners.length > 1 && (
            <>
              <button
                onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Dots */}
          {banners.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/50'
                    }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function GroceryPromoBanner(props: GroceryPromoBannerProps) {
  const desktopBanners = props.banners.filter(b => !b.device_type || b.device_type === 'desktop' || b.device_type === 'all');
  const mobileBanners = props.banners.filter(b => !b.device_type || b.device_type === 'mobile' || b.device_type === 'all');

  return (
    <>
      <div className="hidden md:block">
        <GroceryPromoSlider {...props} banners={desktopBanners} />
      </div>
      <div className="md:hidden">
        <GroceryPromoSlider {...props} banners={mobileBanners} />
      </div>
    </>
  );
}
