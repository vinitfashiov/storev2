import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageBuilderBlock, HomepageLayout } from '@/types/pageBuilder';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  useStoreCategories, 
  useStoreBrands,
  useStoreProducts
} from '@/hooks/useOptimizedQueries';
import { ChevronRight, Star, Package, Mail, Check, Play, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageBuilderRendererProps {
  tenantId: string;
  storeSlug: string;
  onAddToCart?: (productId: string, price: number, quantity?: number) => Promise<void>;
  addingProductId?: string | null;
}

// Fetch published layout
function usePublishedLayout(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['published-layout', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data, error } = await supabase
        .from('homepage_layouts' as any)
        .select('layout_data, published_at')
        .eq('tenant_id', tenantId)
        .not('published_at', 'is', null)
        .maybeSingle();
      
      if (error) throw error;
      const layoutData = (data as any)?.layout_data as HomepageLayout | null;
      return layoutData;
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Individual Block Renderers
const HeroBlockRenderer = memo(({ block, storeSlug }: { block: any; storeSlug: string }) => {
  const { data } = block;
  const styles = block.styles || {};
  
  return (
    <section 
      className="relative min-h-[400px] md:min-h-[500px] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: styles.backgroundColor }}
    >
      {data.imageUrl && (
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
      )}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 
          className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4"
          style={{ color: data.textColor || (data.overlay ? '#ffffff' : undefined) }}
        >
          {data.title}
        </h1>
        {data.subtitle && (
          <p 
            className="text-lg md:text-xl mb-8 opacity-90"
            style={{ color: data.textColor || (data.overlay ? '#ffffff' : undefined) }}
          >
            {data.subtitle}
          </p>
        )}
        <div className="flex flex-wrap gap-4 justify-center">
          {data.ctaText && (
            <Link to={`/store/${storeSlug}${data.ctaUrl || '/products'}`}>
              <Button size="lg" className="text-lg px-8">
                {data.ctaText}
              </Button>
            </Link>
          )}
          {data.ctaSecondaryText && (
            <Link to={`/store/${storeSlug}${data.ctaSecondaryUrl || '/products'}`}>
              <Button size="lg" variant="outline" className="text-lg px-8">
                {data.ctaSecondaryText}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
});

const ProductsBlockRenderer = memo(({ block, tenantId, storeSlug, onAddToCart, addingProductId }: { 
  block: any; 
  tenantId: string; 
  storeSlug: string;
  onAddToCart?: (productId: string, price: number) => Promise<void>;
  addingProductId?: string | null;
}) => {
  const { data } = block;
  const { data: productsData } = useStoreProducts({
    tenantId,
    limit: data.limit || 8,
    sortBy: data.collection === 'recent' ? 'created' : 'name'
  });
  
  const products = productsData?.products || [];
  const styles = block.styles || {};

  return (
    <section 
      className="py-12 md:py-16 px-4"
      style={{ backgroundColor: styles.backgroundColor }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">{data.title}</h2>
          {data.subtitle && (
            <p className="text-muted-foreground max-w-2xl mx-auto">{data.subtitle}</p>
          )}
        </div>
        
        <div className={cn(
          "grid gap-4 md:gap-6",
          data.layout === 'carousel' 
            ? "grid-flow-col auto-cols-[280px] overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            : `grid-cols-2 md:grid-cols-${Math.min(data.columns || 4, 6)}`
        )}>
          {products.slice(0, data.limit || 8).map((product: any) => {
            const images = product.images as any[];
            const imageUrl = images?.[0]?.url || '/placeholder.svg';
            const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
            
            return (
              <Card key={product.id} className="group overflow-hidden snap-start">
                <Link to={`/store/${storeSlug}/product/${product.slug}`}>
                  <div className="aspect-square bg-muted overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>
                <CardContent className="p-3 md:p-4">
                  <Link to={`/store/${storeSlug}/product/${product.slug}`}>
                    <h3 className="font-medium text-sm md:text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold">₹{product.price}</span>
                    {hasDiscount && (
                      <span className="text-sm text-muted-foreground line-through">
                        ₹{product.compare_at_price}
                      </span>
                    )}
                  </div>
                  {onAddToCart && (
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => onAddToCart(product.id, product.price)}
                      disabled={addingProductId === product.id}
                    >
                      {addingProductId === product.id ? 'Adding...' : 'Add to Cart'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="text-center mt-8">
          <Link to={`/store/${storeSlug}/products`}>
            <Button variant="outline" size="lg">
              View All Products
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
});

const CategoriesBlockRenderer = memo(({ block, tenantId, storeSlug }: { block: any; tenantId: string; storeSlug: string }) => {
  const { data } = block;
  const { data: categories = [] } = useStoreCategories(tenantId, data.limit || 8);
  const styles = block.styles || {};

  return (
    <section 
      className="py-12 md:py-16 px-4"
      style={{ backgroundColor: styles.backgroundColor }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">{data.title}</h2>
          {data.subtitle && (
            <p className="text-muted-foreground">{data.subtitle}</p>
          )}
        </div>
        
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4`}>
          {categories.slice(0, data.limit || 8).map((category: any) => (
            <Link 
              key={category.id}
              to={`/store/${storeSlug}/products?category=${category.slug}`}
              className="group"
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <span className="text-4xl">{category.name.charAt(0)}</span>
                </div>
                <CardContent className="p-3 text-center">
                  <h3 className="font-medium group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
});

const BrandsBlockRenderer = memo(({ block, tenantId, storeSlug }: { block: any; tenantId: string; storeSlug: string }) => {
  const { data } = block;
  const { data: brands = [] } = useStoreBrands(tenantId, data.limit || 8);
  const styles = block.styles || {};

  return (
    <section 
      className="py-12 md:py-16 px-4"
      style={{ backgroundColor: styles.backgroundColor }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">{data.title}</h2>
          {data.subtitle && (
            <p className="text-muted-foreground">{data.subtitle}</p>
          )}
        </div>
        
        <div className={cn(
          "flex flex-wrap justify-center gap-6 md:gap-8",
          data.layout === 'carousel' && "overflow-x-auto flex-nowrap pb-4"
        )}>
          {brands.slice(0, data.limit || 8).map((brand: any) => (
            <Link 
              key={brand.id}
              to={`/store/${storeSlug}/products?brand=${brand.slug}`}
              className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 bg-muted rounded-xl flex items-center justify-center p-4 hover:shadow-lg transition-shadow"
            >
              {brand.logo_path ? (
                <img src={brand.logo_path} alt={brand.name} className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="text-xl font-bold text-muted-foreground">{brand.name}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
});

const TextBlockRenderer = memo(({ block }: { block: any }) => {
  const { data } = block;
  const styles = block.styles || {};

  return (
    <section 
      className="py-8 px-4"
      style={{ 
        backgroundColor: styles.backgroundColor,
        textAlign: styles.textAlign || 'left'
      }}
    >
      <div className="max-w-4xl mx-auto">
        <p 
          className="text-base md:text-lg leading-relaxed"
          style={{ 
            fontSize: data.fontSize,
            fontWeight: data.fontWeight,
            color: data.color
          }}
        >
          {data.content}
        </p>
      </div>
    </section>
  );
});

const HeadingBlockRenderer = memo(({ block }: { block: any }) => {
  const { data } = block;
  const styles = block.styles || {};
  const Tag = data.level || 'h2';
  
  const sizeClasses = {
    h1: 'text-4xl md:text-5xl',
    h2: 'text-3xl md:text-4xl',
    h3: 'text-2xl md:text-3xl',
    h4: 'text-xl md:text-2xl',
    h5: 'text-lg md:text-xl',
    h6: 'text-base md:text-lg'
  };

  return (
    <section 
      className="py-8 px-4"
      style={{ 
        backgroundColor: styles.backgroundColor,
        textAlign: data.align || styles.textAlign || 'left'
      }}
    >
      <div className="max-w-4xl mx-auto">
        <Tag className={cn("font-bold", sizeClasses[data.level as keyof typeof sizeClasses])}>
          {data.text}
        </Tag>
      </div>
    </section>
  );
});

const ImageBlockRenderer = memo(({ block, storeSlug }: { block: any; storeSlug: string }) => {
  const { data } = block;
  const styles = block.styles || {};

  const image = (
    <img 
      src={data.imageUrl || '/placeholder.svg'} 
      alt={data.alt || 'Image'}
      className="max-w-full h-auto rounded-lg"
    />
  );

  return (
    <section 
      className="py-8 px-4"
      style={{ 
        backgroundColor: styles.backgroundColor,
        textAlign: styles.textAlign || 'center'
      }}
    >
      <div className="max-w-4xl mx-auto">
        {data.linkUrl ? (
          <Link to={data.linkUrl.startsWith('/') ? `/store/${storeSlug}${data.linkUrl}` : data.linkUrl}>
            {image}
          </Link>
        ) : image}
        {data.caption && (
          <p className="text-sm text-muted-foreground mt-2">{data.caption}</p>
        )}
      </div>
    </section>
  );
});

const CtaBlockRenderer = memo(({ block, storeSlug }: { block: any; storeSlug: string }) => {
  const { data } = block;
  const styles = block.styles || {};

  return (
    <section 
      className="py-16 md:py-20 px-4"
      style={{ backgroundColor: data.backgroundColor || styles.backgroundColor || 'hsl(var(--primary))' }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-4xl font-bold mb-4 text-primary-foreground">
          {data.title}
        </h2>
        {data.subtitle && (
          <p className="text-lg opacity-90 mb-8 text-primary-foreground/80">
            {data.subtitle}
          </p>
        )}
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to={`/store/${storeSlug}${data.buttonUrl || '/products'}`}>
            <Button size="lg" variant="secondary" className="text-lg px-8">
              {data.buttonText}
            </Button>
          </Link>
          {data.buttonSecondaryText && (
            <Link to={`/store/${storeSlug}${data.buttonSecondaryUrl || '/'}`}>
              <Button size="lg" variant="outline" className="text-lg px-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                {data.buttonSecondaryText}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
});

const TestimonialsBlockRenderer = memo(({ block }: { block: any }) => {
  const { data } = block;
  const styles = block.styles || {};
  const testimonials = data.testimonials || [data];

  return (
    <section 
      className="py-12 md:py-16 px-4"
      style={{ backgroundColor: styles.backgroundColor }}
    >
      <div className="max-w-6xl mx-auto">
        {data.title && (
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{data.title}</h2>
        )}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial: any, index: number) => (
            <Card key={index} className="p-6">
              <Quote className="w-8 h-8 text-primary/30 mb-4" />
              <p className="text-lg mb-4 italic">"{testimonial.quote}"</p>
              <div className="flex items-center gap-3">
                {testimonial.avatarUrl ? (
                  <img src={testimonial.avatarUrl} alt={testimonial.author} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary">{testimonial.author?.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  {testimonial.authorTitle && (
                    <div className="text-sm text-muted-foreground">{testimonial.authorTitle}</div>
                  )}
                </div>
              </div>
              {testimonial.rating && (
                <div className="flex gap-1 mt-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("w-4 h-4", i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-muted")} />
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

const FeaturesBlockRenderer = memo(({ block }: { block: any }) => {
  const { data } = block;
  const styles = block.styles || {};

  return (
    <section 
      className="py-12 md:py-16 px-4"
      style={{ backgroundColor: styles.backgroundColor }}
    >
      <div className="max-w-6xl mx-auto">
        {data.title && (
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">{data.title}</h2>
            {data.subtitle && <p className="text-muted-foreground">{data.subtitle}</p>}
          </div>
        )}
        <div className={`grid md:grid-cols-${data.columns || 3} gap-6`}>
          {(data.features || []).map((feature: any, index: number) => (
            <Card key={index} className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
});

const NewsletterBlockRenderer = memo(({ block }: { block: any }) => {
  const { data } = block;
  const styles = block.styles || {};

  return (
    <section 
      className="py-12 md:py-16 px-4"
      style={{ backgroundColor: data.backgroundColor || styles.backgroundColor || 'hsl(var(--muted))' }}
    >
      <div className="max-w-xl mx-auto text-center">
        <Mail className="w-12 h-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl md:text-3xl font-bold mb-2">{data.title}</h2>
        {data.subtitle && (
          <p className="text-muted-foreground mb-6">{data.subtitle}</p>
        )}
        <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
          <input 
            type="email" 
            placeholder={data.placeholder || "Enter your email"} 
            className="flex-1 px-4 py-3 rounded-lg border border-border bg-background"
          />
          <Button type="submit" size="lg">{data.buttonText || 'Subscribe'}</Button>
        </form>
      </div>
    </section>
  );
});

const StatsBlockRenderer = memo(({ block }: { block: any }) => {
  const { data } = block;
  const styles = block.styles || {};

  return (
    <section 
      className="py-12 md:py-16 px-4"
      style={{ backgroundColor: styles.backgroundColor }}
    >
      <div className="max-w-6xl mx-auto">
        {data.title && (
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{data.title}</h2>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {(data.stats || []).map((stat: any, index: number) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                {stat.prefix}{stat.value}{stat.suffix}
              </div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

const SpacerBlockRenderer = memo(({ block }: { block: any }) => {
  const { data } = block;
  return <div style={{ height: data.height || '60px' }} />;
});

const DividerBlockRenderer = memo(({ block }: { block: any }) => {
  const { data } = block;
  return (
    <div className="px-4">
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

const CustomHtmlBlockRenderer = memo(({ block }: { block: any }) => {
  const { data } = block;
  const blockId = `custom-html-${block.id}`;
  
  // Basic HTML sanitization (remove script tags)
  const sanitizedHtml = useMemo(() => {
    const html = data.html || '';
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }, [data.html]);

  return (
    <div id={blockId} className="custom-html-block">
      {data.css && (
        <style dangerouslySetInnerHTML={{ 
          __html: data.css.replace(/([^{}]+)\{/g, `#${blockId} $1{`) 
        }} />
      )}
      <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
    </div>
  );
});

// Block Renderer Router
const BlockRenderer = memo(({ block, tenantId, storeSlug, onAddToCart, addingProductId }: {
  block: PageBuilderBlock;
  tenantId: string;
  storeSlug: string;
  onAddToCart?: (productId: string, price: number) => Promise<void>;
  addingProductId?: string | null;
}) => {
  switch (block.type) {
    case 'hero':
    case 'heroCentered':
    case 'heroSplit':
    case 'heroVideo':
      return <HeroBlockRenderer block={block} storeSlug={storeSlug} />;
    
    case 'products':
    case 'productsCarousel':
    case 'productsGrid':
    case 'collection':
      return <ProductsBlockRenderer block={block} tenantId={tenantId} storeSlug={storeSlug} onAddToCart={onAddToCart} addingProductId={addingProductId} />;
    
    case 'categories':
    case 'categoriesGrid':
      return <CategoriesBlockRenderer block={block} tenantId={tenantId} storeSlug={storeSlug} />;
    
    case 'brands':
    case 'brandsCarousel':
    case 'logoCloud':
      return <BrandsBlockRenderer block={block} tenantId={tenantId} storeSlug={storeSlug} />;
    
    case 'text':
    case 'richText':
      return <TextBlockRenderer block={block} />;
    
    case 'heading':
      return <HeadingBlockRenderer block={block} />;
    
    case 'image':
    case 'imageGallery':
    case 'banner':
    case 'bannerSplit':
      return <ImageBlockRenderer block={block} storeSlug={storeSlug} />;
    
    case 'cta':
    case 'ctaWithImage':
      return <CtaBlockRenderer block={block} storeSlug={storeSlug} />;
    
    case 'testimonial':
    case 'testimonials':
      return <TestimonialsBlockRenderer block={block} />;
    
    case 'feature':
    case 'features':
      return <FeaturesBlockRenderer block={block} />;
    
    case 'newsletter':
      return <NewsletterBlockRenderer block={block} />;
    
    case 'stats':
      return <StatsBlockRenderer block={block} />;
    
    case 'spacer':
      return <SpacerBlockRenderer block={block} />;
    
    case 'divider':
      return <DividerBlockRenderer block={block} />;
    
    case 'customHtml':
      return <CustomHtmlBlockRenderer block={block} />;
    
    default:
      return null;
  }
});

// Main Page Builder Renderer Component
export function PageBuilderRenderer({ tenantId, storeSlug, onAddToCart, addingProductId }: PageBuilderRendererProps) {
  const { data: layout, isLoading } = usePublishedLayout(tenantId);

  if (isLoading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!layout || !layout.sections || layout.sections.length === 0) {
    return null; // Return null to fall back to default homepage
  }

  return (
    <div className="page-builder-content">
      {layout.sections
        .sort((a, b) => a.order - b.order)
        .map((block) => (
          <BlockRenderer 
            key={block.id} 
            block={block} 
            tenantId={tenantId}
            storeSlug={storeSlug}
            onAddToCart={onAddToCart}
            addingProductId={addingProductId}
          />
        ))}
    </div>
  );
}

export { usePublishedLayout };
