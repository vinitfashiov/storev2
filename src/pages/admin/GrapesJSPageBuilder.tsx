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
import gjsParserPostcss from 'grapesjs-parser-postcss';
import gjsTouch from 'grapesjs-touch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, Save, Upload, Eye, Undo2, Redo2, Monitor, Tablet, Smartphone,
  Code, Layers, Settings, Paintbrush, RotateCcw, Maximize, Download, FileCode
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Custom GrapesJS styles - Dark theme like GrapesJS Studio
const customStyles = `
  /* Main editor container */
  .gjs-editor {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
  }
  
  .gjs-one-bg {
    background-color: #1a1a2e !important;
  }
  .gjs-two-color {
    color: #eaeaea !important;
  }
  .gjs-three-bg {
    background-color: #16213e !important;
  }
  .gjs-four-color, .gjs-four-color-h:hover {
    color: #6366f1 !important;
  }
  
  /* Panels */
  .gjs-pn-panel {
    background-color: #1a1a2e !important;
    border-color: #2d2d44 !important;
  }
  .gjs-pn-views-container {
    background-color: #1a1a2e !important;
    border-left: 1px solid #2d2d44 !important;
  }
  .gjs-pn-views {
    border-bottom: 1px solid #2d2d44 !important;
  }
  .gjs-pn-btn {
    color: #a0a0a0 !important;
    border-radius: 4px !important;
    margin: 2px !important;
  }
  .gjs-pn-btn:hover {
    background-color: #2d2d44 !important;
    color: #fff !important;
  }
  .gjs-pn-btn.gjs-pn-active {
    color: #6366f1 !important;
    background-color: rgba(99, 102, 241, 0.15) !important;
  }
  
  /* Blocks */
  .gjs-block {
    background-color: #16213e !important;
    border: 1px solid #2d2d44 !important;
    border-radius: 8px !important;
    color: #eaeaea !important;
    min-height: 70px !important;
    transition: all 0.2s ease !important;
  }
  .gjs-block:hover {
    border-color: #6366f1 !important;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3) !important;
    transform: translateY(-2px) !important;
  }
  .gjs-block__media {
    color: #6366f1 !important;
  }
  .gjs-block-label {
    color: #a0a0a0 !important;
    font-size: 11px !important;
    font-weight: 500 !important;
  }
  .gjs-blocks-c {
    padding: 12px !important;
    gap: 10px !important;
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
  }
  
  /* Categories */
  .gjs-block-category {
    background-color: #1a1a2e !important;
    border-bottom: 1px solid #2d2d44 !important;
  }
  .gjs-category-title, .gjs-layer-title, .gjs-sm-sector-title {
    background-color: #16213e !important;
    color: #eaeaea !important;
    border-color: #2d2d44 !important;
    font-weight: 600 !important;
    font-size: 12px !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
    padding: 12px !important;
  }
  .gjs-title {
    background-color: transparent !important;
    color: #a0a0a0 !important;
  }
  
  /* Style Manager */
  .gjs-sm-sector {
    border-color: #2d2d44 !important;
    background-color: #1a1a2e !important;
  }
  .gjs-sm-property {
    color: #a0a0a0 !important;
    font-size: 12px !important;
  }
  .gjs-sm-label {
    color: #a0a0a0 !important;
  }
  
  /* Fields */
  .gjs-field {
    background-color: #16213e !important;
    border: 1px solid #2d2d44 !important;
    color: #eaeaea !important;
    border-radius: 6px !important;
    transition: border-color 0.2s !important;
  }
  .gjs-field:focus-within {
    border-color: #6366f1 !important;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2) !important;
  }
  .gjs-field input, .gjs-field select, .gjs-field textarea {
    color: #eaeaea !important;
    background: transparent !important;
  }
  .gjs-field-arrows {
    color: #a0a0a0 !important;
  }
  
  /* Selectors */
  .gjs-clm-tags {
    background-color: #16213e !important;
    border-radius: 6px !important;
    padding: 8px !important;
  }
  .gjs-clm-tag {
    background-color: #6366f1 !important;
    color: white !important;
    border-radius: 4px !important;
    padding: 4px 8px !important;
    font-size: 11px !important;
  }
  .gjs-clm-tag #gjs-clm-close {
    color: white !important;
  }
  .gjs-clm-sels-info {
    color: #a0a0a0 !important;
    font-size: 11px !important;
  }
  
  /* Layers */
  .gjs-layers {
    background-color: #1a1a2e !important;
  }
  .gjs-layer {
    background-color: #16213e !important;
    border-color: #2d2d44 !important;
    color: #a0a0a0 !important;
  }
  .gjs-layer:hover {
    background-color: #1e2745 !important;
  }
  .gjs-layer.gjs-selected {
    background-color: rgba(99, 102, 241, 0.2) !important;
  }
  .gjs-layer-title {
    background-color: transparent !important;
  }
  .gjs-layer-name {
    color: #eaeaea !important;
  }
  
  /* Canvas */
  .gjs-cv-canvas {
    background-color: #0f0f1a !important;
    padding: 20px !important;
  }
  .gjs-frame-wrapper {
    background-color: white !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
    border-radius: 8px !important;
    overflow: hidden !important;
  }
  
  /* Toolbar */
  .gjs-toolbar {
    background-color: #1a1a2e !important;
    border-radius: 8px !important;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4) !important;
    border: 1px solid #2d2d44 !important;
    padding: 4px !important;
  }
  .gjs-toolbar-item {
    color: #eaeaea !important;
    padding: 6px !important;
    border-radius: 4px !important;
  }
  .gjs-toolbar-item:hover {
    background-color: #2d2d44 !important;
  }
  
  /* RTE */
  .gjs-rte-toolbar {
    background-color: #1a1a2e !important;
    border-radius: 8px !important;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4) !important;
    border: 1px solid #2d2d44 !important;
  }
  .gjs-rte-action {
    color: #eaeaea !important;
    border-radius: 4px !important;
  }
  .gjs-rte-action:hover {
    background-color: #2d2d44 !important;
  }
  
  /* Selection & highlighting */
  .gjs-selected {
    outline: 2px solid #6366f1 !important;
    outline-offset: -2px !important;
  }
  .gjs-highlighter {
    outline: 2px dashed rgba(99, 102, 241, 0.6) !important;
  }
  .gjs-badge {
    background-color: #6366f1 !important;
    color: white !important;
    border-radius: 4px !important;
    font-size: 10px !important;
    padding: 3px 8px !important;
    font-weight: 600 !important;
  }
  .gjs-resizer-h {
    border-color: #6366f1 !important;
  }
  
  /* Color picker */
  .sp-container {
    background-color: #1a1a2e !important;
    border: 1px solid #2d2d44 !important;
    border-radius: 8px !important;
  }
  .sp-input {
    background-color: #16213e !important;
    color: #eaeaea !important;
    border-color: #2d2d44 !important;
  }
  
  /* Modals */
  .gjs-mdl-dialog {
    background-color: #1a1a2e !important;
    border-radius: 12px !important;
    color: #eaeaea !important;
    border: 1px solid #2d2d44 !important;
    max-width: 90vw !important;
    max-height: 90vh !important;
  }
  .gjs-mdl-header {
    background-color: #16213e !important;
    border-radius: 12px 12px 0 0 !important;
    border-bottom: 1px solid #2d2d44 !important;
  }
  .gjs-mdl-title {
    color: #eaeaea !important;
    font-weight: 600 !important;
    font-size: 16px !important;
  }
  .gjs-mdl-content {
    padding: 20px !important;
  }
  .gjs-mdl-btn-close {
    color: #a0a0a0 !important;
  }
  
  /* Asset Manager */
  .gjs-am-assets-cont {
    background-color: #16213e !important;
    border-radius: 8px !important;
  }
  .gjs-am-asset {
    background-color: #1a1a2e !important;
    border-radius: 8px !important;
    border: 1px solid #2d2d44 !important;
  }
  .gjs-am-asset:hover {
    border-color: #6366f1 !important;
  }
  .gjs-am-file-uploader {
    background-color: #16213e !important;
    border: 2px dashed #2d2d44 !important;
    border-radius: 8px !important;
    color: #a0a0a0 !important;
  }
  
  /* Commands bar */
  .gjs-com-badge {
    background-color: #6366f1 !important;
  }
  
  /* Custom code editor */
  .gjs-cm-editor {
    background-color: #0f0f1a !important;
    border-radius: 8px !important;
  }
  .gjs-cm-editor textarea {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
  }
  .CodeMirror {
    background-color: #0f0f1a !important;
    color: #eaeaea !important;
    height: 100% !important;
  }
  .CodeMirror-gutters {
    background-color: #16213e !important;
    border-right: 1px solid #2d2d44 !important;
  }
  .CodeMirror-linenumber {
    color: #666 !important;
  }
  
  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 8px !important;
    height: 8px !important;
  }
  ::-webkit-scrollbar-track {
    background: #16213e !important;
  }
  ::-webkit-scrollbar-thumb {
    background: #2d2d44 !important;
    border-radius: 4px !important;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #3d3d5c !important;
  }
  
  /* Import modal improvements */
  .gjs-import-label {
    color: #a0a0a0 !important;
    margin-bottom: 10px !important;
  }
  
  /* Radio buttons */
  .gjs-radio-item input:checked + .gjs-radio-item-label {
    background-color: #6366f1 !important;
    color: white !important;
  }
  
  /* Traits */
  .gjs-trt-trait {
    color: #a0a0a0 !important;
    border-bottom: 1px solid #2d2d44 !important;
    padding: 10px !important;
  }
  .gjs-trt-trait__wrp-name {
    color: #eaeaea !important;
  }
`;

