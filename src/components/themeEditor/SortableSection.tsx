import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { ThemeSection } from '@/types/themeEditor';
import { ThemeSectionRenderer } from './ThemeSectionRenderer';

interface SortableSectionProps {
  section: ThemeSection;
  isSelected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  tenantId?: string | null;
}

export const SortableSection = memo(({
  section,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  tenantId,
}: SortableSectionProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    data: {
      type: 'section',
      section,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag Handle */}
      <div
        className="absolute -left-8 top-1/2 -translate-y-1/2 z-50 p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <ThemeSectionRenderer
        section={section}
        isSelected={isSelected}
        onSelect={onSelect}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        tenantId={tenantId}
      />
    </div>
  );
});

SortableSection.displayName = 'SortableSection';
