import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface DropZoneProps {
  id: string;
  position: 'before' | 'after';
  sectionId?: string;
  isActive?: boolean;
}

export const DropZone = memo(({ id, position, isActive, sectionId }: DropZoneProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'drop-zone',
      position,
      sectionId,
    },
  });

  const showZone = isOver || isActive;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[8px] transition-all duration-200 my-1",
        showZone && "min-h-[60px] bg-primary/10 border-2 border-dashed border-primary rounded-lg"
      )}
    >
      {showZone ? (
        <div className="flex items-center justify-center h-full min-h-[60px]">
          <Plus className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-primary ml-2">Drop here</span>
        </div>
      ) : (
        <div className="h-2 w-full" />
      )}
    </div>
  );
});

DropZone.displayName = 'DropZone';