// External resources to load in canvas
const canvasExternalStyles = [
  // Google Fonts
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&family=Roboto:wght@300;400;500;700;900&family=Open+Sans:wght@300;400;500;600;700;800&family=Montserrat:wght@300;400;500;600;700;800;900&family=Lato:wght@300;400;700;900&family=Playfair+Display:wght@400;500;600;700;800;900&display=swap',
  // Font Awesome
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  // Bootstrap (optional - for Bootstrap-based designs)
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  // Tailwind CSS CDN (for Tailwind-based designs)
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  // Animate.css
  'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css',
  // Boxicons
  'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css',
  // Material Icons
  'https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined|Material+Icons+Round',
  // Remixicon
  'https://cdn.jsdelivr.net/npm/remixicon@4.0.0/fonts/remixicon.css',
];

const canvasExternalScripts = [
  // Bootstrap JS
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
];

export default function GrapesJSPageBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenant');
  const editorRef = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'styles' | 'layers' | 'traits'>('styles');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importCode, setImportCode] = useState({ html: '', css: '' });
  const [isFullscreen, setIsFullscreen] = useState(false);
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
    
    const externalCss = canvasExternalStyles.map(url => `<link rel="stylesheet" href="${url}">`).join('\n');
    const externalJs = canvasExternalScripts.map(url => `<script src="${url}"></script>`).join('\n');
    
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Preview</title>
            ${externalCss}
            <style>
              * { box-sizing: border-box; }
              body { margin: 0; padding: 0; }
              ${css}
            </style>
          </head>
          <body>
            ${html}
            ${externalJs}
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
  }, []);

  const handleClearCanvas = useCallback(() => {
    if (!editorRef.current) return;
    if (confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
      editorRef.current.DomComponents.clear();
      editorRef.current.CssComposer.clear();
      setIsDirty(true);
      toast.success('Canvas cleared');
    }
  }, []);

  const handleImportCode = useCallback(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    
    if (importCode.html.trim()) {
      editor.DomComponents.clear();
      editor.setComponents(importCode.html);
    }
    
    if (importCode.css.trim()) {
      editor.setStyle(importCode.css);
    }
    
    setIsImportDialogOpen(false);
    setImportCode({ html: '', css: '' });
    setIsDirty(true);
    toast.success('Code imported successfully!');
  }, [importCode]);

  const handleExportCode = useCallback(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    const html = editor.getHtml();
    const css = editor.getCss();
    
    const externalCss = canvasExternalStyles.map(url => `<link rel="stylesheet" href="${url}">`).join('\n    ');
    const externalJs = canvasExternalScripts.map(url => `<script src="${url}"></script>`).join('\n    ');
    
    const fullCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Page</title>
    ${externalCss}
    <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; }
    ${css}
    </style>
