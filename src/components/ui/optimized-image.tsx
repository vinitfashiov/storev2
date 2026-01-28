/**
 * OptimizedImage - Lazy loading image with blur placeholder
 * 
 * Features:
 * - Native lazy loading
 * - Async decoding
 * - Blur-up placeholder effect
 * - Error handling with fallback
 * - Responsive srcset support
 */

import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  blurPlaceholder?: boolean;
  aspectRatio?: string;
}

export function OptimizedImage({
  src,
  alt,
  className,
  fallback = '/placeholder.svg',
  blurPlaceholder = true,
  aspectRatio,
  style,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Check if image is already cached
  useEffect(() => {
    if (imgRef.current?.complete) {
      setIsLoaded(true);
    }
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const imageSrc = hasError ? fallback : src;

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted/30',
        !isLoaded && blurPlaceholder && 'animate-pulse',
        className
      )}
      style={{
        aspectRatio,
        ...style,
      }}
    >
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        {...props}
      />
    </div>
  );
}

/**
 * ProductImage - Optimized for product cards
 */
export function ProductImage({
  src,
  alt,
  className,
  ...props
}: OptimizedImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={cn('aspect-[3/4]', className)}
      blurPlaceholder
      {...props}
    />
  );
}

/**
 * BannerImage - Optimized for hero banners (higher priority)
 */
export function BannerImage({
  src,
  alt,
  className,
  ...props
}: Omit<OptimizedImageProps, 'loading'>) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-muted/50 to-muted/30 animate-pulse" />
      )}
      <img
        src={hasError ? '/placeholder.svg' : src}
        alt={alt}
        loading="eager" // Banners should load immediately
        decoding="async"
        fetchPriority="high"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        {...props}
      />
    </div>
  );
}

/**
 * AvatarImage - Optimized for small avatar images
 */
export function AvatarImage({
  src,
  alt,
  size = 40,
  className,
}: {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);
  
  if (!src || hasError) {
    // Return initials placeholder
    const initials = alt
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-primary/10 text-primary font-medium',
          className
        )}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
      className={cn('rounded-full object-cover', className)}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * Preload an image for faster display
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preload multiple images
 */
export function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(preloadImage));
}
