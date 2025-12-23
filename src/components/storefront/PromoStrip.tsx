import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PromoStripProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  storeSlug: string;
}

export function PromoStrip({
  title = "Let Your Style",
  subtitle = "be as unique as the stones you wear",
  ctaText = "Shop Now",
  ctaLink,
  storeSlug
}: PromoStripProps) {
  return (
    <section className="bg-gradient-to-r from-amber-600 to-amber-700 py-16 md:py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-4">
          {title}
        </h2>
        <p className="text-amber-100 text-lg md:text-xl mb-8 max-w-xl mx-auto">
          {subtitle}
        </p>
        <Link to={ctaLink || `/store/${storeSlug}/products`}>
          <Button 
            size="lg" 
            variant="outline"
            className="rounded-full px-8 bg-transparent border-white text-white hover:bg-white hover:text-amber-700"
          >
            {ctaText}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