</head>
<body>
${html}
${externalJs}
</body>
</html>`;

    const blob = new Blob([fullCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'page.html';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Page exported!');
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
        gjsParserPostcss,
        gjsTouch,
      ],
      pluginsOpts: {
        [gjsBlocksBasic as any]: {
          flexGrid: true,
          stylePrefix: 'gjs-',
        },
        [gjsPresetWebpage as any]: {
          modalImportTitle: 'Import HTML/CSS',
          modalImportLabel: '<div style="margin-bottom: 10px; color: #a0a0a0;">Paste your HTML code below. CSS styles will be extracted automatically.</div>',
          modalImportContent: '',
          filestackOpts: null,
          aviaryOpts: false,
          blocksBasicOpts: { flexGrid: true },
        },
        [gjsPluginForms as any]: {},
        [gjsCustomCode as any]: {
          blockLabel: 'Custom HTML/CSS',
          modalTitle: 'Insert Custom Code',
          buttonLabel: 'Save',
        },
        [gjsTabs as any]: {},
        [gjsTooltip as any]: {},
        [gjsTyped as any]: {},
        [gjsParserPostcss as any]: {},
        [gjsTouch as any]: {},
      },
      canvas: {
        styles: canvasExternalStyles,
        scripts: canvasExternalScripts,
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
                { id: 'inline-flex', label: 'Inline Flex' },
                { id: 'none', label: 'None' },
              ]},
              { type: 'select', property: 'flex-direction', options: [
                { id: 'row', label: 'Row' },
                { id: 'row-reverse', label: 'Row Reverse' },
                { id: 'column', label: 'Column' },
                { id: 'column-reverse', label: 'Column Reverse' },
              ]},
              { type: 'select', property: 'flex-wrap', options: [
                { id: 'nowrap', label: 'No Wrap' },
                { id: 'wrap', label: 'Wrap' },
                { id: 'wrap-reverse', label: 'Wrap Reverse' },
              ]},
              { type: 'select', property: 'justify-content', options: [
                { id: 'flex-start', label: 'Start' },
                { id: 'flex-end', label: 'End' },
                { id: 'center', label: 'Center' },
                { id: 'space-between', label: 'Space Between' },
                { id: 'space-around', label: 'Space Around' },
                { id: 'space-evenly', label: 'Space Evenly' },
              ]},
              { type: 'select', property: 'align-items', options: [
                { id: 'flex-start', label: 'Start' },
                { id: 'flex-end', label: 'End' },
                { id: 'center', label: 'Center' },
                { id: 'stretch', label: 'Stretch' },
                { id: 'baseline', label: 'Baseline' },
              ]},
              { type: 'select', property: 'align-content', options: [
                { id: 'flex-start', label: 'Start' },
                { id: 'flex-end', label: 'End' },
                { id: 'center', label: 'Center' },
                { id: 'space-between', label: 'Space Between' },
                { id: 'space-around', label: 'Space Around' },
                { id: 'stretch', label: 'Stretch' },
              ]},
              { property: 'gap' },
              { property: 'order' },
              { property: 'flex-grow' },
              { property: 'flex-shrink' },
              { property: 'flex-basis' },
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
              { type: 'select', property: 'float', options: [
                { id: 'none', label: 'None' },
                { id: 'left', label: 'Left' },
                { id: 'right', label: 'Right' },
              ]},
              { type: 'select', property: 'clear', options: [
                { id: 'none', label: 'None' },
                { id: 'left', label: 'Left' },
                { id: 'right', label: 'Right' },
                { id: 'both', label: 'Both' },
              ]},
            ],
          },
          {
            name: 'Typography',
            open: false,
            properties: [
              { property: 'font-family' },
              { property: 'font-size' },
              { property: 'font-weight' },
              { property: 'font-style' },
              { property: 'line-height' },
              { property: 'letter-spacing' },
              { property: 'word-spacing' },
              { property: 'text-align', type: 'radio', options: [
                { id: 'left', label: 'Left' },
                { id: 'center', label: 'Center' },
                { id: 'right', label: 'Right' },
                { id: 'justify', label: 'Justify' },
              ]},
              { property: 'color' },
              { property: 'text-decoration' },
              { property: 'text-transform' },
              { property: 'text-shadow' },
              { property: 'white-space' },
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
              { property: 'background-attachment' },
              { property: 'background' },
            ],
          },
          {
            name: 'Borders',
            open: false,
            properties: [
              { property: 'border-radius' },
              { property: 'border-top-left-radius' },
              { property: 'border-top-right-radius' },
              { property: 'border-bottom-left-radius' },
              { property: 'border-bottom-right-radius' },
              { property: 'border-width' },
              { property: 'border-style' },
              { property: 'border-color' },
              { property: 'border' },
            ],
          },
          {
            name: 'Effects',
            open: false,
            properties: [
              { property: 'opacity' },
              { property: 'box-shadow' },
              { property: 'filter' },
              { property: 'backdrop-filter' },
              { property: 'mix-blend-mode' },
              { property: 'cursor' },
            ],
          },
          {
            name: 'Transform',
            open: false,
            properties: [
              { property: 'transform' },
              { property: 'transform-origin' },
              { property: 'perspective' },
            ],
          },
          {
            name: 'Transition & Animation',
            open: false,
            properties: [
              { property: 'transition' },
              { property: 'transition-property' },
              { property: 'transition-duration' },
              { property: 'transition-timing-function' },
              { property: 'animation' },
              { property: 'animation-name' },
              { property: 'animation-duration' },
            ],
          },
          {
            name: 'Overflow',
            open: false,
            properties: [
              { type: 'select', property: 'overflow', options: [
                { id: 'visible', label: 'Visible' },
                { id: 'hidden', label: 'Hidden' },
                { id: 'scroll', label: 'Scroll' },
                { id: 'auto', label: 'Auto' },
              ]},
              { type: 'select', property: 'overflow-x', options: [
                { id: 'visible', label: 'Visible' },
                { id: 'hidden', label: 'Hidden' },
                { id: 'scroll', label: 'Scroll' },
                { id: 'auto', label: 'Auto' },
              ]},
              { type: 'select', property: 'overflow-y', options: [
                { id: 'visible', label: 'Visible' },
                { id: 'hidden', label: 'Hidden' },
                { id: 'scroll', label: 'Scroll' },
                { id: 'auto', label: 'Auto' },
              ]},
            ],
          },
        ],
      },
      traitManager: {
        appendTo: '#traits-container',
      },
      assetManager: {
        embedAsBase64: true,
        multiUpload: true,
        showUrlInput: true,
        uploadFile: undefined,
      },
    });

    // Add custom e-commerce blocks with better HTML
    const blockManager = editor.Blocks;
    
    // Custom HTML/CSS Block - This is the main one the user wants!
    blockManager.add('custom-html-css', {
      label: 'HTML/CSS Block',
      category: 'Custom Code',
      content: {
        type: 'custom-code',
        content: `<!-- Paste your custom HTML here -->
