import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_path: string;
  link_url?: string | null;
  cta_url?: string | null;
  cta_text: string | null;
  device_type?: 'desktop' | 'mobile' | 'all';
}

interface D2CHeroBannerProps {
  banners: Banner[];
  storeSlug: string;
  storeName: string;
  storeDescription?: string | null;
}

function D2CBannerSlider({
  banners,
  storeSlug,
  storeName,
  storeDescription,
  className,
  isMobile
}: D2CHeroBannerProps & { className?: string, isMobile?: boolean }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const getImageUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    return supabase.storage.from('store-banners').getPublicUrl(path).data.publicUrl;
  };

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => clearInterval(interval);
  }, [currentSlide, banners.length]);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % banners.length);
    setTimeout(() => setIsAnimating(false), 700);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
    setTimeout(() => setIsAnimating(false), 700);
  };

  // Fallback hero when no banners
  if (banners.length === 0) {
    return (
      <section className={cn("relative overflow-hidden group", className)}>
        <div className={cn("relative w-full", isMobile ? "aspect-[4/5]" : "aspect-[2.5/1]")}>
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-100 to-neutral-200" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-3xl px-6">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-[0.1em] text-neutral-900 mb-6 animate-fade-in">
                {storeName.toUpperCase()}
              </h1>
              {storeDescription && (
                <p className="text-lg md:text-xl font-light text-neutral-600 mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  {storeDescription}
                </p>
              )}
              <Link
                to={`/store/${storeSlug}/products`}
                className="inline-block px-10 py-4 bg-neutral-900 text-white text-sm tracking-[0.2em] font-medium hover:bg-neutral-800 transition-colors animate-fade-in"
                style={{ animationDelay: '0.4s' }}
              >
                SHOP NOW
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const currentBanner = banners[currentSlide];

  return (
    <section className={cn("relative overflow-hidden group", className)}>
      <div className={cn("relative w-full", isMobile ? "aspect-[4/5]" : "aspect-[2.5/1]")}>
        {/* Slides */}
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000",
              index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
            )}
          >
            <img
              src={getImageUrl(banner.image_path)}
              alt={banner.title || 'Banner'}
              className="w-full h-full object-cover"
            />
            {/* Overlay Gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>
        ))}

        {/* Content */}
        <div className="absolute inset-0 flex items-end justify-center pb-16 md:pb-24 z-20">
          <div className="text-center max-w-4xl px-4 w-full">
            {currentBanner.subtitle && (
              <p
                className={cn(
                  "text-xs md:text-sm tracking-[0.3em] font-medium text-white mb-3 transition-all duration-700",
                  isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
                )}
              >
                {currentBanner.subtitle.toUpperCase()}
              </p>
            )}
            {currentBanner.title && (
              <h2
                className={cn(
                  "text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 md:mb-10 leading-tight transition-all duration-700 delay-100",
                  isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
                )}
              >
                {currentBanner.title}
              </h2>
            )}
            {(currentBanner.link_url || currentBanner.cta_url) && (
              <Link
                to={currentBanner.link_url || currentBanner.cta_url || '#'}
                className={cn(
                  "inline-block px-8 py-4 md:px-12 md:py-4 bg-white text-neutral-900 text-sm tracking-[0.2em] font-bold hover:bg-neutral-900 hover:text-white transition-all duration-500 delay-200 uppercase",
                  isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
                )}
              >
                {currentBanner.cta_text || 'SHOP NOW'}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "h-0.5 transition-all duration-300",
                index === currentSlide ? "w-12 bg-white" : "w-6 bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function D2CHeroBanner(props: D2CHeroBannerProps) {
  const desktopBanners = props.banners.filter(b => !b.device_type || b.device_type === 'desktop' || b.device_type === 'all');
  const mobileBanners = props.banners.filter(b => !b.device_type || b.device_type === 'mobile' || b.device_type === 'all');

  return (
    <>
      <div className="hidden md:block">
        <D2CBannerSlider {...props} banners={desktopBanners} />
      </div>
      <div className="md:hidden">
        <D2CBannerSlider {...props} banners={mobileBanners} isMobile={true} />
      </div>
    </>
  );
}
