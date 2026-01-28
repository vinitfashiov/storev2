import { useDraggable } from '@dnd-kit/core';
import { memo } from 'react';
import { BlockType } from '@/types/pageBuilder';
import { BLOCK_ICONS } from '@/pages/admin/PageBuilder';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableBlockProps {
  type: BlockType;
  label: string;
  description: string;
}

export const DraggableBlock = memo(({ type, label, description }: DraggableBlockProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-block-${type}`,
    data: {
      type: 'library-block',
      blockType: type,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const Icon = BLOCK_ICONS[type] || Package;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "w-full text-left p-3 hover:bg-accent transition-colors group border-b last:border-b-0 cursor-grab active:cursor-grabbing select-none",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-background group-hover:bg-primary/10 transition-colors">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm mb-0.5">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
    </div>
  );
});

DraggableBlock.displayName = 'DraggableBlock';
