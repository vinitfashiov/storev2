import { memo } from 'react';
import { useStoreProducts } from '@/hooks/useOptimizedQueries';
import { ThemeSection } from '@/types/themeEditor';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ProductsSectionRendererProps {
  section: ThemeSection;
  tenantId?: string | null;
  storeSlug?: string;
}

export const ProductsSectionRenderer = memo(({
  section,
  tenantId,
  storeSlug,
}: ProductsSectionRendererProps) => {
  const dataBinding = section.dataBindings?.products;
  const settings = section.settings;

  const { data: productsData } = useStoreProducts({
    tenantId: tenantId || undefined,
    limit: settings.limit || 8,
    sortBy: dataBinding?.sortBy || 'created',
  });

  const products = productsData?.products || [];
  const hasProducts = products.length > 0;
  const columns = settings.columns || 4;
  const layout = settings.layout || 'grid';

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

        {!hasProducts ? (
          <div className="text-center py-16">
            <Package className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-semibold mb-2">No products yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Add products to your store to display them here
            </p>
          </div>
        ) : (
          <>
            <div
              className={cn(
                'grid gap-4 md:gap-6',
                layout === 'carousel'
                  ? 'grid-flow-col auto-cols-[200px] overflow-x-auto pb-2'
                  : layout === 'list'
                  ? 'grid-cols-1'
                  : layout === 'masonry'
                  ? 'columns-2 md:columns-4 gap-4'
                  : `grid-cols-2 md:grid-cols-${Math.min(columns, 6)}`
              )}
            >
              {products.slice(0, settings.limit || 8).map((product: any) => {
                const imageUrl =
                  Array.isArray(product.images) && product.images.length > 0
                    ? product.images[0]
                    : null;
                const price = product.price || 0;
                const comparePrice = product.compare_at_price || null;

                return (
                  <Card
                    key={product.id}
                    className="overflow-hidden group hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-primary">₹{price.toFixed(2)}</span>
                        {comparePrice && comparePrice > price && (
                          <span className="text-xs text-muted-foreground line-through">
                            ₹{comparePrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {storeSlug && (
                        <Link to={`/store/${storeSlug}/product/${product.slug}`}>
                          <Button size="sm" className="w-full h-7 text-xs">
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            View Product
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {settings.showViewAll && settings.viewAllUrl && (
              <div className="text-center mt-6">
                <Link to={settings.viewAllUrl}>
                  <Button variant="outline">View All Products</Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
});

ProductsSectionRenderer.displayName = 'ProductsSectionRenderer';
