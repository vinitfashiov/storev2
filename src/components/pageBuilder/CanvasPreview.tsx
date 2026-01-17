import { memo, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { PageBuilderBlock } from '@/types/pageBuilder';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Package, Tag, Award, ImageIcon, Code, Mail, Check, Star, Quote,
  Play, ChevronRight, Truck, Headphones
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CanvasPreviewProps {
  block: PageBuilderBlock;
  isSelected?: boolean;
  onClick?: () => void;
}

// Hero Block Preview
const HeroPreview = memo(({ block }: { block: any }) => {
  const { data } = block;
  const styles = block.styles || {};
  
  return (
    <section 
      className="relative min-h-[300px] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: styles.backgroundColor || '#f8fafc' }}
    >
      {data.imageUrl ? (
        <>
          <img 
            src={data.imageUrl} 
            alt={data.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {data.overlay && (
            <div 
              className="absolute inset-0 bg-black"
              style={{ opacity: (data.overlayOpacity || 50) / 100 }}
            />
          )}
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
      )}
      <div className="relative z-10 text-center px-6 py-8 max-w-4xl mx-auto">
        <h1 
          className="text-2xl md:text-4xl font-bold mb-3"
          style={{ color: data.textColor || (data.overlay && data.imageUrl ? '#ffffff' : undefined) }}
        >
          {data.title || 'Hero Title'}
        </h1>
        {data.subtitle && (
          <p 
            className="text-base md:text-lg mb-6 opacity-90"
            style={{ color: data.textColor || (data.overlay && data.imageUrl ? '#ffffff' : undefined) }}
          >
            {data.subtitle}
          </p>
        )}
        <div className="flex flex-wrap gap-3 justify-center">
          {data.ctaText && (
            <Button size="default" className="pointer-events-none">
              {data.ctaText}
            </Button>
          )}
          {data.ctaSecondaryText && (
            <Button size="default" variant="outline" className="pointer-events-none">
              {data.ctaSecondaryText}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
});

// Products Block Preview
const ProductsPreview = memo(({ block }: { block: any }) => {
  const { data } = block;
  const styles = block.styles || {};
  const columns = Math.min(data.columns || 4, 6);
  
  return (
    <section 
      className="py-8 px-4"
      style={{ backgroundColor: styles.backgroundColor }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold mb-1">{data.title || 'Products'}</h2>
          {data.subtitle && (
            <p className="text-muted-foreground text-sm">{data.subtitle}</p>
          )}
        </div>
        
        <div className={cn(
          "grid gap-3",
          data.layout === 'carousel' 
            ? "grid-flow-col auto-cols-[200px] overflow-x-auto pb-2"
            : `grid-cols-2 md:grid-cols-${columns}`
        )}>
          {Array.from({ length: Math.min(data.limit || 4, 8) }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-square bg-muted flex items-center justify-center">
                <Package className="w-8 h-8 text-muted-foreground/30" />
              </div>
              <CardContent className="p-3">
                <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-primary/20 rounded w-16" />
                  <div className="h-3 bg-muted rounded w-12 line-through opacity-50" />
                </div>
                <Button size="sm" className="w-full mt-2 h-7 text-xs pointer-events-none">
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-6">
          <Button variant="outline" size="sm" className="pointer-events-none">
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </section>
  );
});

// Categories Block Preview  
const CategoriesPreview = memo(({ block }: { block: any }) => {
  const { data } = block;
  const styles = block.styles || {};
  
  return (
    <section 
      className="py-8 px-4"
      style={{ backgroundColor: styles.backgroundColor }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold mb-1">{data.title || 'Categories'}</h2>
          {data.subtitle && (
            <p className="text-muted-foreground text-sm">{data.subtitle}</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: Math.min(data.limit || 4, 8) }).map((_, i) => (
            <Card key={i} className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
              <div className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <Tag className="w-8 h-8 text-primary/50" />
              </div>
              <CardContent className="p-3 text-center">
                <div className="h-3 bg-muted rounded w-2/3 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
});

// Brands Block Preview
const BrandsPreview = memo(({ block }: { block: any }) => {
  const { data } = block;
  const styles = block.styles || {};
  
  return (
    <section 
      className="py-8 px-4"
      style={{ backgroundColor: styles.backgroundColor }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold mb-1">{data.title || 'Brands'}</h2>
          {data.subtitle && (
            <p className="text-muted-foreground text-sm">{data.subtitle}</p>
          )}
        </div>
        
        <div className={cn(
          "flex flex-wrap justify-center gap-4",
          data.layout === 'carousel' && "overflow-x-auto flex-nowrap pb-2"
        )}>
          {Array.from({ length: Math.min(data.limit || 6, 8) }).map((_, i) => (
            <div key={i} className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-muted-foreground/30" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

// Banner Block Preview
const BannerPreview = memo(({ block }: { block: any }) => {
  const { data } = block;
  const styles = block.styles || {};
  
  return (
    <section 
      className="relative min-h-[200px] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: styles.backgroundColor || '#f1f5f9' }}
    >
      {data.imageUrl ? (
        <img 
          src={data.imageUrl} 
          alt={data.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5" />
      )}
      <div className={cn(
        "relative z-10 px-6 py-8 max-w-4xl mx-auto",
        data.textPosition === 'left' ? 'text-left' : data.textPosition === 'right' ? 'text-right' : 'text-center'
      )}>
        <h2 className="text-xl md:text-2xl font-bold mb-2">{data.title || 'Banner Title'}</h2>
        {data.subtitle && <p className="text-muted-foreground mb-4">{data.subtitle}</p>}
        {data.ctaText && (
          <Button size="sm" className="pointer-events-none">{data.ctaText}</Button>
        )}
      </div>
    </section>
  );
});

// Text Block Preview
const TextPreview = memo(({ block }: { block: any }) => {
  const { data } = block;
  const styles = block.styles || {};
  
  return (
    <section 
      className="py-6 px-4"
      style={{ 
        backgroundColor: styles.backgroundColor,
        textAlign: styles.textAlign || 'left'
      }}
    >
      <div className="max-w-4xl mx-auto">
        <p 
          className="text-base leading-relaxed"
          style={{ 
            fontSize: data.fontSize,
            fontWeight: data.fontWeight,
            color: data.color
          }}
        >
          {data.content || 'Enter your text content here...'}
        </p>
      </div>
    </section>
  );
});

// Heading Block Preview
const HeadingPreview = memo(({ block }: { block: any }) => {
  const { data } = block;
  const styles = block.styles || {};
  const Tag = (data.level || 'h2') as keyof JSX.IntrinsicElements;
  
  const sizeClasses: Record<string, string> = {
    h1: 'text-3xl md:text-4xl',
    h2: 'text-2xl md:text-3xl',
    h3: 'text-xl md:text-2xl',
    h4: 'text-lg md:text-xl',
    h5: 'text-base md:text-lg',
    h6: 'text-sm md:text-base'
  };

  return (
    <section 
      className="py-6 px-4"
      style={{ 
        backgroundColor: styles.backgroundColor,
        textAlign: data.align || styles.textAlign || 'left'
      }}
    >
      <div className="max-w-4xl mx-auto">
        <Tag className={cn("font-bold", sizeClasses[data.level || 'h2'])}>
          {data.text || 'Section Heading'}
        </Tag>
      </div>
    </section>
  );
});

// Image Block Preview
const ImagePreview = memo(({ block }: { block: any }) => {
  const { data } = block;
  const styles = block.styles || {};

  return (
    <section 
      className="py-6 px-4"
      style={{ 
        backgroundColor: styles.backgroundColor,
        textAlign: styles.textAlign || 'center'
      }}
    >
      <div className="max-w-4xl mx-auto">
        {data.imageUrl ? (
          <img 
            src={data.imageUrl} 
            alt={data.alt || 'Image'}
            className="max-w-full h-auto rounded-lg mx-auto"
          />
        ) : (
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center max-w-2xl mx-auto">
            <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        {data.caption && (
          <p className="text-sm text-muted-foreground mt-2">{data.caption}</p>
        )}
      </div>
    </section>
  );
});

// CTA Block Preview
const CtaPreview = memo(({ block }: { block: any }) => {
  const { data } = block;
  const styles = block.styles || {};

  return (
    <section 
      className="py-12 px-4"
      style={{ backgroundColor: data.backgroundColor || styles.backgroundColor || 'hsl(var(--primary))' }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-xl md:text-2xl font-bold mb-3 text-primary-foreground">
          {data.title || 'Call to Action'}
        </h2>
        {data.subtitle && (
          <p className="text-base opacity-90 mb-6 text-primary-foreground/80">
            {data.subtitle}
          </p>
        )}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button size="default" variant="secondary" className="pointer-events-none">
            {data.buttonText || 'Get Started'}
          </Button>
          {data.buttonSecondaryText && (
            <Button size="default" variant="outline" className="pointer-events-none border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
              {data.buttonSecondaryText}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
});

// Testimonials Block Preview
const TestimonialsPreview = memo(({ block }: { block: any }) => {
  const { data } = block;
  const styles = block.styles || {};
  const testimonials = data.testimonials || [{ quote: data.quote, author: data.author, rating: data.rating }];

  return (
    <section 
      className="py-8 px-4"
      style={{ backgroundColor: styles.backgroundColor }}
    >
      <div className="max-w-6xl mx-auto">
        {data.title && (
          <h2 className="text-xl md:text-2xl font-bold text-center mb-8">{data.title}</h2>
        )}
        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.slice(0, 3).map((testimonial: any, index: number) => (
            <Card key={index} className="p-4">
              <Quote className="w-6 h-6 text-primary/30 mb-3" />
              <p className="text-sm mb-3 italic">"{testimonial.quote || 'Customer testimonial goes here...'}"</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">{(testimonial.author || 'A').charAt(0)}</span>
                </div>
                <div>
                  <div className="font-medium text-sm">{testimonial.author || 'Customer'}</div>
                  {testimonial.authorTitle && (
                    <div className="text-xs text-muted-foreground">{testimonial.authorTitle}</div>
                  )}
                </div>
              </div>
              {testimonial.rating && (
                <div className="flex gap-0.5 mt-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("w-3 h-3", i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-muted")} />
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
});

// Features Block Preview
const FeaturesPreview = memo(({ block }: { block: any }) => {
  const { data } = block;
  const styles = block.styles || {};
  const features = data.features || [
    { title: 'Feature 1', description: 'Description here' },
    { title: 'Feature 2', description: 'Description here' },
    { title: 'Feature 3', description: 'Description here' }
  ];

  return (
    <section 
      className="py-8 px-4"
      style={{ backgroundColor: styles.backgroundColor }}
    >
      <div className="max-w-6xl mx-auto">
        {data.title && (
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-1">{data.title}</h2>
            {data.subtitle && <p className="text-muted-foreground text-sm">{data.subtitle}</p>}
          </div>
        )}
        <div className={`grid md:grid-cols-${data.columns || 3} gap-4`}>
          {features.slice(0, 6).map((feature: any, index: number) => (
            <Card key={index} className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
              <p className="text-muted-foreground text-xs">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
});

// Newsletter Block Preview
const NewsletterPreview = memo(({ block }: { block: any }) => {
  const { data } = block;
  const styles = block.styles || {};

  return (
    <section 
      className="py-8 px-4"
      style={{ backgroundColor: data.backgroundColor || styles.backgroundColor || 'hsl(var(--muted))' }}
    >
      <div className="max-w-xl mx-auto text-center">
        <Mail className="w-10 h-10 mx-auto mb-3 text-primary" />
        <h2 className="text-xl md:text-2xl font-bold mb-1">{data.title || 'Subscribe to Newsletter'}</h2>
        {data.subtitle && (
          <p className="text-muted-foreground text-sm mb-4">{data.subtitle}</p>
        )}
        <div className="flex gap-2">
          <input 
            type="email" 
            placeholder={data.placeholder || "Enter your email"} 
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
            disabled
          />
          <Button size="default" className="pointer-events-none">{data.buttonText || 'Subscribe'}</Button>
        </div>
      </div>
    </section>
  );
});

// Stats Block Preview
const StatsPreview = memo(({ block }: { block: any }) => {
  const { data } = block;
  const styles = block.styles || {};
  const stats = data.stats || [
    { value: '10K', label: 'Customers', suffix: '+' },
    { value: '500', label: 'Products', suffix: '+' },
    { value: '99', label: 'Satisfaction', suffix: '%' }
  ];

  return (
    <section 
      className="py-8 px-4"
      style={{ backgroundColor: styles.backgroundColor }}
    >
      <div className="max-w-6xl mx-auto">
        {data.title && (
          <h2 className="text-xl md:text-2xl font-bold text-center mb-8">{data.title}</h2>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.slice(0, 4).map((stat: any, index: number) => (
            <div key={index} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1">
                {stat.prefix}{stat.value}{stat.suffix}
              </div>
              <div className="text-muted-foreground text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

// FAQ Block Preview
const FaqPreview = memo(({ block }: { block: any }) => {
  const { data } = block;
  const styles = block.styles || {};
  const faqs = data.faqs || [
    { question: 'Question 1?', answer: 'Answer goes here...' },
    { question: 'Question 2?', answer: 'Answer goes here...' }
  ];

  return (
    <section 
      className="py-8 px-4"
      style={{ backgroundColor: styles.backgroundColor }}
    >
      <div className="max-w-3xl mx-auto">
        {data.title && (
          <h2 className="text-xl md:text-2xl font-bold text-center mb-6">{data.title}</h2>
        )}
        <div className="space-y-3">
          {faqs.slice(0, 4).map((faq: any, index: number) => (
            <Card key={index} className="p-4">
              <h3 className="font-medium text-sm mb-2">{faq.question}</h3>
              <p className="text-muted-foreground text-xs">{faq.answer}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
});

// Spacer Block Preview
const SpacerPreview = memo(({ block }: { block: any }) => {
  const { data } = block;
  return (
    <div 
      className="bg-muted/30 border border-dashed border-muted-foreground/20 flex items-center justify-center"
      style={{ height: data.height || '60px' }}
    >
      <span className="text-xs text-muted-foreground">Spacer ({data.height || '60px'})</span>
    </div>
  );
});

// Divider Block Preview
const DividerPreview = memo(({ block }: { block: any }) => {
  const { data } = block;
  return (
    <div className="py-4 px-4">
      <hr 
        className="max-w-6xl mx-auto"
        style={{ 
          borderStyle: data.style || 'solid',
          borderColor: data.color || 'hsl(var(--border))',
          width: data.width || '100%'
        }} 
      />
    </div>
  );
});

// Custom HTML Block Preview
const CustomHtmlPreview = memo(({ block }: { block: any }) => {
  const { data } = block;
  const blockId = `preview-html-${block.id}`;
  
  // Sanitize HTML with DOMPurify
  const sanitizedHtml = useMemo(() => {
    const html = data.html || '';
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'ul', 'ol', 'li', 'a', 'strong', 'em', 'b', 'i', 'u', 'span', 'div', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'blockquote', 'pre', 'code', 'section', 'article', 'header', 'footer', 'nav', 'figure', 'figcaption'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'target', 'rel', 'id', 'width', 'height'],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onkeydown', 'onkeyup']
    });
  }, [data.html]);

  // Scope CSS to this block only
  const scopedCss = useMemo(() => {
    if (!data.css) return '';
    return data.css.replace(/([^{}]+)\{/g, `#${blockId} $1{`);
  }, [data.css, blockId]);

  // If there's actual content, render it
  if (sanitizedHtml && sanitizedHtml.trim()) {
    return (
      <div id={blockId} className="custom-html-preview">
        {scopedCss && (
          <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
        )}
        <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
      </div>
    );
  }

  // Placeholder
  return (
    <div className="py-6 px-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/20">
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Code className="w-5 h-5" />
        <span className="text-sm">Custom HTML Block</span>
      </div>
    </div>
  );
});

// Video Block Preview
const VideoPreview = memo(({ block }: { block: any }) => {
  const { data } = block;
  const styles = block.styles || {};

  return (
    <section 
      className="py-6 px-4"
      style={{ backgroundColor: styles.backgroundColor }}
    >
      <div className="max-w-4xl mx-auto">
        {data.title && (
          <h2 className="text-xl font-bold text-center mb-4">{data.title}</h2>
        )}
        {data.videoUrl ? (
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <video 
              src={data.videoUrl}
              poster={data.thumbnailUrl}
              controls
              muted={data.muted}
              loop={data.loop}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <Play className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
      </div>
    </section>
  );
});

// Main Canvas Preview Component
export const CanvasPreview = memo(({ block, isSelected, onClick }: CanvasPreviewProps) => {
  const renderBlock = () => {
    switch (block.type) {
      case 'hero':
      case 'heroCentered':
      case 'heroSplit':
      case 'heroVideo':
        return <HeroPreview block={block} />;
      
      case 'products':
      case 'productsCarousel':
      case 'productsGrid':
      case 'collection':
        return <ProductsPreview block={block} />;
      
      case 'categories':
      case 'categoriesGrid':
        return <CategoriesPreview block={block} />;
      
      case 'brands':
      case 'brandsCarousel':
      case 'logoCloud':
        return <BrandsPreview block={block} />;
      
      case 'banner':
      case 'bannerSplit':
        return <BannerPreview block={block} />;
      
      case 'text':
      case 'richText':
        return <TextPreview block={block} />;
      
      case 'heading':
        return <HeadingPreview block={block} />;
      
      case 'image':
      case 'imageGallery':
        return <ImagePreview block={block} />;
      
      case 'cta':
      case 'ctaWithImage':
        return <CtaPreview block={block} />;
      
      case 'testimonial':
      case 'testimonials':
        return <TestimonialsPreview block={block} />;
      
      case 'feature':
      case 'features':
        return <FeaturesPreview block={block} />;
      
      case 'newsletter':
        return <NewsletterPreview block={block} />;
      
      case 'stats':
        return <StatsPreview block={block} />;
      
      case 'faq':
        return <FaqPreview block={block} />;
      
      case 'spacer':
        return <SpacerPreview block={block} />;
      
      case 'divider':
        return <DividerPreview block={block} />;
      
      case 'customHtml':
        return <CustomHtmlPreview block={block} />;
      
      case 'video':
        return <VideoPreview block={block} />;
      
      default:
        return (
          <div className="py-6 px-4 bg-muted/30 rounded-lg text-center">
            <span className="text-muted-foreground text-sm capitalize">{block.type} Block</span>
          </div>
        );
    }
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative cursor-pointer transition-all group",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {renderBlock()}
      {/* Hover overlay */}
      <div className={cn(
        "absolute inset-0 border-2 border-transparent transition-colors pointer-events-none",
        !isSelected && "group-hover:border-primary/50 group-hover:bg-primary/5"
      )} />
    </div>
  );
});

export default CanvasPreview;
