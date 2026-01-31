/**
 * PreloadLink - Preloads route chunks on hover/focus
 * 
 * Makes navigation feel instant by loading the target
 * page's JavaScript before the user clicks.
 */

import { Link, LinkProps } from 'react-router-dom';
import { useCallback, useRef, forwardRef } from 'react';

// Map of routes to their lazy import functions
const routeImports: Record<string, () => Promise<any>> = {
  '/authentication': () => import('@/pages/Auth'),
  '/onboarding': () => import('@/pages/Onboarding'),
  '/dashboard': () => import('@/pages/Dashboard'),
  '/page-builder': () => import('@/pages/admin/GrapesJSPageBuilder'),
};

// Track what's already been preloaded
const preloadedRoutes = new Set<string>();

interface PreloadLinkProps extends LinkProps {
  children: React.ReactNode;
}

export const PreloadLink = forwardRef<HTMLAnchorElement, PreloadLinkProps>(
  function PreloadLink({ to, children, onMouseEnter, onFocus, ...props }, ref) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const preload = useCallback(() => {
      const path = typeof to === 'string' ? to : to.pathname || '';
      
      // Find matching route
      const matchingRoute = Object.keys(routeImports).find(route => 
        path === route || path.startsWith(route + '/')
      );

      if (matchingRoute && !preloadedRoutes.has(matchingRoute)) {
        preloadedRoutes.add(matchingRoute);
        // Preload after small delay to avoid unnecessary loads on quick mouse movements
        timeoutRef.current = setTimeout(() => {
          routeImports[matchingRoute]();
        }, 50);
      }
    }, [to]);

    const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
      preload();
      onMouseEnter?.(e);
    }, [preload, onMouseEnter]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLAnchorElement>) => {
      preload();
      onFocus?.(e);
    }, [preload, onFocus]);

    const handleMouseLeave = useCallback(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }, []);

    return (
      <Link
        ref={ref}
        to={to}
        onMouseEnter={handleMouseEnter}
        onFocus={handleFocus}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

// Utility to manually preload a route
export function preloadRoute(path: string) {
  const matchingRoute = Object.keys(routeImports).find(route => 
    path === route || path.startsWith(route + '/')
  );

  if (matchingRoute && !preloadedRoutes.has(matchingRoute)) {
    preloadedRoutes.add(matchingRoute);
    routeImports[matchingRoute]();
  }
}

// Preload multiple routes
export function preloadRoutes(paths: string[]) {
  paths.forEach(preloadRoute);
}
