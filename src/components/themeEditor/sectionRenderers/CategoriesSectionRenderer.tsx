import { memo } from 'react';
import { useStoreCategories } from '@/hooks/useOptimizedQueries';
import { ThemeSection } from '@/types/themeEditor';
import { Card, CardContent } from '@/components/ui/card';
import { Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CategoriesSectionRendererProps {
  section: ThemeSection;
  tenantId?: string | null;
  storeSlug?: string;
}

export const CategoriesSectionRenderer = memo(({
  section,
  tenantId,
  storeSlug,
}: CategoriesSectionRendererProps) => {
  const { data: categoriesData } = useStoreCategories({
    tenantId: tenantId || undefined,
  });

  const categories = categoriesData?.categories || [];
  const settings = section.settings;
  const layout = settings.layout || 'grid';
  const columns = settings.columns || 4;

  const sectionStyle: React.CSSProperties = {
    backgroundColor: settings.backgroundColor,
    backgroundImage: settings.backgroundImage ? `url(${settings.backgroundImage})` : undefined,
    backgroundSize: settings.backgroundSize || 'cover',
    backgroundPosition: settings.backgroundPosition || 'center',
    paddingTop: settings.padding?.top || '1rem',
    paddingRight: settings.padding?.right || '1rem',
    paddingBottom: settings.padding?.bottom || '1rem',
    paddingLeft: settings.padding?.left || '1rem',
  };

  return (
    <section style={sectionStyle} className="w-full">
      <div
        className={cn(
          'mx-auto',
          settings.containerWidth === 'full' ? 'w-full' : '',
          settings.containerWidth === 'boxed' ? 'max-w-7xl' : '',
          settings.containerWidth === 'custom' ? '' : ''
        )}
        style={
          settings.containerWidth === 'custom' && settings.containerMaxWidth
            ? { maxWidth: settings.containerMaxWidth }
            : undefined
        }
      >
        {(settings.showTitle || settings.showSubtitle) && (
          <div className="text-center mb-8">
            {settings.showTitle && section.title && (
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{section.title}</h2>
            )}
            {settings.showSubtitle && section.subtitle && (
              <p className="text-muted-foreground max-w-2xl mx-auto">{section.subtitle}</p>
            )}
          </div>
        )}

        {categories.length === 0 ? (
          <div className="text-center py-16">
            <Tag className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-semibold mb-2">No categories yet</h3>
          </div>
        ) : (
          <div
            className={cn(
              'grid gap-4',
              layout === 'carousel'
                ? 'grid-flow-col auto-cols-[150px] overflow-x-auto pb-2'
                : layout === 'list'
                ? 'grid-cols-1'
                : `grid-cols-2 md:grid-cols-${Math.min(columns, 6)}`
            )}
          >
            {categories.slice(0, settings.limit || 8).map((category: any) => (
              <Link
                key={category.id}
                to={storeSlug ? `/store/${storeSlug}/products?category=${category.slug}` : '#'}
              >
                <Card className="overflow-hidden group hover:shadow-md transition-shadow text-center">
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Tag className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-sm">{category.name}</h3>
                    {category.product_count && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {category.product_count} products
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

CategoriesSectionRenderer.displayName = 'CategoriesSectionRenderer';
