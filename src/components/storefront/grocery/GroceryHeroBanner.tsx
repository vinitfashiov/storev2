import { Link } from 'react-router-dom';
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

interface GroceryHeroBannerProps {
  banners: Banner[];
  storeSlug: string;
}

function GroceryBannerSlider({ banners, storeSlug, className }: GroceryHeroBannerProps & { className?: string }) {
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
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith('http')) return imagePath;
    return supabase.storage.from('store-assets').getPublicUrl(imagePath).data.publicUrl;
  };

  // Default hero if no banners
  if (banners.length === 0) {
    return (
      <div className={className}>
        <div className="mx-6 my-4">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 h-48">
            <div className="absolute inset-0 p-8 flex items-center">
              <div className="flex-1">
                <h2 className="text-white text-3xl font-bold mb-2">Paan corner</h2>
                <p className="text-white/90 text-lg mb-4">Your favourite paan shop is now online</p>
                <Link
                  to={getLink('/products')}
                  className="inline-block bg-emerald-900 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-emerald-950 transition-colors"
                >
                  Shop Now
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="w-40 h-40 rounded-full bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className={className}>
      <div className="mx-6 my-4">
        <div className="relative rounded-2xl overflow-hidden h-48 bg-gradient-to-r from-emerald-700 to-emerald-500">
          <img
            src={getImageUrl(currentBanner.image_path)}
            alt={currentBanner.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
          <div className="absolute inset-0 p-8 flex items-center">
            <div>
              <h2 className="text-white text-3xl font-bold mb-2">{currentBanner.title}</h2>
              {currentBanner.subtitle && (
                <p className="text-white/90 text-lg mb-4">{currentBanner.subtitle}</p>
              )}
              {currentBanner.cta_text && currentBanner.cta_url && (
                <Link
                  to={currentBanner.cta_url.startsWith('/') ? getLink(currentBanner.cta_url) : currentBanner.cta_url}
                  className="inline-block bg-emerald-900 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-emerald-950 transition-colors"
                >
                  {currentBanner.cta_text}
                </Link>
              )}
            </div>
          </div>

          {/* Dots */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-6' : 'bg-white/50'
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

export function GroceryHeroBanner(props: GroceryHeroBannerProps) {
  const desktopBanners = props.banners.filter(b => !b.device_type || b.device_type === 'desktop' || b.device_type === 'all');
  const mobileBanners = props.banners.filter(b => !b.device_type || b.device_type === 'mobile' || b.device_type === 'all');

  return (
    <>
      <div className="hidden md:block">
        <GroceryBannerSlider {...props} banners={desktopBanners} />
      </div>
      <div className="md:hidden">
        <GroceryBannerSlider {...props} banners={mobileBanners} />
      </div>
    </>
  );
}