<div class="custom-section">
  <h2>Custom Section</h2>
  <p>Add your custom HTML/CSS code here. It supports:</p>
  <ul>
    <li><i class="fas fa-check"></i> Font Awesome Icons</li>
    <li><i class="fas fa-check"></i> Bootstrap Classes</li>
    <li><i class="fas fa-check"></i> Tailwind CSS</li>
    <li><i class="fas fa-check"></i> Custom Styles</li>
  </ul>
</div>
<style>
  .custom-section {
    padding: 40px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    text-align: center;
  }
  .custom-section ul {
    list-style: none;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
    margin-top: 20px;
  }
  .custom-section li {
    display: flex;
    align-items: center;
    gap: 8px;
  }
</style>`,
      },
      media: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>`,
    });

    // Hero Section with Icons
    blockManager.add('hero-section', {
      label: 'Hero Section',
      category: 'Sections',
      content: `
        <section class="hero-section" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 100px 20px; text-align: center; color: white; position: relative; overflow: hidden;">
          <div style="position: absolute; inset: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"grid\" width=\"10\" height=\"10\" patternUnits=\"userSpaceOnUse\"><path d=\"M 10 0 L 0 0 0 10\" fill=\"none\" stroke=\"rgba(255,255,255,0.05)\" stroke-width=\"0.5\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23grid)\"/></svg>');"></div>
          <div style="max-width: 900px; margin: 0 auto; position: relative; z-index: 1;">
            <span style="display: inline-block; background: rgba(255,255,255,0.2); padding: 8px 20px; border-radius: 50px; font-size: 14px; margin-bottom: 20px;">
              <i class="fas fa-sparkles"></i> Welcome to Our Store
            </span>
            <h1 style="font-size: 56px; font-weight: 800; margin-bottom: 24px; line-height: 1.1;">
              Discover Amazing Products
            </h1>
            <p style="font-size: 20px; margin-bottom: 40px; opacity: 0.9; max-width: 600px; margin-left: auto; margin-right: auto;">
              Shop the latest trends with unbeatable prices and fast delivery to your doorstep.
            </p>
            <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
              <a href="#" style="display: inline-flex; align-items: center; gap: 8px; background: white; color: #667eea; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                <i class="fas fa-shopping-bag"></i> Shop Now
              </a>
              <a href="#" style="display: inline-flex; align-items: center; gap: 8px; background: transparent; color: white; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; border: 2px solid white;">
                <i class="fas fa-play-circle"></i> Learn More
              </a>
            </div>
          </div>
        </section>
      `,
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 5v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2zm2 0h14v8H5V5z"/></svg>',
    });

    // Product Grid with Hover Effects
    blockManager.add('product-grid', {
      label: 'Product Grid',
      category: 'E-Commerce',
      content: `
        <section style="padding: 80px 20px; background: #f8fafc;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 50px;">
              <span style="color: #667eea; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; font-size: 14px;">Our Products</span>
              <h2 style="font-size: 42px; font-weight: 700; margin: 10px 0; color: #1e293b;">Featured Collection</h2>
              <p style="color: #64748b; max-width: 600px; margin: 0 auto;">Discover our handpicked selection of premium products</p>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px;">
              <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transition: transform 0.3s, box-shadow 0.3s;">
                <div style="aspect-ratio: 1; background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); display: flex; align-items: center; justify-content: center; position: relative;">
                  <i class="fas fa-tshirt" style="font-size: 64px; color: #6366f1;"></i>
                  <span style="position: absolute; top: 16px; left: 16px; background: #ef4444; color: white; padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: 600;">SALE</span>
                </div>
                <div style="padding: 24px;">
                  <p style="color: #64748b; font-size: 14px; margin-bottom: 4px;">Category</p>
                  <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #1e293b;">Premium Product</h3>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="color: #6366f1; font-size: 24px; font-weight: 700;">$79.00</span>
                    <span style="color: #94a3b8; text-decoration: line-through;">$99.00</span>
                  </div>
                  <button style="width: 100%; margin-top: 16px; background: #6366f1; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                  </button>
                </div>
              </div>
              <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transition: transform 0.3s, box-shadow 0.3s;">
                <div style="aspect-ratio: 1; background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%); display: flex; align-items: center; justify-content: center;">
                  <i class="fas fa-gem" style="font-size: 64px; color: #ec4899;"></i>
                </div>
                <div style="padding: 24px;">
                  <p style="color: #64748b; font-size: 14px; margin-bottom: 4px;">Category</p>
                  <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #1e293b;">Luxury Item</h3>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="color: #6366f1; font-size: 24px; font-weight: 700;">$149.00</span>
                  </div>
                  <button style="width: 100%; margin-top: 16px; background: #6366f1; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                  </button>
                </div>
              </div>
              <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transition: transform 0.3s, box-shadow 0.3s;">
                <div style="aspect-ratio: 1; background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); display: flex; align-items: center; justify-content: center;">
                  <i class="fas fa-leaf" style="font-size: 64px; color: #10b981;"></i>
                </div>
                <div style="padding: 24px;">
                  <p style="color: #64748b; font-size: 14px; margin-bottom: 4px;">Category</p>
                  <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #1e293b;">Organic Product</h3>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="color: #6366f1; font-size: 24px; font-weight: 700;">$59.00</span>
                  </div>
                  <button style="width: 100%; margin-top: 16px; background: #6366f1; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      `,
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/></svg>',
    });

    // Features Grid with Icons
    blockManager.add('features-grid', {
      label: 'Features Grid',
      category: 'Sections',
      content: `
        <section style="padding: 80px 20px; background: white;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 60px;">
              <h2 style="font-size: 42px; font-weight: 700; color: #1e293b; margin-bottom: 16px;">Why Choose Us</h2>
              <p style="color: #64748b; font-size: 18px;">We provide the best shopping experience</p>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 40px;">
              <div style="text-align: center; padding: 32px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                  <i class="fas fa-shipping-fast" style="font-size: 32px; color: #3b82f6;"></i>
                </div>
                <h3 style="font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 12px;">Free Shipping</h3>
                <p style="color: #64748b; line-height: 1.6;">Free shipping on all orders over $50. Fast and reliable delivery.</p>
              </div>
              <div style="text-align: center; padding: 32px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                  <i class="fas fa-shield-alt" style="font-size: 32px; color: #22c55e;"></i>
                </div>
                <h3 style="font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 12px;">Secure Payment</h3>
                <p style="color: #64748b; line-height: 1.6;">100% secure payment methods. Your data is protected.</p>
              </div>
              <div style="text-align: center; padding: 32px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                  <i class="fas fa-undo-alt" style="font-size: 32px; color: #f59e0b;"></i>
                </div>
                <h3 style="font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 12px;">Easy Returns</h3>
                <p style="color: #64748b; line-height: 1.6;">30-day return policy. No questions asked.</p>
              </div>
              <div style="text-align: center; padding: 32px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                  <i class="fas fa-headset" style="font-size: 32px; color: #ec4899;"></i>
                </div>
                <h3 style="font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 12px;">24/7 Support</h3>
                <p style="color: #64748b; line-height: 1.6;">Round-the-clock customer support team ready to help.</p>
              </div>
            </div>
          </div>
        </section>
      `,
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    });

    // Testimonials with Stars
    blockManager.add('testimonials', {
      label: 'Testimonials',
      category: 'Sections',
      content: `
        <section style="padding: 80px 20px; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: white;">
          <div style="max-width: 1000px; margin: 0 auto; text-align: center;">
            <span style="color: #a5b4fc; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; font-size: 14px;">Testimonials</span>
            <h2 style="font-size: 42px; font-weight: 700; margin: 16px 0 50px;">What Our Customers Say</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
              <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 32px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
                <div style="color: #fbbf24; margin-bottom: 16px; font-size: 20px;">
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                </div>
                <p style="font-size: 18px; line-height: 1.7; margin-bottom: 24px; font-style: italic; opacity: 0.9;">"Amazing quality and super fast shipping! Will definitely order again. The customer service was exceptional."</p>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 48px; height: 48px; background: #6366f1; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-user" style="color: white;"></i>
                  </div>
                  <div style="text-align: left;">
                    <p style="font-weight: 600; margin: 0;">Sarah Johnson</p>
                    <p style="opacity: 0.7; font-size: 14px; margin: 0;">Verified Buyer</p>
                  </div>
                </div>
              </div>
              <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 32px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
                <div style="color: #fbbf24; margin-bottom: 16px; font-size: 20px;">
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                </div>
                <p style="font-size: 18px; line-height: 1.7; margin-bottom: 24px; font-style: italic; opacity: 0.9;">"Best online shopping experience I've ever had. The products exceeded my expectations in every way."</p>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 48px; height: 48px; background: #ec4899; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-user" style="color: white;"></i>
                  </div>
                  <div style="text-align: left;">
                    <p style="font-weight: 600; margin: 0;">Michael Chen</p>
                    <p style="opacity: 0.7; font-size: 14px; margin: 0;">Verified Buyer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      `,
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>',
    });

    // Newsletter Section
    blockManager.add('newsletter', {
      label: 'Newsletter',
      category: 'Sections',
      content: `
        <section style="padding: 80px 20px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);">
          <div style="max-width: 600px; margin: 0 auto; text-align: center; color: white;">
            <i class="fas fa-envelope-open-text" style="font-size: 48px; margin-bottom: 24px; opacity: 0.9;"></i>
            <h2 style="font-size: 36px; font-weight: 700; margin-bottom: 16px;">Subscribe to Our Newsletter</h2>
            <p style="margin-bottom: 32px; opacity: 0.9; font-size: 18px;">Get the latest updates on new products, exclusive offers, and more!</p>
            <form style="display: flex; gap: 12px; max-width: 450px; margin: 0 auto; flex-wrap: wrap; justify-content: center;">
              <input type="email" placeholder="Enter your email" style="flex: 1; min-width: 200px; padding: 16px 24px; border: none; border-radius: 50px; font-size: 16px; outline: none;">
              <button type="submit" style="background: #1e1b4b; color: white; padding: 16px 32px; border: none; border-radius: 50px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 16px;">
                <i class="fas fa-paper-plane"></i> Subscribe
              </button>
            </form>
            <p style="margin-top: 20px; font-size: 14px; opacity: 0.8;">
              <i class="fas fa-lock" style="margin-right: 6px;"></i> We respect your privacy. Unsubscribe anytime.
            </p>
          </div>
        </section>
      `,
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
    });

    // CTA Banner
    blockManager.add('cta-banner', {
      label: 'CTA Banner',
      category: 'Sections',
      content: `
        <section style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 80px 20px; text-align: center; color: white; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"none\" stroke=\"rgba(99,102,241,0.1)\" stroke-width=\"0.5\"/></svg>') repeat; opacity: 0.5;"></div>
          <div style="max-width: 800px; margin: 0 auto; position: relative; z-index: 1;">
            <span style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); padding: 8px 20px; border-radius: 50px; font-size: 14px; font-weight: 600; margin-bottom: 24px;">
              <i class="fas fa-fire"></i> Limited Time Offer
            </span>
            <h2 style="font-size: 48px; font-weight: 800; margin-bottom: 16px;">Get 30% Off Today!</h2>
            <p style="font-size: 20px; margin-bottom: 32px; opacity: 0.8;">Use code <span style="background: rgba(99,102,241,0.3); padding: 4px 12px; border-radius: 4px; font-weight: 600;">SAVE30</span> at checkout</p>
            <a href="#" style="display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 18px 40px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 18px; box-shadow: 0 10px 30px rgba(99,102,241,0.4);">
              <i class="fas fa-shopping-cart"></i> Shop Now
            </a>
          </div>
        </section>
      `,
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-2h2v-4h4v-2h-4V7h-2v4H8v2h4z"/></svg>',
    });

    // Footer Section
    blockManager.add('footer', {
      label: 'Footer',
      category: 'Sections',
      content: `
        <footer style="background: #0f172a; color: white; padding: 60px 20px 30px;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 40px; margin-bottom: 40px;">
              <div>
                <h3 style="font-size: 24px; font-weight: 700; margin-bottom: 20px;">YourBrand</h3>
                <p style="color: #94a3b8; line-height: 1.8; margin-bottom: 20px;">Premium quality products delivered to your doorstep.</p>
                <div style="display: flex; gap: 12px;">
                  <a href="#" style="width: 40px; height: 40px; background: #1e293b; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; text-decoration: none;">
                    <i class="fab fa-facebook-f"></i>
                  </a>
                  <a href="#" style="width: 40px; height: 40px; background: #1e293b; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; text-decoration: none;">
                    <i class="fab fa-twitter"></i>
                  </a>
                  <a href="#" style="width: 40px; height: 40px; background: #1e293b; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; text-decoration: none;">
                    <i class="fab fa-instagram"></i>
                  </a>
                </div>
              </div>
              <div>
                <h4 style="font-weight: 600; margin-bottom: 20px;">Quick Links</h4>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  <li style="margin-bottom: 12px;"><a href="#" style="color: #94a3b8; text-decoration: none;">About Us</a></li>
                  <li style="margin-bottom: 12px;"><a href="#" style="color: #94a3b8; text-decoration: none;">Products</a></li>
                  <li style="margin-bottom: 12px;"><a href="#" style="color: #94a3b8; text-decoration: none;">Contact</a></li>
                  <li style="margin-bottom: 12px;"><a href="#" style="color: #94a3b8; text-decoration: none;">Blog</a></li>
                </ul>
              </div>
              <div>
                <h4 style="font-weight: 600; margin-bottom: 20px;">Support</h4>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  <li style="margin-bottom: 12px;"><a href="#" style="color: #94a3b8; text-decoration: none;">FAQ</a></li>
                  <li style="margin-bottom: 12px;"><a href="#" style="color: #94a3b8; text-decoration: none;">Shipping</a></li>
                  <li style="margin-bottom: 12px;"><a href="#" style="color: #94a3b8; text-decoration: none;">Returns</a></li>
                  <li style="margin-bottom: 12px;"><a href="#" style="color: #94a3b8; text-decoration: none;">Privacy Policy</a></li>
                </ul>
              </div>
              <div>
                <h4 style="font-weight: 600; margin-bottom: 20px;">Contact</h4>
                <ul style="list-style: none; padding: 0; margin: 0; color: #94a3b8;">
                  <li style="margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-map-marker-alt"></i> 123 Street, City
                  </li>
                  <li style="margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-phone"></i> +1 234 567 890
                  </li>
                  <li style="margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-envelope"></i> hello@brand.com
                  </li>
                </ul>
              </div>
            </div>
            <div style="border-top: 1px solid #1e293b; padding-top: 30px; text-align: center; color: #64748b;">
              <p>© 2024 YourBrand. All rights reserved.</p>
            </div>
          </div>
        </footer>
      `,
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 18H6V8h10v10zm0-12H6V4h10v2zm4 14H4V2h16v18zm0-20H4c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2z"/></svg>',
    });

    // Image with Text Overlay
    blockManager.add('image-text-overlay', {
      label: 'Image + Text',
      category: 'Media',
      content: `
        <div style="position: relative; height: 500px; background: url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920') center/cover; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; inset: 0; background: linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%);"></div>
          <div style="position: relative; z-index: 1; text-align: center; color: white; padding: 40px; max-width: 800px;">
            <h2 style="font-size: 48px; font-weight: 700; margin-bottom: 20px;">New Collection</h2>
            <p style="font-size: 20px; margin-bottom: 30px; opacity: 0.9;">Explore our latest arrivals and find your perfect style</p>
            <a href="#" style="display: inline-flex; align-items: center; gap: 8px; background: white; color: #0f172a; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              <i class="fas fa-arrow-right"></i> Explore Now
            </a>
          </div>
        </div>
      `,
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>',
    });

    // Stats Counter
    blockManager.add('stats-counter', {
      label: 'Stats Counter',
      category: 'Sections',
      content: `
        <section style="padding: 60px 20px; background: #6366f1; color: white;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 30px; text-align: center;">
              <div>
                <div style="font-size: 48px; font-weight: 800; margin-bottom: 8px;">10K+</div>
                <div style="opacity: 0.8; font-size: 18px;">Happy Customers</div>
              </div>
              <div>
                <div style="font-size: 48px; font-weight: 800; margin-bottom: 8px;">500+</div>
                <div style="opacity: 0.8; font-size: 18px;">Products</div>
              </div>
              <div>
                <div style="font-size: 48px; font-weight: 800; margin-bottom: 8px;">50+</div>
                <div style="opacity: 0.8; font-size: 18px;">Countries</div>
              </div>
              <div>
                <div style="font-size: 48px; font-weight: 800; margin-bottom: 8px;">24/7</div>
                <div style="opacity: 0.8; font-size: 18px;">Support</div>
              </div>
            </div>
          </div>
        </section>
      `,
      media: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>',
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

  // Fullscreen toggle
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  if (!tenantId) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">No tenant specified</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "h-screen flex flex-col bg-[#0f0f1a] overflow-hidden",
      isFullscreen && "fixed inset-0 z-50"
    )}>
      {/* Header */}
      <header className="h-14 border-b border-[#2d2d44] bg-[#1a1a2e] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="text-white hover:bg-[#2d2d44]"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="h-6 w-px bg-[#2d2d44]" />
          <span className="font-semibold text-white">Page Builder</span>
          {isDirty && <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">Unsaved</span>}
        </div>

        <div className="flex items-center gap-2">
          {/* Device toggles */}
          <div className="flex items-center border border-[#2d2d44] rounded-lg p-1 bg-[#16213e]">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2",
                deviceMode === 'desktop' ? 'bg-[#6366f1] text-white' : 'text-[#a0a0a0] hover:text-white hover:bg-[#2d2d44]'
              )}
              onClick={() => setDeviceMode('desktop')}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2",
                deviceMode === 'tablet' ? 'bg-[#6366f1] text-white' : 'text-[#a0a0a0] hover:text-white hover:bg-[#2d2d44]'
              )}
              onClick={() => setDeviceMode('tablet')}
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2",
                deviceMode === 'mobile' ? 'bg-[#6366f1] text-white' : 'text-[#a0a0a0] hover:text-white hover:bg-[#2d2d44]'
              )}
              onClick={() => setDeviceMode('mobile')}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-[#2d2d44]" />

          {/* Actions */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editorRef.current?.UndoManager.undo()}
            disabled={!isReady}
            className="text-[#a0a0a0] hover:text-white hover:bg-[#2d2d44]"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editorRef.current?.UndoManager.redo()}
            disabled={!isReady}
            className="text-[#a0a0a0] hover:text-white hover:bg-[#2d2d44]"
          >
            <Redo2 className="w-4 h-4" />
          </Button>

          <div className="h-6 w-px bg-[#2d2d44]" />

          {/* Import/Export */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsImportDialogOpen(true)}
            disabled={!isReady}
            className="text-[#a0a0a0] hover:text-white hover:bg-[#2d2d44]"
          >
            <FileCode className="w-4 h-4 mr-1" />
            Import
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportCode}
            disabled={!isReady}
            className="text-[#a0a0a0] hover:text-white hover:bg-[#2d2d44]"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>

          <div className="h-6 w-px bg-[#2d2d44]" />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearCanvas}
            disabled={!isReady}
            className="text-[#a0a0a0] hover:text-white hover:bg-[#2d2d44]"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-[#a0a0a0] hover:text-white hover:bg-[#2d2d44]"
          >
            <Maximize className="w-4 h-4" />
          </Button>

          <div className="h-6 w-px bg-[#2d2d44]" />

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handlePreview} 
            disabled={!isReady}
            className="text-[#a0a0a0] hover:text-white hover:bg-[#2d2d44]"
          >
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!isReady || saveMutation.isPending}
            className="border-[#2d2d44] text-white hover:bg-[#2d2d44]"
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={!isReady || publishMutation.isPending}
            className="bg-[#6366f1] hover:bg-[#5558e3] text-white"
          >
            <Upload className="w-4 h-4 mr-1" />
            Publish
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Blocks */}
        <div className="w-64 border-r border-[#2d2d44] bg-[#1a1a2e] flex flex-col overflow-hidden">
          <div className="p-3 border-b border-[#2d2d44]">
            <h3 className="font-semibold text-sm text-white">Blocks</h3>
            <p className="text-xs text-[#a0a0a0] mt-1">Drag blocks to canvas</p>
          </div>
          <div id="blocks-container" className="flex-1 overflow-y-auto" />
        </div>

        {/* Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div ref={containerRef} className="flex-1" />
        </div>

        {/* Right sidebar - Styles/Layers/Traits */}
        <div className="w-72 border-l border-[#2d2d44] bg-[#1a1a2e] flex flex-col overflow-hidden">
          <div className="flex border-b border-[#2d2d44]">
            <button
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                activeTab === 'styles' 
                  ? 'border-b-2 border-[#6366f1] text-[#6366f1] bg-[#6366f1]/10' 
                  : 'text-[#a0a0a0] hover:text-white'
              )}
              onClick={() => setActiveTab('styles')}
            >
              <Paintbrush className="w-4 h-4" />
              Styles
            </button>
            <button
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                activeTab === 'layers' 
                  ? 'border-b-2 border-[#6366f1] text-[#6366f1] bg-[#6366f1]/10' 
                  : 'text-[#a0a0a0] hover:text-white'
              )}
              onClick={() => setActiveTab('layers')}
            >
              <Layers className="w-4 h-4" />
              Layers
            </button>
            <button
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                activeTab === 'traits' 
                  ? 'border-b-2 border-[#6366f1] text-[#6366f1] bg-[#6366f1]/10' 
                  : 'text-[#a0a0a0] hover:text-white'
              )}
              onClick={() => setActiveTab('traits')}
            >
              <Settings className="w-4 h-4" />
              Props
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className={cn(activeTab !== 'styles' && 'hidden')}>
              <div id="selectors-container" className="border-b border-[#2d2d44]" />
              <div id="styles-container" />
            </div>
            <div id="layers-container" className={cn(activeTab !== 'layers' && 'hidden', 'h-full')} />
            <div id="traits-container" className={cn(activeTab !== 'traits' && 'hidden')} />
          </div>
        </div>
      </div>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-3xl bg-[#1a1a2e] border-[#2d2d44] text-white">
          <DialogHeader>
            <DialogTitle>Import HTML/CSS Code</DialogTitle>
            <DialogDescription className="text-[#a0a0a0]">
              Paste your HTML and CSS code from CodePen, JSFiddle, or any source. 
              The code will be rendered exactly as you wrote it with full support for 
              icons, fonts, and responsive styles.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="html" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#16213e]">
              <TabsTrigger value="html" className="data-[state=active]:bg-[#6366f1]">HTML</TabsTrigger>
              <TabsTrigger value="css" className="data-[state=active]:bg-[#6366f1]">CSS</TabsTrigger>
            </TabsList>
            <TabsContent value="html">
              <Textarea
                placeholder="Paste your HTML code here..."
                value={importCode.html}
                onChange={(e) => setImportCode(prev => ({ ...prev, html: e.target.value }))}
                className="min-h-[300px] font-mono text-sm bg-[#0f0f1a] border-[#2d2d44] text-white"
              />
            </TabsContent>
            <TabsContent value="css">
              <Textarea
                placeholder="Paste your CSS code here (optional)..."
                value={importCode.css}
                onChange={(e) => setImportCode(prev => ({ ...prev, css: e.target.value }))}
                className="min-h-[300px] font-mono text-sm bg-[#0f0f1a] border-[#2d2d44] text-white"
              />
            </TabsContent>
          </Tabs>

          <div className="p-4 bg-[#16213e] rounded-lg text-sm text-[#a0a0a0]">
            <p className="font-medium text-white mb-2">Supported Features:</p>
            <ul className="grid grid-cols-2 gap-2">
              <li className="flex items-center gap-2"><i className="fas fa-check text-green-400"></i> Font Awesome Icons</li>
              <li className="flex items-center gap-2"><i className="fas fa-check text-green-400"></i> Bootstrap Classes</li>
              <li className="flex items-center gap-2"><i className="fas fa-check text-green-400"></i> Tailwind CSS</li>
              <li className="flex items-center gap-2"><i className="fas fa-check text-green-400"></i> Google Fonts</li>
              <li className="flex items-center gap-2"><i className="fas fa-check text-green-400"></i> Custom CSS</li>
              <li className="flex items-center gap-2"><i className="fas fa-check text-green-400"></i> Responsive Design</li>
            </ul>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} className="border-[#2d2d44] text-white hover:bg-[#2d2d44]">
              Cancel
            </Button>
            <Button onClick={handleImportCode} className="bg-[#6366f1] hover:bg-[#5558e3]">
              <Code className="w-4 h-4 mr-2" />
              Import Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
