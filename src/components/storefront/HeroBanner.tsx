import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCustomDomain } from '@/contexts/CustomDomainContext';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_path: string;
  cta_text: string | null;
  cta_url: string | null;
}

interface HeroBannerProps {
  banners: Banner[];
  storeSlug: string;
  storeName: string;
  storeDescription?: string | null;
}

export function HeroBanner({ banners, storeSlug, storeName, storeDescription }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { isCustomDomain } = useCustomDomain();

  const getLink = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return isCustomDomain ? cleanPath : `/store/${storeSlug}${cleanPath}`;
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % banners.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);

  // Default hero if no banners
  if (banners.length === 0) {
    return (
      <section className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 overflow-hidden">
        <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
          <div className="max-w-2xl">
            <p className="text-amber-700 font-medium mb-4 tracking-wide text-sm">WELCOME TO OUR STORE</p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold text-neutral-900 mb-6 leading-tight">
              Discover Your
              <br />
              Perfect Style
            </h1>
            <p className="text-lg text-neutral-600 mb-8 max-w-lg">
              {storeDescription || 'Explore our exclusive collection of premium products crafted with excellence.'}
            </p>
            <Link to={getLink('/products')}>
              <Button size="lg" className="bg-amber-700 hover:bg-amber-800 text-white px-8 rounded-full">
                Explore Collection
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block">
          <div className="w-full h-full bg-gradient-to-l from-amber-100/50 to-transparent" />
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden">
      {/* Slides */}
      <div className="relative">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={cn(
              "transition-all duration-700 ease-in-out",
              index === currentIndex
                ? "opacity-100 relative"
                : "opacity-0 absolute inset-0 pointer-events-none"
            )}
          >
            <div className="relative h-[400px] md:h-[500px] lg:h-[600px]">
              <img
                src={banner.image_path}
                alt={banner.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/70 via-neutral-900/40 to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-4">
                  <div className="max-w-lg text-white">
                    {banner.subtitle && (
                      <p className="text-amber-400 font-medium mb-3 tracking-wide text-sm uppercase">
                        {banner.subtitle}
                      </p>
                    )}
                    <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl font-semibold mb-6 leading-tight">
                      {banner.title}
                    </h2>
                    {banner.cta_text && banner.cta_url && (
                      <Link to={banner.cta_url.startsWith('/') ? getLink(banner.cta_url) : banner.cta_url}>
                        <Button
                          size="lg"
                          className="bg-amber-600 hover:bg-amber-700 text-white px-8 rounded-full border-0"
                        >
                          {banner.cta_text}
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-neutral-800" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-neutral-800" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all",
                index === currentIndex
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/70"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
