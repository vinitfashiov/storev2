import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import grapesjs, { Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import gjsPresetWebpage from 'grapesjs-preset-webpage';
import gjsBlocksBasic from 'grapesjs-blocks-basic';
import gjsPluginForms from 'grapesjs-plugin-forms';
import gjsCustomCode from 'grapesjs-custom-code';
import gjsTabs from 'grapesjs-tabs';
import gjsTooltip from 'grapesjs-tooltip';
import gjsTyped from 'grapesjs-typed';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Save, Upload, Eye, Undo2, Redo2, Monitor, Tablet, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// Custom GrapesJS styles to match the studio look
const customStyles = `
  .gjs-one-bg {
    background-color: hsl(var(--background)) !important;
  }
  .gjs-two-color {
    color: hsl(var(--foreground)) !important;
  }
  .gjs-three-bg {
    background-color: hsl(var(--muted)) !important;
  }
  .gjs-four-color, .gjs-four-color-h:hover {
    color: hsl(var(--primary)) !important;
  }
  .gjs-pn-panel {
    background-color: hsl(var(--card)) !important;
    border-color: hsl(var(--border)) !important;
  }
  .gjs-pn-views-container {
    background-color: hsl(var(--card)) !important;
    border-left: 1px solid hsl(var(--border)) !important;
  }
  .gjs-pn-views {
    border-bottom: 1px solid hsl(var(--border)) !important;
  }
  .gjs-pn-btn {
    color: hsl(var(--muted-foreground)) !important;
  }
  .gjs-pn-btn.gjs-pn-active {
    color: hsl(var(--primary)) !important;
    background-color: hsl(var(--primary) / 0.1) !important;
  }
  .gjs-block {
    background-color: hsl(var(--muted)) !important;
    border: 1px solid hsl(var(--border)) !important;
    border-radius: 8px !important;
    color: hsl(var(--foreground)) !important;
  }
  .gjs-block:hover {
    border-color: hsl(var(--primary)) !important;
    box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2) !important;
  }
  .gjs-block-label {
    color: hsl(var(--foreground)) !important;
    font-size: 11px !important;
  }
  .gjs-blocks-c {
    padding: 8px !important;
    gap: 8px !important;
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
  }
  .gjs-category-title, .gjs-layer-title, .gjs-sm-sector-title {
    background-color: hsl(var(--muted)) !important;
    color: hsl(var(--foreground)) !important;
    border-color: hsl(var(--border)) !important;
    font-weight: 600 !important;
  }
  .gjs-sm-sector {
    border-color: hsl(var(--border)) !important;
  }
  .gjs-sm-property {
    color: hsl(var(--foreground)) !important;
  }
  .gjs-field {
    background-color: hsl(var(--background)) !important;
    border-color: hsl(var(--border)) !important;
    color: hsl(var(--foreground)) !important;
    border-radius: 6px !important;
  }
  .gjs-field input, .gjs-field select, .gjs-field textarea {
    color: hsl(var(--foreground)) !important;
  }
  .gjs-input-holder input {
    background-color: transparent !important;
  }
  .gjs-clm-tags {
    background-color: hsl(var(--muted)) !important;
    border-radius: 6px !important;
  }
  .gjs-clm-tag {
    background-color: hsl(var(--primary)) !important;
    color: hsl(var(--primary-foreground)) !important;
    border-radius: 4px !important;
  }
  .gjs-layer {
    background-color: hsl(var(--muted)) !important;
    border-color: hsl(var(--border)) !important;
  }
  .gjs-layer:hover {
    background-color: hsl(var(--accent)) !important;
  }
  .gjs-layer.gjs-selected {
    background-color: hsl(var(--primary) / 0.2) !important;
  }
  .gjs-cv-canvas {
    background-color: hsl(var(--muted)) !important;
  }
  .gjs-frame-wrapper {
    background-color: white !important;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
    border-radius: 8px !important;
    overflow: hidden !important;
  }
  .gjs-toolbar {
    background-color: hsl(var(--popover)) !important;
    border-radius: 6px !important;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
  }
  .gjs-toolbar-item {
    color: hsl(var(--foreground)) !important;
  }
  .gjs-rte-toolbar {
    background-color: hsl(var(--popover)) !important;
    border-radius: 6px !important;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
  }
  .gjs-rte-action {
    color: hsl(var(--foreground)) !important;
  }
  .gjs-rte-action:hover {
    background-color: hsl(var(--accent)) !important;
  }
  .gjs-selected {
    outline: 2px solid hsl(var(--primary)) !important;
    outline-offset: -2px !important;
  }
  .gjs-highlighter {
    outline: 2px dashed hsl(var(--primary) / 0.5) !important;
  }
  .gjs-badge {
    background-color: hsl(var(--primary)) !important;
    color: hsl(var(--primary-foreground)) !important;
    border-radius: 4px !important;
    font-size: 10px !important;
    padding: 2px 6px !important;
  }
  .gjs-resizer-h {
    border-color: hsl(var(--primary)) !important;
  }
  .sp-container {
    background-color: hsl(var(--popover)) !important;
    border-color: hsl(var(--border)) !important;
    border-radius: 8px !important;
  }
  .gjs-mdl-dialog {
    background-color: hsl(var(--card)) !important;
    border-radius: 12px !important;
    color: hsl(var(--foreground)) !important;
  }
  .gjs-mdl-header {
    background-color: hsl(var(--muted)) !important;
    border-radius: 12px 12px 0 0 !important;
  }
  .gjs-mdl-title {
    color: hsl(var(--foreground)) !important;
    font-weight: 600 !important;
  }
  .gjs-am-assets-cont {
    background-color: hsl(var(--background)) !important;
  }
  .gjs-am-asset {
    background-color: hsl(var(--muted)) !important;
    border-radius: 8px !important;
  }
`;

export default function GrapesJSPageBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenant');
  const editorRef = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch existing layout
  const { data: existingLayout, isLoading } = useQuery({
    queryKey: ['homepage-layout-grapes', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data, error } = await supabase
        .from('homepage_layouts')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { html: string; css: string; projectData: any }) => {
      if (!tenantId) throw new Error('No tenant ID');
      
      const layoutData = {
        html: data.html,
        css: data.css,
        projectData: data.projectData,
        type: 'grapesjs',
      };

      const { error } = await supabase
        .from('homepage_layouts')
        .upsert({
          tenant_id: tenantId,
          draft_data: layoutData,
          layout_data: existingLayout?.layout_data || {},
          updated_at: new Date().toISOString(),
        }, { onConflict: 'tenant_id' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Draft saved successfully!');
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['homepage-layout-grapes', tenantId] });
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast.error('Failed to save draft');
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async (data: { html: string; css: string; projectData: any }) => {
      if (!tenantId) throw new Error('No tenant ID');
      
      const layoutData = {
        html: data.html,
        css: data.css,
        projectData: data.projectData,
        type: 'grapesjs',
      };

      const currentVersion = existingLayout?.version || 0;

      const { error } = await supabase
        .from('homepage_layouts')
        .upsert({
          tenant_id: tenantId,
          layout_data: layoutData,
          draft_data: null,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: currentVersion + 1,
        }, { onConflict: 'tenant_id' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Published successfully! Your storefront is now updated.');
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['homepage-layout-grapes', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['published-layout', tenantId] });
    },
    onError: (error) => {
      console.error('Publish error:', error);
      toast.error('Failed to publish');
    },
  });

  const handleSave = useCallback(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    saveMutation.mutate({
      html: editor.getHtml(),
      css: editor.getCss() || '',
      projectData: editor.getProjectData(),
    });
  }, [saveMutation]);

  const handlePublish = useCallback(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    publishMutation.mutate({
      html: editor.getHtml(),
      css: editor.getCss() || '',
      projectData: editor.getProjectData(),
    });
  }, [publishMutation]);

  const handlePreview = useCallback(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    const html = editor.getHtml();
    const css = editor.getCss();
    
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Preview</title>
            <style>${css}</style>
          </head>
          <body>${html}</body>
        </html>
      `);
      previewWindow.document.close();
    }
  }, []);

  // Initialize GrapesJS
  useEffect(() => {
    if (!containerRef.current || !tenantId || isLoading) return;

    // Inject custom styles
    const styleEl = document.createElement('style');
    styleEl.innerHTML = customStyles;
    document.head.appendChild(styleEl);

    const editor = grapesjs.init({
      container: containerRef.current,
      height: '100%',
      width: '100%',
      fromElement: false,
      storageManager: false,
      plugins: [
        gjsBlocksBasic,
        gjsPresetWebpage,
        gjsPluginForms,
        gjsCustomCode,
        gjsTabs,
        gjsTooltip,
        gjsTyped,
      ],
      pluginsOpts: {
        [gjsBlocksBasic as any]: {
          flexGrid: true,
          stylePrefix: 'gjs-',
        },
        [gjsPresetWebpage as any]: {
          modalImportTitle: 'Import Template',
          modalImportLabel: '<div style="margin-bottom: 10px;">Paste your HTML/CSS here</div>',
          modalImportContent: '',
          filestackOpts: null,
          aviaryOpts: false,
          blocksBasicOpts: { flexGrid: true },
          customStyleManager: [],
        },
        [gjsPluginForms as any]: {},
        [gjsCustomCode as any]: {},
        [gjsTabs as any]: {},
        [gjsTooltip as any]: {},
        [gjsTyped as any]: {},
      },
      canvas: {
        styles: [
          'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
        ],
      },
      deviceManager: {
        devices: [
          { id: 'desktop', name: 'Desktop', width: '' },
          { id: 'tablet', name: 'Tablet', width: '768px', widthMedia: '992px' },
          { id: 'mobile', name: 'Mobile', width: '375px', widthMedia: '480px' },
        ],
      },
      panels: {
        defaults: [],
      },
      blockManager: {
        appendTo: '#blocks-container',
      },
      layerManager: {
        appendTo: '#layers-container',
      },
      selectorManager: {
        appendTo: '#selectors-container',
      },
      styleManager: {
        appendTo: '#styles-container',
        sectors: [
          {
            name: 'Layout',
            open: true,
            properties: [
              { type: 'select', property: 'display', options: [
                { id: 'block', label: 'Block' },
                { id: 'inline', label: 'Inline' },
                { id: 'inline-block', label: 'Inline Block' },
                { id: 'flex', label: 'Flex' },
                { id: 'grid', label: 'Grid' },
                { id: 'none', label: 'None' },
              ]},
              { type: 'select', property: 'flex-direction', options: [
                { id: 'row', label: 'Row' },
                { id: 'row-reverse', label: 'Row Reverse' },
                { id: 'column', label: 'Column' },
                { id: 'column-reverse', label: 'Column Reverse' },
              ]},
              { type: 'select', property: 'justify-content', options: [
                { id: 'flex-start', label: 'Start' },
                { id: 'flex-end', label: 'End' },
                { id: 'center', label: 'Center' },
                { id: 'space-between', label: 'Space Between' },
                { id: 'space-around', label: 'Space Around' },
              ]},
              { type: 'select', property: 'align-items', options: [
                { id: 'flex-start', label: 'Start' },
                { id: 'flex-end', label: 'End' },
                { id: 'center', label: 'Center' },
                { id: 'stretch', label: 'Stretch' },
              ]},
              { property: 'gap' },
            ],
          },
          {
            name: 'Size',
            open: false,
            properties: [
              { property: 'width' },
              { property: 'min-width' },
              { property: 'max-width' },
              { property: 'height' },
              { property: 'min-height' },
              { property: 'max-height' },
            ],
          },
          {
            name: 'Space',
            open: false,
            properties: [
              { property: 'padding', type: 'composite', properties: [
                { property: 'padding-top' },
                { property: 'padding-right' },
                { property: 'padding-bottom' },
                { property: 'padding-left' },
              ]},
              { property: 'margin', type: 'composite', properties: [
                { property: 'margin-top' },
                { property: 'margin-right' },
                { property: 'margin-bottom' },
                { property: 'margin-left' },
              ]},
            ],
          },
          {
            name: 'Position',
            open: false,
            properties: [
              { type: 'select', property: 'position', options: [
                { id: 'static', label: 'Static' },
                { id: 'relative', label: 'Relative' },
                { id: 'absolute', label: 'Absolute' },
                { id: 'fixed', label: 'Fixed' },
                { id: 'sticky', label: 'Sticky' },
              ]},
              { property: 'top' },
              { property: 'right' },
              { property: 'bottom' },
              { property: 'left' },
              { property: 'z-index' },
            ],
          },
          {
            name: 'Typography',
            open: false,
            properties: [
              { property: 'font-family' },
              { property: 'font-size' },
              { property: 'font-weight' },
              { property: 'line-height' },
              { property: 'letter-spacing' },
              { property: 'text-align', type: 'radio', options: [
                { id: 'left', label: 'Left' },
                { id: 'center', label: 'Center' },
                { id: 'right', label: 'Right' },
                { id: 'justify', label: 'Justify' },
              ]},
              { property: 'color' },
              { property: 'text-decoration' },
              { property: 'text-transform' },
            ],
          },
          {
            name: 'Background',
            open: false,
            properties: [
              { property: 'background-color' },
              { property: 'background-image' },
              { property: 'background-repeat' },
              { property: 'background-position' },
              { property: 'background-size' },
            ],
          },
          {
            name: 'Borders',
            open: false,
            properties: [
              { property: 'border-radius' },
              { property: 'border-width' },
              { property: 'border-style' },
              { property: 'border-color' },
            ],
          },
          {
            name: 'Effects',
            open: false,
            properties: [
              { property: 'opacity' },
              { property: 'box-shadow' },
              { property: 'transform' },
              { property: 'transition' },
              { property: 'overflow' },
            ],
          },
        ],
      },
      traitManager: {
        appendTo: '#traits-container',
      },
    });

    // Add custom e-commerce blocks
    const blockManager = editor.Blocks;
    
    blockManager.add('hero-section', {
      label: 'Hero Section',
      category: 'Sections',
      content: `
        <section style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 80px 20px; text-align: center; color: white;">
          <div style="max-width: 800px; margin: 0 auto;">
            <h1 style="font-size: 48px; font-weight: 700; margin-bottom: 20px;">Welcome to Our Store</h1>
            <p style="font-size: 20px; margin-bottom: 30px; opacity: 0.9;">Discover amazing products at unbeatable prices</p>
            <a href="#" style="display: inline-block; background: white; color: #667eea; padding: 15px 40px; border-radius: 30px; text-decoration: none; font-weight: 600; transition: transform 0.2s;">Shop Now</a>
          </div>
        </section>
      `,
      media: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 5v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2zm2 0h14v8H5V5z"/></svg>',
    });

    blockManager.add('product-grid', {
      label: 'Product Grid',
      category: 'E-Commerce',
      content: `
        <section style="padding: 60px 20px; background: #f8f9fa;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <h2 style="text-align: center; font-size: 32px; margin-bottom: 40px;">Featured Products</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px;">
              <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="aspect-ratio: 1; background: #e9ecef; display: flex; align-items: center; justify-content: center;">
                  <span style="color: #adb5bd;">Product Image</span>
                </div>
                <div style="padding: 20px;">
                  <h3 style="font-size: 18px; margin-bottom: 8px;">Product Name</h3>
                  <p style="color: #667eea; font-size: 20px; font-weight: 600;">$99.00</p>
                </div>
              </div>
              <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="aspect-ratio: 1; background: #e9ecef; display: flex; align-items: center; justify-content: center;">
                  <span style="color: #adb5bd;">Product Image</span>
                </div>
                <div style="padding: 20px;">
                  <h3 style="font-size: 18px; margin-bottom: 8px;">Product Name</h3>
                  <p style="color: #667eea; font-size: 20px; font-weight: 600;">$99.00</p>
                </div>
              </div>
              <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="aspect-ratio: 1; background: #e9ecef; display: flex; align-items: center; justify-content: center;">
                  <span style="color: #adb5bd;">Product Image</span>
                </div>
                <div style="padding: 20px;">
                  <h3 style="font-size: 18px; margin-bottom: 8px;">Product Name</h3>
                  <p style="color: #667eea; font-size: 20px; font-weight: 600;">$99.00</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      `,
      media: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/></svg>',
    });

    blockManager.add('category-cards', {
      label: 'Category Cards',
      category: 'E-Commerce',
      content: `
        <section style="padding: 60px 20px;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <h2 style="text-align: center; font-size: 32px; margin-bottom: 40px;">Shop by Category</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
              <a href="#" style="text-decoration: none; color: inherit;">
                <div style="background: linear-gradient(45deg, #f093fb, #f5576c); padding: 40px 20px; border-radius: 16px; text-align: center; color: white;">
                  <h3 style="font-size: 24px;">Electronics</h3>
                </div>
              </a>
              <a href="#" style="text-decoration: none; color: inherit;">
                <div style="background: linear-gradient(45deg, #4facfe, #00f2fe); padding: 40px 20px; border-radius: 16px; text-align: center; color: white;">
                  <h3 style="font-size: 24px;">Fashion</h3>
                </div>
              </a>
              <a href="#" style="text-decoration: none; color: inherit;">
                <div style="background: linear-gradient(45deg, #43e97b, #38f9d7); padding: 40px 20px; border-radius: 16px; text-align: center; color: white;">
                  <h3 style="font-size: 24px;">Home</h3>
                </div>
              </a>
              <a href="#" style="text-decoration: none; color: inherit;">
                <div style="background: linear-gradient(45deg, #fa709a, #fee140); padding: 40px 20px; border-radius: 16px; text-align: center; color: white;">
                  <h3 style="font-size: 24px;">Beauty</h3>
                </div>
              </a>
            </div>
          </div>
        </section>
      `,
      media: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M10 4H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 6H4V6h6v4zm10-6h-6c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 6h-6V6h6v4zM10 12H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zm0 6H4v-4h6v4zm10-6h-6c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zm0 6h-6v-4h6v4z"/></svg>',
    });

    blockManager.add('testimonials', {
      label: 'Testimonials',
      category: 'Sections',
      content: `
        <section style="padding: 80px 20px; background: #f8f9fa;">
          <div style="max-width: 1000px; margin: 0 auto; text-align: center;">
            <h2 style="font-size: 32px; margin-bottom: 50px;">What Our Customers Say</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
              <div style="background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <p style="font-size: 18px; color: #555; margin-bottom: 20px; font-style: italic;">"Amazing quality and fast shipping. Will definitely order again!"</p>
                <p style="font-weight: 600;">- Happy Customer</p>
              </div>
              <div style="background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <p style="font-size: 18px; color: #555; margin-bottom: 20px; font-style: italic;">"Best online shopping experience I've ever had. Highly recommended!"</p>
                <p style="font-weight: 600;">- Satisfied Buyer</p>
              </div>
            </div>
          </div>
        </section>
      `,
      media: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>',
    });

    blockManager.add('cta-banner', {
      label: 'CTA Banner',
      category: 'Sections',
      content: `
        <section style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 60px 20px; text-align: center; color: white;">
          <div style="max-width: 800px; margin: 0 auto;">
            <h2 style="font-size: 36px; margin-bottom: 15px;">Limited Time Offer!</h2>
            <p style="font-size: 20px; margin-bottom: 25px; opacity: 0.9;">Get 20% off on your first order. Use code: WELCOME20</p>
            <a href="#" style="display: inline-block; background: #e94560; color: white; padding: 15px 40px; border-radius: 30px; text-decoration: none; font-weight: 600;">Shop Now</a>
          </div>
        </section>
      `,
      media: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-2h2v-4h4v-2h-4V7h-2v4H8v2h4z"/></svg>',
    });

    blockManager.add('newsletter', {
      label: 'Newsletter',
      category: 'Sections',
      content: `
        <section style="padding: 60px 20px; background: #667eea;">
          <div style="max-width: 600px; margin: 0 auto; text-align: center; color: white;">
            <h2 style="font-size: 28px; margin-bottom: 15px;">Subscribe to Our Newsletter</h2>
            <p style="margin-bottom: 25px; opacity: 0.9;">Get the latest updates on new products and upcoming sales</p>
            <form style="display: flex; gap: 10px; max-width: 400px; margin: 0 auto;">
              <input type="email" placeholder="Enter your email" style="flex: 1; padding: 15px 20px; border: none; border-radius: 30px; font-size: 16px;">
              <button type="submit" style="background: #1a1a2e; color: white; padding: 15px 30px; border: none; border-radius: 30px; font-weight: 600; cursor: pointer;">Subscribe</button>
            </form>
          </div>
        </section>
      `,
      media: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
    });

    blockManager.add('features-grid', {
      label: 'Features Grid',
      category: 'Sections',
      content: `
        <section style="padding: 80px 20px;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <h2 style="text-align: center; font-size: 32px; margin-bottom: 50px;">Why Choose Us</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 40px;">
              <div style="text-align: center;">
                <div style="width: 80px; height: 80px; background: #e3f2fd; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 32px;">🚚</span>
                </div>
                <h3 style="font-size: 20px; margin-bottom: 10px;">Free Shipping</h3>
                <p style="color: #666;">Free shipping on orders over $50</p>
              </div>
              <div style="text-align: center;">
                <div style="width: 80px; height: 80px; background: #e8f5e9; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 32px;">🔒</span>
                </div>
                <h3 style="font-size: 20px; margin-bottom: 10px;">Secure Payment</h3>
                <p style="color: #666;">100% secure payment methods</p>
              </div>
              <div style="text-align: center;">
                <div style="width: 80px; height: 80px; background: #fff3e0; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 32px;">↩️</span>
                </div>
                <h3 style="font-size: 20px; margin-bottom: 10px;">Easy Returns</h3>
                <p style="color: #666;">30-day return policy</p>
              </div>
              <div style="text-align: center;">
                <div style="width: 80px; height: 80px; background: #fce4ec; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 32px;">💬</span>
                </div>
                <h3 style="font-size: 20px; margin-bottom: 10px;">24/7 Support</h3>
                <p style="color: #666;">Round-the-clock customer support</p>
              </div>
            </div>
          </div>
        </section>
      `,
      media: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>',
    });

    blockManager.add('image-banner', {
      label: 'Image Banner',
      category: 'Sections',
      content: `
        <section style="position: relative; height: 400px; background: url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920') center/cover; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.5);"></div>
          <div style="position: relative; z-index: 1; text-align: center; color: white; padding: 20px;">
            <h2 style="font-size: 48px; margin-bottom: 20px;">New Collection</h2>
            <p style="font-size: 20px; margin-bottom: 30px;">Explore our latest arrivals</p>
            <a href="#" style="display: inline-block; background: white; color: #333; padding: 15px 40px; border-radius: 5px; text-decoration: none; font-weight: 600;">Explore Now</a>
          </div>
        </section>
      `,
      media: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>',
    });

    // Load existing content
    if (existingLayout) {
      const draftData = existingLayout.draft_data as any;
      const publishedData = existingLayout.layout_data as any;
      const dataToLoad = draftData || publishedData;
      
      if (dataToLoad?.type === 'grapesjs' && dataToLoad.projectData) {
        editor.loadProjectData(dataToLoad.projectData);
      } else if (dataToLoad?.type === 'grapesjs' && dataToLoad.html) {
        editor.setComponents(dataToLoad.html);
        if (dataToLoad.css) {
          editor.setStyle(dataToLoad.css);
        }
      }
    }

    // Track changes
    editor.on('change:changesCount', () => {
      setIsDirty(true);
    });

    editorRef.current = editor;
    setIsReady(true);

    return () => {
      editor.destroy();
      styleEl.remove();
    };
  }, [tenantId, isLoading, existingLayout]);

  // Device switching
  useEffect(() => {
    if (!editorRef.current) return;
    const deviceMap = { desktop: 'desktop', tablet: 'tablet', mobile: 'mobile' };
    editorRef.current.setDevice(deviceMap[deviceMode]);
  }, [deviceMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  if (!tenantId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">No tenant specified</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b bg-card flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="h-6 w-px bg-border" />
          <span className="font-semibold">GrapesJS Page Builder</span>
          {isDirty && <span className="text-xs text-muted-foreground">(unsaved changes)</span>}
        </div>

        <div className="flex items-center gap-2">
          {/* Device toggles */}
          <div className="flex items-center border rounded-md p-1 bg-muted/50">
            <Button
              variant={deviceMode === 'desktop' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setDeviceMode('desktop')}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={deviceMode === 'tablet' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setDeviceMode('tablet')}
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant={deviceMode === 'mobile' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setDeviceMode('mobile')}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editorRef.current?.UndoManager.undo()}
            disabled={!isReady}
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editorRef.current?.UndoManager.redo()}
            disabled={!isReady}
          >
            <Redo2 className="w-4 h-4" />
          </Button>

          <div className="h-6 w-px bg-border" />

          <Button variant="ghost" size="sm" onClick={handlePreview} disabled={!isReady}>
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!isReady || saveMutation.isPending}
          >
            <Save className="w-4 h-4 mr-1" />
            Save Draft
          </Button>
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={!isReady || publishMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            <Upload className="w-4 h-4 mr-1" />
            Publish
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Blocks */}
        <div className="w-64 border-r bg-card flex flex-col overflow-hidden">
          <div className="p-3 border-b">
            <h3 className="font-semibold text-sm">Blocks</h3>
          </div>
          <div id="blocks-container" className="flex-1 overflow-y-auto p-2" />
        </div>

        {/* Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div ref={containerRef} className="flex-1" />
        </div>

        {/* Right sidebar - Styles/Layers/Traits */}
        <div className="w-72 border-l bg-card flex flex-col overflow-hidden">
          <div className="flex border-b">
            <button
              className="flex-1 px-4 py-3 text-sm font-medium border-b-2 border-primary text-primary"
            >
              Styles
            </button>
            <button
              className="flex-1 px-4 py-3 text-sm font-medium text-muted-foreground"
              onClick={() => {
                // Switch to layers view
              }}
            >
              Properties
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {/* Selector Manager */}
            <div id="selectors-container" className="border-b" />
            
            {/* Style Manager */}
            <div id="styles-container" />
            
            {/* Trait Manager */}
            <div id="traits-container" className="border-t" />
          </div>
          
          {/* Layers */}
          <div className="border-t">
            <div className="p-3 border-b">
              <h3 className="font-semibold text-sm">Layers</h3>
            </div>
            <div id="layers-container" className="max-h-48 overflow-y-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
