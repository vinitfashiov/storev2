import { memo, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GrapesJSRendererProps {
  tenantId: string;
}

// External CSS resources to inject in the rendered page
const externalCSSLinks = [
  // Google Fonts
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&family=Roboto:wght@300;400;500;700;900&family=Open+Sans:wght@300;400;500;600;700;800&family=Montserrat:wght@300;400;500;600;700;800;900&family=Lato:wght@300;400;700;900&family=Playfair+Display:wght@400;500;600;700;800;900&display=swap',
  // Font Awesome
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  // Bootstrap CSS
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  // Tailwind CSS
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  // Animate.css
  'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css',
  // Boxicons
  'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css',
  // Material Icons
  'https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined|Material+Icons+Round',
  // Remixicon
  'https://cdn.jsdelivr.net/npm/remixicon@4.0.0/fonts/remixicon.css',
  // Swiper CSS
  'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css',
  // AOS (Animate On Scroll)
  'https://unpkg.com/aos@2.3.1/dist/aos.css',
  // Hover.css
  'https://cdnjs.cloudflare.com/ajax/libs/hover.css/2.3.1/css/hover-min.css',
];

const externalScripts = [
  // Bootstrap JS
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
  // AOS
  'https://unpkg.com/aos@2.3.1/dist/aos.js',
  // Swiper
  'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
];

interface LayoutData {
  html: string;
  css: string;
  projectData?: any;
  type: 'grapesjs';
}

// Fetch GrapesJS published layout
function useGrapesJSLayout(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['grapesjs-layout', tenantId],
    queryFn: async (): Promise<LayoutData | null> => {
      if (!tenantId) return null;
      
      const { data, error } = await supabase
        .from('homepage_layouts')
        .select('layout_data, published_at')
        .eq('tenant_id', tenantId)
        .not('published_at', 'is', null)
        .maybeSingle();
      
      if (error) {
        console.error('[GrapesJSRenderer] Error fetching layout:', error);
        return null;
      }
      
      if (!data) return null;
      
      // Parse layout_data
      let layoutData: LayoutData | null = null;
      try {
        if (typeof data.layout_data === 'string') {
          layoutData = JSON.parse(data.layout_data);
        } else if (data.layout_data && typeof data.layout_data === 'object') {
          layoutData = data.layout_data as unknown as LayoutData;
        }
      } catch (e) {
        console.error('[GrapesJSRenderer] Error parsing layout:', e);
        return null;
      }
      
      // Check if this is a GrapesJS layout
      if (layoutData?.type !== 'grapesjs') {
        return null;
      }
      
      return layoutData;
    },
    enabled: !!tenantId,
    // Performance: layouts rarely change; avoid refetching on every navigation/focus
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

// Check if there's a valid GrapesJS layout
export function useHasGrapesJSLayout(tenantId: string | undefined) {
  const { data, isLoading } = useGrapesJSLayout(tenantId);
  return {
    hasLayout: !!(data?.html),
    isLoading,
    layoutData: data,
  };
}

// Main GrapesJS Renderer Component
export const GrapesJSRenderer = memo(function GrapesJSRenderer({ tenantId }: GrapesJSRendererProps) {
  const { data: layout, isLoading } = useGrapesJSLayout(tenantId);

  // Build external CSS links
  const cssLinksHTML = useMemo(() => 
    externalCSSLinks.map(url => `<link rel="stylesheet" href="${url}">`).join('\n'),
    []
  );

  // Build external scripts
  const scriptsHTML = useMemo(() => 
    externalScripts.map(url => `<script src="${url}"></script>`).join('\n'),
    []
  );

  if (isLoading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!layout || !layout.html) {
    return null;
  }

  // Create the full HTML document for iframe
  const fullHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${cssLinksHTML}
      <style>
        * { box-sizing: border-box; }
        body { 
          margin: 0; 
          padding: 0; 
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        /* Make links clickable */
        a { pointer-events: auto; }
        /* Ensure smooth scrolling */
        html { scroll-behavior: smooth; }
        /* Custom CSS from editor */
        ${layout.css || ''}
      </style>
    </head>
    <body>
      ${layout.html}
      ${scriptsHTML}
      <script>
        // Initialize AOS if available
        if (typeof AOS !== 'undefined') {
          AOS.init({ duration: 800, once: true });
        }
        // Handle link clicks to navigate in parent
        document.querySelectorAll('a[href]').forEach(function(link) {
          link.addEventListener('click', function(e) {
            var href = link.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
              e.preventDefault();
              window.parent.location.href = href;
            }
          });
        });
      </script>
    </body>
    </html>
  `;

  return (
    <div className="grapesjs-rendered-content w-full">
      <iframe
        srcDoc={fullHTML}
        className="w-full border-0"
        style={{ 
          minHeight: '100vh',
          display: 'block',
        }}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        title="Page Content"
        onLoad={(e) => {
          // Auto-resize iframe based on content height
          const iframe = e.target as HTMLIFrameElement;
          try {
            const contentHeight = iframe.contentWindow?.document.body.scrollHeight || 0;
            if (contentHeight > 0) {
              iframe.style.height = `${contentHeight + 50}px`;
            }
          } catch (err) {
            // Silently handle cross-origin issues
          }
        }}
      />
    </div>
  );
});

export default GrapesJSRenderer;
