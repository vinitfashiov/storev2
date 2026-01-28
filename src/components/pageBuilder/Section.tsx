import { memo, useState } from 'react';
import { Section as SectionType } from '@/types/pageBuilder';
import { Button } from '@/components/ui/button';
import { Trash2, Copy, ChevronDown, ChevronUp, Settings, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropZone } from './DropZone';
import { SortableCanvasBlock } from '@/pages/admin/PageBuilder';

interface SectionProps {
  section: SectionType;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUpdate: (updates: Partial<SectionType>) => void;
  onAddBlock: (blockType: string, position?: number) => void;
  onBlockSelect: (blockId: string) => void;
  onBlockDelete: (blockId: string) => void;
  onBlockDuplicate: (blockId: string) => void;
  onBlockUpdate: (blockId: string, updates: any) => void;
  selectedBlockId: string | null;
  tenantId?: string | null;
  sectionIndex: number;
  onSectionReorder?: (fromIndex: number, toIndex: number) => void;
}

export const Section = memo(({
  section,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onUpdate,
  onAddBlock,
  onBlockSelect,
  onBlockDelete,
  onBlockDuplicate,
  onBlockUpdate,
  selectedBlockId,
  tenantId,
  sectionIndex,
}: SectionProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sectionStyle: React.CSSProperties = {
    backgroundColor: section.settings.backgroundColor,
    backgroundImage: section.settings.backgroundImage ? `url(${section.settings.backgroundImage})` : undefined,
    backgroundSize: section.settings.backgroundSize || 'cover',
    backgroundPosition: section.settings.backgroundPosition || 'center',
    paddingTop: section.settings.padding?.top || '0',
    paddingRight: section.settings.padding?.right || '0',
    paddingBottom: section.settings.padding?.bottom || '0',
    paddingLeft: section.settings.padding?.left || '0',
    marginTop: section.settings.margin?.top || '0',
    marginRight: section.settings.margin?.right || '0',
    marginBottom: section.settings.margin?.bottom || '0',
    marginLeft: section.settings.margin?.left || '0',
    minHeight: section.settings.minHeight,
  };

  return (
    <div
      className={cn(
        "relative group",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onSelect();
        }
      }}
    >
      {/* Section Header */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 z-30 flex items-center justify-between bg-background/95 rounded-t-lg shadow-lg border-b px-3 py-2 transition-opacity",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
          >
            {isCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </Button>
          <span className="text-xs font-medium">Section {sectionIndex + 1}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
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
          isSelected ? "border-primary" : "border-transparent group-hover:border-muted-foreground/30"
        )}
      >
        {/* Custom CSS */}
        {section.settings.customCSS && (
          <style dangerouslySetInnerHTML={{ __html: section.settings.customCSS }} />
        )}

        {/* Drop Zone - Top */}
        <DropZone
          id={`section-${section.id}-before`}
          position="before"
          sectionId={section.id}
          isActive={isSelected}
        />

        {/* Section Blocks */}
        {!isCollapsed && (
          <div className="min-h-[100px]">
            {section.blocks.length === 0 ? (
              <DropZone
                id={`section-${section.id}-inside`}
                position="inside"
                sectionId={section.id}
                isActive={isSelected}
              />
            ) : (
              <div className="space-y-0">
                {section.blocks.map((block, blockIndex) => (
                  <div key={block.id}>
                    <DropZone
                      id={`block-${block.id}-before`}
                      position="before"
                      blockId={block.id}
                    />
                    <SortableCanvasBlock
                      block={block}
                      isSelected={selectedBlockId === block.id}
                      onSelect={() => onBlockSelect(block.id)}
                      onDelete={() => onBlockDelete(block.id)}
                      onDuplicate={() => onBlockDuplicate(block.id)}
                      tenantId={tenantId}
                    />
                    {blockIndex === section.blocks.length - 1 && (
                      <DropZone
                        id={`section-${section.id}-after`}
                        position="after"
                        sectionId={section.id}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Block Button - shown when section is empty or on hover */}
        {!isCollapsed && (section.blocks.length === 0 || isSelected) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Button
              size="sm"
              variant="outline"
              className="pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                onAddBlock('text', 0);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Block
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

Section.displayName = 'Section';
