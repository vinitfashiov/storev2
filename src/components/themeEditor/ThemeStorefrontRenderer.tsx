import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ThemeLayoutData, ThemeSection } from '@/types/themeEditor';
import { ProductsSectionRenderer } from './sectionRenderers/ProductsSectionRenderer';
import { CategoriesSectionRenderer } from './sectionRenderers/CategoriesSectionRenderer';
import { CustomHtmlSectionRenderer } from './sectionRenderers/CustomHtmlSectionRenderer';

interface ThemeStorefrontRendererProps {
  tenantId: string;
  storeSlug: string;
}

export const ThemeStorefrontRenderer = memo(({ tenantId, storeSlug }: ThemeStorefrontRendererProps) => {
  const { data: themeLayout, isLoading } = useQuery({
    queryKey: ['published-theme', tenantId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('theme_layouts')
          .select('layout_data')
          .eq('tenant_id', tenantId)
          .eq('is_published', true)
          .maybeSingle();

        if (error) {
          // If table doesn't exist, try localStorage
          if (error.code === '42P01' || error.message.includes('does not exist')) {
            const localData = localStorage.getItem(`theme-layout-published-${tenantId}`);
            if (localData) {
              return JSON.parse(localData) as ThemeLayoutData;
            }
            return null;
          }
          console.error('Error fetching published theme:', error);
          return null;
        }

        if (data?.layout_data) {
          return data.layout_data as ThemeLayoutData;
        }

        // Fallback to localStorage
        const localData = localStorage.getItem(`theme-layout-published-${tenantId}`);
        if (localData) {
          return JSON.parse(localData) as ThemeLayoutData;
        }

        return null;
      } catch (err: any) {
        // If table doesn't exist, try localStorage
        if (err.message?.includes('does not exist') || err.code === '42P01') {
          const localData = localStorage.getItem(`theme-layout-published-${tenantId}`);
          if (localData) {
            return JSON.parse(localData) as ThemeLayoutData;
          }
        }
        return null;
      }
    },
    enabled: !!tenantId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!themeLayout) {
    return null; // No published theme, fallback to default
  }

  const sortedSections = [...themeLayout.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen">
      {/* Header - Fixed (Not Editable) */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="flex gap-4">
            <div className="h-4 w-16 bg-muted rounded" />
            <div className="h-4 w-16 bg-muted rounded" />
          </div>
        </div>
      </header>

      {/* Sections */}
      {sortedSections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          tenantId={tenantId}
          storeSlug={storeSlug}
        />
      ))}

      {/* Footer - Fixed (Not Editable) */}
      <footer className="bg-gray-800 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="h-4 w-24 bg-white/20 rounded mb-2" />
              <div className="h-3 w-32 bg-white/10 rounded mb-1" />
              <div className="h-3 w-28 bg-white/10 rounded" />
            </div>
            <div>
              <div className="h-4 w-20 bg-white/20 rounded mb-2" />
              <div className="h-3 w-24 bg-white/10 rounded mb-1" />
              <div className="h-3 w-24 bg-white/10 rounded" />
            </div>
            <div>
              <div className="h-4 w-24 bg-white/20 rounded mb-2" />
              <div className="h-3 w-32 bg-white/10 rounded mb-1" />
              <div className="h-3 w-28 bg-white/10 rounded" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
});

ThemeStorefrontRenderer.displayName = 'ThemeStorefrontRenderer';

// Section Renderer Router
const SectionRenderer = memo(({
  section,
  tenantId,
  storeSlug,
}: {
  section: ThemeSection;
  tenantId: string;
  storeSlug: string;
}) => {
  switch (section.type) {
    case 'products-grid':
    case 'products-carousel':
    case 'products-list':
    case 'products-masonry':
    case 'featured-products':
    case 'best-sellers':
    case 'new-arrivals':
    case 'on-sale':
      return (
        <ProductsSectionRenderer
          section={section}
          tenantId={tenantId}
          storeSlug={storeSlug}
        />
      );

    case 'categories-grid':
    case 'categories-carousel':
    case 'categories-list':
      return (
        <CategoriesSectionRenderer
          section={section}
          tenantId={tenantId}
          storeSlug={storeSlug}
        />
      );

    case 'custom-html-css':
      return <CustomHtmlSectionRenderer section={section} />;

    default:
      return (
        <div className="py-8 text-center text-muted-foreground">
          <p>Section type: {section.type}</p>
        </div>
      );
  }
});

SectionRenderer.displayName = 'SectionRenderer';
