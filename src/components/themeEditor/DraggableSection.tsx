import { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { SectionLibraryItem, ThemeSectionType } from '@/types/themeEditor';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface DraggableSectionProps {
  section: SectionLibraryItem;
  icon: LucideIcon;
  onAdd?: (type: ThemeSectionType) => void;
}

export const DraggableSection = memo(({ section, icon: Icon, onAdd }: DraggableSectionProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-section-${section.type}`,
    data: {
      type: 'library-section',
      sectionType: section.type,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-3 p-2.5 hover:bg-accent transition-colors cursor-grab active:cursor-grabbing border-b last:border-b-0",
        isDragging && "opacity-50"
      )}
      onClick={() => onAdd?.(section.type)}
    >
      <div className="p-1.5 rounded-lg bg-background">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-xs mb-0.5">{section.label}</div>
        <div className="text-[10px] text-muted-foreground line-clamp-1">
          {section.description}
        </div>
      </div>
    </div>
  );
});

DraggableSection.displayName = 'DraggableSection';
