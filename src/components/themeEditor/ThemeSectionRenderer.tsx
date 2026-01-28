import { memo } from 'react';
import { ThemeSection } from '@/types/themeEditor';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Copy } from 'lucide-react';
import { ProductsSectionRenderer } from './sectionRenderers/ProductsSectionRenderer';
import { CategoriesSectionRenderer } from './sectionRenderers/CategoriesSectionRenderer';
import { CustomHtmlSectionRenderer } from './sectionRenderers/CustomHtmlSectionRenderer';

interface ThemeSectionRendererProps {
  section: ThemeSection;
  isSelected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  tenantId?: string | null;
}

export const ThemeSectionRenderer = memo(({
  section,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  tenantId,
}: ThemeSectionRendererProps) => {
  const sectionStyle: React.CSSProperties = {
    backgroundColor: section.settings.backgroundColor,
    backgroundImage: section.settings.backgroundImage ? `url(${section.settings.backgroundImage})` : undefined,
    backgroundSize: section.settings.backgroundSize || 'cover',
    backgroundPosition: section.settings.backgroundPosition || 'center',
    paddingTop: section.settings.padding?.top || '1rem',
    paddingRight: section.settings.padding?.right || '1rem',
    paddingBottom: section.settings.padding?.bottom || '1rem',
    paddingLeft: section.settings.padding?.left || '1rem',
    marginTop: section.settings.margin?.top || '0',
    marginRight: section.settings.margin?.right || '0',
    marginBottom: section.settings.margin?.bottom || '1rem',
    marginLeft: section.settings.margin?.left || '0',
    borderRadius: section.settings.borderRadius,
    boxShadow: section.settings.boxShadow,
  };

  return (
    <div
      className={cn(
        "relative group",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Section Toolbar */}
      <div
        className={cn(
          "absolute -top-10 left-0 right-0 z-40 flex items-center justify-between bg-background border border-border rounded-t-lg px-3 py-2 shadow-sm transition-all",
          isSelected ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {section.title || section.type}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate?.();
            }}
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Section Content */}
      <div
        style={sectionStyle}
        className={cn(
          "relative rounded-lg border-2 transition-all",
          isSelected
            ? "border-primary shadow-lg"
            : "border-transparent group-hover:border-muted-foreground/30"
        )}
        onClick={onSelect}
      >
        {/* Custom CSS */}
        {section.customStyles?.customCSS && (
          <style dangerouslySetInnerHTML={{ __html: section.customStyles.customCSS }} />
        )}

        {/* Section Preview */}
        <div className="p-4">
          {section.type === 'custom-html-css' ? (
            <CustomHtmlSectionRenderer section={section} />
          ) : section.type.startsWith('products') ? (
            <ProductsSectionRenderer section={section} tenantId={tenantId} />
          ) : section.type.startsWith('categories') ? (
            <CategoriesSectionRenderer section={section} tenantId={tenantId} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="font-medium text-sm">{section.title || section.type}</p>
              <p className="text-xs mt-1">Section content preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ThemeSectionRenderer.displayName = 'ThemeSectionRenderer';
