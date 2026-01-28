import { memo, useState } from 'react';
import { Section as SectionType } from '@/types/pageBuilder';
import { Button } from '@/components/ui/button';
import { Trash2, Copy, ChevronDown, ChevronUp, Plus, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropZone } from './DropZone';
import { SortableCanvasBlock } from '@/pages/admin/PageBuilder';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ImprovedSectionProps {
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
}

export const ImprovedSection = memo(({
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
}: ImprovedSectionProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
    minHeight: section.settings.minHeight || '100px',
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div
        className={cn(
          "relative group mb-4 transition-all",
          isSelected && "ring-2 ring-primary ring-offset-2 rounded-lg"
        )}
      >
        {/* Section Toolbar - Always visible when selected, hover when not */}
        <div
          className={cn(
            "absolute -top-10 left-0 right-0 z-40 flex items-center justify-between bg-background border border-border rounded-t-lg px-3 py-2 shadow-sm transition-all",
            isSelected ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto"
          )}
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing">
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
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
            <span className="text-xs font-medium text-muted-foreground">Section {sectionIndex + 1}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
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
                handleDelete();
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
            "relative rounded-lg border-2 transition-all bg-background",
            isSelected 
              ? "border-primary shadow-lg" 
              : "border-transparent group-hover:border-muted-foreground/30"
          )}
          onClick={(e) => {
            if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.section-content')) {
              onSelect();
            }
          }}
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
            <div className="section-content min-h-[100px]">
              {section.blocks.length === 0 ? (
                <DropZone
                  id={`section-${section.id}-inside`}
                  position="inside"
                  sectionId={section.id}
                  isActive={isSelected}
                />
              ) : (
                <div className="space-y-2 p-2">
                  {section.blocks.map((block, blockIndex) => (
                    <div key={block.id} className="relative">
                      <DropZone
                        id={`block-${block.id}-before`}
                        position="before"
                        blockId={block.id}
                        sectionId={section.id}
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

              {/* Add Block Button - shown when section is empty or selected */}
              {(section.blocks.length === 0 || isSelected) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Button
                    size="sm"
                    variant="outline"
                    className="pointer-events-auto shadow-lg"
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
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the entire section and all blocks inside it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

ImprovedSection.displayName = 'ImprovedSection';
