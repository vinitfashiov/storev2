import { useDroppable } from '@dnd-kit/core';
import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface DropZoneProps {
  id: string;
  position: 'before' | 'after' | 'inside';
  sectionId?: string;
  blockId?: string;
  isActive?: boolean;
}

export const DropZone = memo(({ id, position, sectionId, blockId, isActive }: DropZoneProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'drop-zone',
      position,
      sectionId,
      blockId,
    },
  });

  const showZone = isOver || isActive;

  if (position === 'before' || position === 'after') {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          "h-2 transition-all duration-200",
          showZone && "h-8 bg-primary/20 border-2 border-dashed border-primary rounded"
        )}
      >
        {showZone && (
          <div className="flex items-center justify-center h-full">
            <Plus className="w-4 h-4 text-primary" />
            <span className="text-xs text-primary ml-2">Drop here</span>
          </div>
        )}
      </div>
    );
  }

  // Inside drop zone (for sections)
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[100px] transition-all duration-200 rounded-lg border-2 border-dashed",
        showZone
          ? "border-primary bg-primary/5"
          : "border-transparent"
      )}
    >
      {showZone && (
        <div className="flex items-center justify-center h-full py-8">
          <div className="text-center">
            <Plus className="w-6 h-6 text-primary mx-auto mb-2" />
            <span className="text-sm text-primary font-medium">Drop blocks here</span>
          </div>
        </div>
      )}
    </div>
  );
});

DropZone.displayName = 'DropZone';
