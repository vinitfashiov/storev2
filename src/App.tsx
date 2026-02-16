import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CustomDomainProvider, useCustomDomain } from "@/contexts/CustomDomainContext";
import { CustomDomainRoutes } from "@/components/CustomDomainRoutes";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Landing page is NOT lazy loaded - it's the first thing users see
import Index from "./pages/Index";

// Lazy loaded pages with prefetch support
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminReturns = lazy(() => import("./pages/admin/AdminReturns"));
const AdminCustomerDetail = lazy(() => import("./pages/admin/AdminCustomerDetail"));
const PageBuilder = lazy(() => import("./pages/admin/PageBuilder"));
const GrapesJSPageBuilder = lazy(() => import("./pages/admin/GrapesJSPageBuilder"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy loaded StoreRoutes to avoid bundling store dependencies (like maps) in the main bundle
const StoreRoutes = lazy(() => import("./routes/StoreRoutes"));

// ULTRA-OPTIMIZED Query Client for rocket-fast performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Aggressive caching for speed
      staleTime: 1000 * 60 * 2,      // 2 minutes - data considered fresh
      gcTime: 1000 * 60 * 30,         // 30 minutes - keep in cache
      refetchOnWindowFocus: false,    // Don't refetch on tab focus
      refetchOnReconnect: false,      // Don't refetch on reconnect
      refetchOnMount: false,          // Don't refetch if data exists
      retry: 1,                       // Only 1 retry on failure
      retryDelay: 1000,               // 1 second retry delay
      networkMode: 'offlineFirst',    // Use cache first, then network
    },
    mutations: {
      retry: 0,
    },
  },
});

// Preload critical chunks on idle - more aggressive preloading
function preloadCriticalChunks() {
  // Use requestIdleCallback if available, otherwise use setTimeout
  const schedulePreload = (fn: () => void, delay: number) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(fn, { timeout: delay });
    } else {
      setTimeout(fn, delay);
    }
  };

  // Preload Auth page immediately (most common path)
  schedulePreload(() => {
    import("./pages/Auth");
  }, 1000);

  // Preload Dashboard after Auth (for returning users)
  schedulePreload(() => {
    import("./pages/Dashboard");
  }, 2000);

  // Preload Onboarding (for new users)
  schedulePreload(() => {
    import("./pages/Onboarding");
  }, 3000);
}

// Ultra-minimal loading - shows instantly, feels fast
function AppFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 border-2 border-primary/20 rounded-full" />
          <div className="absolute inset-0 w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <span className="text-sm text-muted-foreground font-medium">Loading...</span>
      </div>
    </div>
  );
}

// Preload on app mount
function PreloadManager() {
  useEffect(() => {
    preloadCriticalChunks();
  }, []);
  return null;
}

// Wrapper for authenticated routes - no forwardRef needed here
function AuthenticatedRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/authentication" element={<Auth />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard/*" element={<Dashboard />}>
          {/* These are nested routes handled by the Dashboard component */}
          {/* <Route path="orders" element={<Dashboard />} /> */}
          <Route path="returns" element={<AdminReturns />} />
          <Route path="customers" element={<Dashboard />} />
          <Route path="customers/:id" element={<AdminCustomerDetail />} />
        </Route>
        <Route path="/page-builder" element={<GrapesJSPageBuilder />} />
        <Route path="/page-builder-legacy" element={<PageBuilder />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

// Lazy loaded public pages (SEO)
const PublicLayout = lazy(() => import("@/layouts/PublicLayout"));
const Pricing = lazy(() => import("@/pages/public/Pricing"));
const Features = lazy(() => import("@/pages/public/Features"));
const StoreBuilder = lazy(() => import("@/pages/public/StoreBuilder"));
const Themes = lazy(() => import("@/pages/public/Themes"));
const Help = lazy(() => import("@/pages/public/Help"));
const About = lazy(() => import("@/pages/public/About"));
const Contact = lazy(() => import("@/pages/public/Contact"));
const PrivacyPolicy = lazy(() => import("@/pages/public/PrivacyPolicy"));
const Terms = lazy(() => import("@/pages/public/Terms"));
const RefundPolicy = lazy(() => import("@/pages/public/RefundPolicy"));
const ShippingPolicy = lazy(() => import("@/pages/public/ShippingPolicy"));

// Public Routes Wrapper
function PublicRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Index />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/features" element={<Features />} />
        <Route path="/store-builder" element={<StoreBuilder />} />
        <Route path="/themes" element={<Themes />} />
        <Route path="/help" element={<Help />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
      </Route>
    </Routes>
  );
}

// Main app content that conditionally renders based on custom domain
function AppContent() {
  const { isCustomDomain, loading } = useCustomDomain();
  const location = useLocation();

  // Only show loading for custom domains (non-platform routes)
  if (loading && isCustomDomain) {
    return <AppFallback />;
  }

  // If custom domain, render storefront routes only
  if (isCustomDomain) {
    return <CustomDomainRoutes />;
  }

  // Store routes - separate from auth provider
  if (location.pathname.startsWith('/store/')) {
    return <StoreRoutes />;
  }

  // Check if it's a public route
  const publicPaths = [
    '/',
    '/pricing',
    '/features',
    '/store-builder',
    '/themes',
    '/help',
    '/about',
    '/contact',
    '/privacy-policy',
    '/terms',
    '/refund-policy',
    '/shipping-policy'
  ];

  // Simple check for exact match or logic for specific public sub-routes if added later
  if (publicPaths.includes(location.pathname)) {
    return <PublicRoutes />;
  }

  // Authenticated platform routes
  return <AuthenticatedRoutes />;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PreloadManager />
          <CustomDomainProvider>
            <Suspense fallback={<AppFallback />}>
              <ErrorBoundary fallback={<div className="p-4 text-center">Failed to load content. <button onClick={() => window.location.reload()} className="underline">Reload</button></div>}>
                <AppContent />
              </ErrorBoundary>
            </Suspense>
          </CustomDomainProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
