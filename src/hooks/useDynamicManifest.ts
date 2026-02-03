import { useEffect } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

interface DynamicManifestOptions {
  type: 'admin' | 'storefront';
  slug?: string;
  tenantId?: string;
}

/**
 * Hook to dynamically set the PWA manifest based on context
 * - Admin: Sets manifest for /dashboard with admin-specific config
 * - Storefront: Sets manifest for specific store with branding
 */
export function useDynamicManifest({ type, slug, tenantId }: DynamicManifestOptions) {
  useEffect(() => {
    // Build manifest URL
    let manifestUrl = `${SUPABASE_URL}/functions/v1/pwa-manifest?type=${type}`;
    
    if (type === 'storefront') {
      if (slug) {
        manifestUrl += `&slug=${encodeURIComponent(slug)}`;
      } else if (tenantId) {
        manifestUrl += `&tenant_id=${encodeURIComponent(tenantId)}`;
      }
    }

    // Find or create manifest link
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }

    // Update manifest URL
    manifestLink.href = manifestUrl;

    // Cleanup: reset to default manifest on unmount
    return () => {
      // Don't remove - just leave the last manifest in place
      // This prevents flickering when navigating
    };
  }, [type, slug, tenantId]);
}

/**
 * Updates Apple-specific PWA meta tags for iOS
 */
export function useApplePWAConfig(appName: string, themeColor?: string) {
  useEffect(() => {
    // Update apple-mobile-web-app-title
    let titleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement;
    if (titleMeta) {
      titleMeta.content = appName;
    }

    // Update application-name
    let appNameMeta = document.querySelector('meta[name="application-name"]') as HTMLMetaElement;
    if (appNameMeta) {
      appNameMeta.content = appName;
    }

    // Update theme-color if provided
    if (themeColor) {
      let themeMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
      if (themeMeta) {
        themeMeta.content = themeColor;
      }
    }
  }, [appName, themeColor]);
}
