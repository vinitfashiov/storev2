import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Eye, 
  Save, 
  Rocket, 
  Monitor, 
  Tablet, 
  Smartphone,
  Undo2,
  Redo2,
  HelpCircle
} from 'lucide-react';
import { ThemeLayoutData, ThemeSection, ThemeSectionType } from '@/types/themeEditor';
import { useAuth } from '@/contexts/AuthContext';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SectionLibrary } from '@/components/themeEditor/SectionLibrary';
import { ThemeCanvas } from '@/components/themeEditor/ThemeCanvas';
import { SectionSettingsPanel } from '@/components/themeEditor/SectionSettingsPanel';
import { v4 as uuidv4 } from 'uuid';

export default function ThemeEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenant');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Early return if no tenantId
  if (!tenantId) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No tenant ID provided</p>
          <Button onClick={() => navigate('/dashboard')}>Go Back</Button>
        </div>
      </div>
    );
  }

  const [layoutData, setLayoutData] = useState<ThemeLayoutData>({
    header: {
      type: 'default',
      config: {
        logoPosition: 'left',
        menuPosition: 'center',
        showSearch: true,
        showCart: true,
        showWishlist: true,
        showAccount: true,
        sticky: true,
        backgroundColor: '#ffffff',
        textColor: '#000000',
      },
    },
    footer: {
      type: 'default',
      config: {
        showLinks: true,
        showSocial: true,
        showNewsletter: true,
        backgroundColor: '#1f2937',
        textColor: '#ffffff',
      },
    },
    sections: [],
  });

  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [history, setHistory] = useState<ThemeLayoutData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Drag & Drop Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch existing theme layout (with fallback to localStorage)
  const { data: existingLayout, isLoading } = useQuery({
    queryKey: ['theme-layout', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;

      try {
        const { data, error } = await supabase
          .from('theme_layouts')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_published', false)
          .maybeSingle();

        if (error) {
          // If table doesn't exist, try localStorage
          if (error.code === '42P01' || error.message.includes('does not exist')) {
            const localData = localStorage.getItem(`theme-layout-${tenantId}`);
            if (localData) {
              return {
                id: 'local',
                tenant_id: tenantId,
                layout_data: JSON.parse(localData) as ThemeLayoutData,
                is_published: false,
              };
            }
            return null;
          }
          console.error('Error fetching theme layout:', error);
          return null;
        }

        if (data && data.layout_data) {
          return {
            ...data,
            layout_data: data.layout_data as ThemeLayoutData,
          };
        }

        // Fallback to localStorage
        const localData = localStorage.getItem(`theme-layout-${tenantId}`);
        if (localData) {
          return {
            id: 'local',
            tenant_id: tenantId,
            layout_data: JSON.parse(localData) as ThemeLayoutData,
            is_published: false,
          };
        }

        return null;
      } catch (err: any) {
        // If table doesn't exist, try localStorage
        if (err.message?.includes('does not exist') || err.code === '42P01') {
          const localData = localStorage.getItem(`theme-layout-${tenantId}`);
          if (localData) {
            return {
              id: 'local',
              tenant_id: tenantId,
              layout_data: JSON.parse(localData) as ThemeLayoutData,
              is_published: false,
            };
          }
        }
        return null;
      }
    },
    enabled: !!tenantId,
  });

  // Load layout data on mount
  useEffect(() => {
    if (existingLayout?.layout_data) {
      setLayoutData(existingLayout.layout_data);
      setHistory([existingLayout.layout_data]);
      setHistoryIndex(0);
    }
  }, [existingLayout]);

  // Save Draft Mutation (with localStorage fallback)
  const saveDraftMutation = useMutation({
    mutationFn: async (data: ThemeLayoutData) => {
      if (!tenantId) throw new Error('Missing tenant ID');

      try {
        if (user) {
          const { error } = await supabase
            .from('theme_layouts')
            .upsert({
              tenant_id: tenantId,
              layout_data: data,
              is_published: false,
              updated_by: user.id,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'tenant_id',
            });

          if (error) {
            // If table doesn't exist, save to localStorage
            if (error.code === '42P01' || error.message.includes('does not exist')) {
              localStorage.setItem(`theme-layout-${tenantId}`, JSON.stringify(data));
              return;
            }
            throw error;
          }
        } else {
          // No user, save to localStorage
          localStorage.setItem(`theme-layout-${tenantId}`, JSON.stringify(data));
        }
      } catch (err: any) {
        // If table doesn't exist, save to localStorage
        if (err.message?.includes('does not exist') || err.code === '42P01') {
          localStorage.setItem(`theme-layout-${tenantId}`, JSON.stringify(data));
          return;
        }
        throw err;
      }
    },
    onSuccess: () => {
      toast.success('Draft saved successfully');
      queryClient.invalidateQueries({ queryKey: ['theme-layout', tenantId] });
    },
    onError: (error: any) => {
      // If error, try localStorage as fallback
      if (tenantId && layoutData) {
        try {
          localStorage.setItem(`theme-layout-${tenantId}`, JSON.stringify(layoutData));
          toast.success('Draft saved to local storage');
        } catch (e) {
          toast.error('Failed to save draft: ' + error.message);
        }
      } else {
        toast.error('Failed to save draft: ' + error.message);
      }
    },
  });

  // Publish Mutation (with localStorage fallback)
  const publishMutation = useMutation({
    mutationFn: async (data: ThemeLayoutData) => {
      if (!tenantId) throw new Error('Missing tenant ID');

      try {
        if (user) {
          // First, unpublish any existing published layout
          await supabase
            .from('theme_layouts')
            .update({ is_published: false })
            .eq('tenant_id', tenantId)
            .eq('is_published', true);

          // Create/update published layout
          const { error } = await supabase
            .from('theme_layouts')
            .upsert({
              tenant_id: tenantId,
              layout_data: data,
              is_published: true,
              published_at: new Date().toISOString(),
              updated_by: user.id,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'tenant_id',
            });

          if (error) {
            // If table doesn't exist, save to localStorage
            if (error.code === '42P01' || error.message.includes('does not exist')) {
              localStorage.setItem(`theme-layout-${tenantId}`, JSON.stringify(data));
              localStorage.setItem(`theme-layout-published-${tenantId}`, JSON.stringify(data));
              return;
            }
            throw error;
          }
        } else {
          // No user, save to localStorage
          localStorage.setItem(`theme-layout-${tenantId}`, JSON.stringify(data));
          localStorage.setItem(`theme-layout-published-${tenantId}`, JSON.stringify(data));
        }
      } catch (err: any) {
        // If table doesn't exist, save to localStorage
        if (err.message?.includes('does not exist') || err.code === '42P01') {
          localStorage.setItem(`theme-layout-${tenantId}`, JSON.stringify(data));
          localStorage.setItem(`theme-layout-published-${tenantId}`, JSON.stringify(data));
          return;
        }
        throw err;
      }
    },
    onSuccess: () => {
      toast.success('Theme published successfully! (Saved locally - run migration to save to database)');
      queryClient.invalidateQueries({ queryKey: ['theme-layout', tenantId] });
    },
    onError: (error: any) => {
      // If error, try localStorage as fallback
      if (tenantId && layoutData) {
        try {
          localStorage.setItem(`theme-layout-${tenantId}`, JSON.stringify(layoutData));
          localStorage.setItem(`theme-layout-published-${tenantId}`, JSON.stringify(layoutData));
          toast.success('Theme published to local storage (run migration to save to database)');
        } catch (e) {
          toast.error('Failed to publish theme: ' + error.message);
        }
      } else {
        toast.error('Failed to publish theme: ' + error.message);
      }
    },
  });

  // History Management
  const pushHistory = (newData: ThemeLayoutData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setLayoutData(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setLayoutData(history[newIndex]);
    }
  };

  const handleSaveDraft = () => {
    saveDraftMutation.mutate(layoutData);
  };

  const handlePublish = () => {
    publishMutation.mutate(layoutData);
  };

  const handlePreview = () => {
    // Open preview in new tab
    if (tenantId) {
      window.open(`/store/${tenantId}?preview=true`, '_blank');
    }
  };

  // Create default section
  const createDefaultSection = (type: ThemeSectionType, order: number): ThemeSection => {
    return {
      id: uuidv4(),
      type,
      order,
      title: type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      settings: {
        layout: type.includes('carousel') ? 'carousel' : type.includes('list') ? 'list' : 'grid',
        columns: 4,
        gap: '1rem',
        limit: 8,
        showTitle: true,
        showSubtitle: false,
        showViewAll: true,
        containerWidth: 'boxed',
        visibility: {
          desktop: true,
          tablet: true,
          mobile: true,
        },
      },
    };
  };

  // Add Section Handler
  const handleAddSection = (type: ThemeSectionType, position?: number) => {
    const newSection = createDefaultSection(type, position ?? layoutData.sections.length);
    const newSections = [...layoutData.sections, newSection].map((s, i) => ({ ...s, order: i }));
    const newLayoutData = { ...layoutData, sections: newSections };
    setLayoutData(newLayoutData);
    pushHistory(newLayoutData);
    setSelectedSectionId(newSection.id);
  };

  // Delete Section Handler
  const handleDeleteSection = (sectionId: string) => {
    const newSections = layoutData.sections
      .filter(s => s.id !== sectionId)
      .map((s, i) => ({ ...s, order: i }));
    const newLayoutData = { ...layoutData, sections: newSections };
    setLayoutData(newLayoutData);
    pushHistory(newLayoutData);
    setSelectedSectionId(null);
  };

  // Update Section Handler
  const handleUpdateSection = (sectionId: string, updates: Partial<ThemeSection>) => {
    const newSections = layoutData.sections.map(s =>
      s.id === sectionId ? { ...s, ...updates } : s
    );
    const newLayoutData = { ...layoutData, sections: newSections };
    setLayoutData(newLayoutData);
    pushHistory(newLayoutData);
  };

  // Duplicate Section Handler
  const handleDuplicateSection = (sectionId: string) => {
    const section = layoutData.sections.find(s => s.id === sectionId);
    if (section) {
      const newSection: ThemeSection = {
        ...section,
        id: uuidv4(),
        order: layoutData.sections.length,
      };
      const newSections = [...layoutData.sections, newSection].map((s, i) => ({ ...s, order: i }));
      const newLayoutData = { ...layoutData, sections: newSections };
      setLayoutData(newLayoutData);
      pushHistory(newLayoutData);
      setSelectedSectionId(newSection.id);
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Handle drag from library
    if (activeData?.type === 'library-section') {
      const sectionType = activeData.sectionType as ThemeSectionType;
      
      if (overData?.type === 'drop-zone') {
        const { sectionId, position: dropPosition } = overData;
        
        if (dropPosition === 'before' && sectionId) {
          // Insert before a specific section
          const targetIndex = layoutData.sections.findIndex(s => s.id === sectionId);
          const newSection = createDefaultSection(sectionType, targetIndex);
          const newSections = [
            ...layoutData.sections.slice(0, targetIndex),
            newSection,
            ...layoutData.sections.slice(targetIndex),
          ].map((s, i) => ({ ...s, order: i }));
          const newLayoutData = { ...layoutData, sections: newSections };
          setLayoutData(newLayoutData);
          pushHistory(newLayoutData);
          setSelectedSectionId(newSection.id);
        } else if (dropPosition === 'after' && sectionId) {
          // Insert after a specific section
          const targetIndex = layoutData.sections.findIndex(s => s.id === sectionId);
          const newSection = createDefaultSection(sectionType, targetIndex + 1);
          const newSections = [
            ...layoutData.sections.slice(0, targetIndex + 1),
            newSection,
            ...layoutData.sections.slice(targetIndex + 1),
          ].map((s, i) => ({ ...s, order: i }));
          const newLayoutData = { ...layoutData, sections: newSections };
          setLayoutData(newLayoutData);
          pushHistory(newLayoutData);
          setSelectedSectionId(newSection.id);
        } else {
          // Drop on empty canvas or top/bottom drop zones
          // Add to end
          handleAddSection(sectionType);
        }
      } else {
        // If not dropped on a drop zone, add to end
        handleAddSection(sectionType);
      }
      return;
    }

    // Handle section reordering
    if (active.id !== over.id && activeData?.type === 'section' && overData?.type === 'section') {
      const oldIndex = layoutData.sections.findIndex(s => s.id === active.id);
      const newIndex = layoutData.sections.findIndex(s => s.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newSections = arrayMove(layoutData.sections, oldIndex, newIndex)
          .map((s, i) => ({ ...s, order: i }));
        const newLayoutData = { ...layoutData, sections: newSections };
        setLayoutData(newLayoutData);
        pushHistory(newLayoutData);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Show info banner if using localStorage (no migration)
  const isUsingLocalStorage = !existingLayout || existingLayout.id === 'local';

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Info Banner (if using localStorage) */}
      {isUsingLocalStorage && (
        <div className="h-10 bg-yellow-50 border-b border-yellow-200 flex items-center justify-center px-4 text-xs text-yellow-800">
          <span className="mr-2">⚠️</span>
          <span>Using local storage - Run database migration to save to database permanently</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="h-14 border-b bg-card flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/page-builder')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-border" />
          <h1 className="font-semibold text-sm">Theme Editor</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Device Toggle */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={previewDevice === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setPreviewDevice('desktop')}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={previewDevice === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setPreviewDevice('tablet')}
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant={previewDevice === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setPreviewDevice('mobile')}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={undo}
            disabled={historyIndex <= 0}
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo2 className="w-4 h-4" />
          </Button>

          <div className="h-6 w-px bg-border" />

          {/* Action Buttons */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreview}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={saveDraftMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={publishMutation.isPending}
          >
            <Rocket className="w-4 h-4 mr-2" />
            Publish
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area - Wrap in DndContext */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
      >
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Section Library */}
          <div className="w-64 border-r bg-card flex flex-col flex-shrink-0">
            <SectionLibrary onAddSection={handleAddSection} />
          </div>

          {/* Center - Canvas */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <ThemeCanvas
              layoutData={layoutData}
              previewDevice={previewDevice}
              onSectionSelect={setSelectedSectionId}
              onSectionEdit={(sectionId) => {
                setSelectedSectionId(sectionId);
              }}
              onSectionDelete={handleDeleteSection}
              onSectionDuplicate={handleDuplicateSection}
              selectedSectionId={selectedSectionId}
              tenantId={tenantId}
              isDragging={!!activeDragId}
            />
          </div>

          {/* Right Panel - Settings */}
          <div className="w-80 border-l bg-card flex-shrink-0">
            <SectionSettingsPanel
              section={layoutData.sections.find(s => s.id === selectedSectionId) || null}
              onUpdate={(updates) => {
                if (selectedSectionId) {
                  handleUpdateSection(selectedSectionId, updates);
                }
              }}
              onClose={() => setSelectedSectionId(null)}
            />
          </div>
        </div>

        <DragOverlay>
          {activeDragId && (
            <div className="bg-background border-2 border-primary rounded-lg p-4 shadow-lg">
              Dragging...
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
