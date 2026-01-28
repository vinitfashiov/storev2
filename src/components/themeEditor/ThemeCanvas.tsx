import { memo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ThemeSection, ThemeLayoutData } from '@/types/themeEditor';
import { cn } from '@/lib/utils';
import { ThemeSectionRenderer } from './ThemeSectionRenderer';
import { DropZone } from './DropZone';
import { SortableSection } from './SortableSection';

interface ThemeCanvasProps {
  layoutData: ThemeLayoutData;
  previewDevice: 'desktop' | 'tablet' | 'mobile';
  onSectionSelect?: (sectionId: string) => void;
  onSectionEdit?: (sectionId: string) => void;
  onSectionDelete?: (sectionId: string) => void;
  onSectionDuplicate?: (sectionId: string) => void;
  selectedSectionId?: string | null;
  tenantId?: string | null;
  isDragging?: boolean;
}

const deviceWidths = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

export const ThemeCanvas = memo(({
  layoutData,
  previewDevice,
  onSectionSelect,
  onSectionEdit,
  onSectionDelete,
  onSectionDuplicate,
  selectedSectionId,
  tenantId,
  isDragging = false,
}: ThemeCanvasProps) => {
  const sortedSections = [...layoutData.sections].sort((a, b) => a.order - b.order);
  const sectionIds = sortedSections.map(s => s.id);

  return (
    <ScrollArea className="flex-1">
      <div className="p-4">
        <div
          className="mx-auto bg-background rounded-lg shadow-sm min-h-full transition-all duration-300"
          style={{ maxWidth: deviceWidths[previewDevice] }}
        >
          {/* Header (Fixed) */}
          <div className="border-b p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="h-8 w-32 bg-muted rounded" />
              <div className="flex gap-4">
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Header (Fixed - Not Editable)
            </p>
          </div>

          {/* Sections Canvas */}
          <div className="min-h-[400px]">
            {sortedSections.length === 0 ? (
              <div className="py-16">
                <DropZone
                  id="empty-canvas-drop"
                  position="after"
                  isActive={isDragging}
                />
                <div className="text-center text-muted-foreground mt-8">
                  <p className="font-medium mb-2">Start building your theme</p>
                  <p className="text-sm">Drag sections from the library on the left</p>
                </div>
              </div>
            ) : (
              <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-0">
                  {/* Drop zone at the top */}
                  <DropZone
                    id="canvas-top-drop"
                    position="before"
                    isActive={isDragging}
                  />
                  {sortedSections.map((section, index) => (
                    <div key={section.id}>
                      <DropZone
                        id={`section-${section.id}-before`}
                        position="before"
                        sectionId={section.id}
                        isActive={isDragging}
                      />
                      <SortableSection
                        section={section}
                        isSelected={selectedSectionId === section.id}
                        onSelect={() => onSectionSelect?.(section.id)}
                        onEdit={() => onSectionEdit?.(section.id)}
                        onDelete={() => onSectionDelete?.(section.id)}
                        onDuplicate={() => onSectionDuplicate?.(section.id)}
                        tenantId={tenantId}
                      />
                      <DropZone
                        id={`section-${section.id}-after`}
                        position="after"
                        sectionId={section.id}
                        isActive={isDragging}
                      />
                    </div>
                  ))}
                  {/* Drop zone at the bottom */}
                  <DropZone
                    id="canvas-bottom-drop"
                    position="after"
                    isActive={isDragging}
                  />
                </div>
              </SortableContext>
            )}
          </div>

          {/* Footer (Fixed) */}
          <div className="border-t p-4 bg-muted/50">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="h-4 w-24 bg-muted rounded mb-2" />
                <div className="h-3 w-32 bg-muted rounded mb-1" />
              </div>
              <div>
                <div className="h-4 w-20 bg-muted rounded mb-2" />
                <div className="h-3 w-24 bg-muted rounded mb-1" />
              </div>
              <div>
                <div className="h-4 w-24 bg-muted rounded mb-2" />
                <div className="h-3 w-32 bg-muted rounded mb-1" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Footer (Fixed - Not Editable)
            </p>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
});

ThemeCanvas.displayName = 'ThemeCanvas';
