import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CustomDomainProvider, useCustomDomain } from "@/contexts/CustomDomainContext";
import { CustomDomainRoutes } from "@/components/CustomDomainRoutes";
import StoreGuard from "./components/storefront/StoreGuard";
import { useStoreTenant } from "./hooks/useStoreTenant";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Landing page is NOT lazy loaded - it's the first thing users see
import Index from "./pages/Index";

// Lazy loaded pages with prefetch support
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const PageBuilder = lazy(() => import("./pages/admin/PageBuilder"));
const GrapesJSPageBuilder = lazy(() => import("./pages/admin/GrapesJSPageBuilder"));

const StoreHome = lazy(() => import("./pages/store/StoreHome"));
const ProductList = lazy(() => import("./pages/store/ProductList"));
const GroceryCategoriesPage = lazy(() => import("./pages/store/GroceryCategoriesPage"));
const ProductDetail = lazy(() => import("./pages/store/ProductDetail"));
const CartPage = lazy(() => import("./pages/store/CartPage"));
const CheckoutPage = lazy(() => import("./pages/store/CheckoutPage"));
const OrderConfirmation = lazy(() => import("./pages/store/OrderConfirmation"));
const StoreLogin = lazy(() => import("./pages/store/StoreLogin"));
const StoreSignup = lazy(() => import("./pages/store/StoreSignup"));
const StoreAccount = lazy(() => import("./pages/store/StoreAccount"));
const StoreOrders = lazy(() => import("./pages/store/StoreOrders"));
const StoreOrderDetail = lazy(() => import("./pages/store/StoreOrderDetail"));
const StoreAddresses = lazy(() => import("./pages/store/StoreAddresses"));
const StoreWishlist = lazy(() => import("./pages/store/StoreWishlist"));
const StorePageView = lazy(() => import("./pages/store/StorePageView"));
const DeliveryPanel = lazy(() => import("./pages/delivery/DeliveryPanel"));
const NotFound = lazy(() => import("./pages/NotFound"));

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

// Wrapper components for store pages that need tenant props
function StoreLoginWrapper() {
  return (
    <StoreGuard>
      <StoreLoginInner />
    </StoreGuard>
  );
}

function StoreSignupWrapper() {
  return (
    <StoreGuard>
      <StoreSignupInner />
    </StoreGuard>
  );
}

function StoreAccountWrapper() {
  return (
    <StoreGuard>
      <StoreAccountInner />
    </StoreGuard>
  );
}

function StoreOrdersWrapper() {
  return (
    <StoreGuard>
      <StoreOrders />
    </StoreGuard>
  );
}

function StoreOrderDetailWrapper() {
  return (
    <StoreGuard>
      <StoreOrderDetail />
    </StoreGuard>
  );
}

function StoreAddressesWrapper() {
  return (
    <StoreGuard>
      <StoreAddressesInner />
    </StoreGuard>
  );
}

// Inner components that use the tenant hook
function StoreLoginInner() {
  const { tenant, loading } = useStoreTenant();
  if (loading || !tenant) return null;
  return <StoreLogin tenantId={tenant.id} storeName={tenant.store_name} />;
}

function StoreSignupInner() {
  const { tenant, loading } = useStoreTenant();
  if (loading || !tenant) return null;
  return <StoreSignup tenantId={tenant.id} storeName={tenant.store_name} />;
}

function StoreAccountInner() {
  const { tenant, loading } = useStoreTenant();
  if (loading || !tenant) return null;
  return <StoreAccount storeName={tenant.store_name} />;
}

function StoreAddressesInner() {
  const { tenant, loading } = useStoreTenant();
  if (loading || !tenant) return null;
  return <StoreAddresses tenantId={tenant.id} />;
}

// Wrapper for authenticated routes
function AuthenticatedRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/authentication" element={<Auth />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/page-builder" element={<GrapesJSPageBuilder />} />
        <Route path="/page-builder-legacy" element={<PageBuilder />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

// Store routes don't need AuthProvider - they use StoreAuthProvider
function StoreRoutes() {
  return (
    <Routes>
      <Route path="/store/:slug" element={<StoreGuard><StoreHome /></StoreGuard>} />
      <Route path="/store/:slug/products" element={<StoreGuard><ProductList /></StoreGuard>} />
      <Route path="/store/:slug/categories" element={<StoreGuard><GroceryCategoriesPage /></StoreGuard>} />
      <Route path="/store/:slug/product/:productSlug" element={<StoreGuard><ProductDetail /></StoreGuard>} />
      <Route path="/store/:slug/cart" element={<StoreGuard><CartPage /></StoreGuard>} />
      <Route path="/store/:slug/checkout" element={<StoreGuard><CheckoutPage /></StoreGuard>} />
      <Route path="/store/:slug/order-confirmation" element={<StoreGuard><OrderConfirmation /></StoreGuard>} />
      <Route path="/store/:slug/login" element={<StoreLoginWrapper />} />
      <Route path="/store/:slug/signup" element={<StoreSignupWrapper />} />
      <Route path="/store/:slug/account" element={<StoreAccountWrapper />} />
      <Route path="/store/:slug/account/orders" element={<StoreOrdersWrapper />} />
      <Route path="/store/:slug/account/orders/:orderId" element={<StoreOrderDetailWrapper />} />
      <Route path="/store/:slug/account/addresses" element={<StoreAddressesWrapper />} />
      <Route path="/store/:slug/wishlist" element={<StoreGuard><StoreWishlist /></StoreGuard>} />
      <Route path="/store/:slug/page/:pageSlug" element={<StoreGuard><StorePageView /></StoreGuard>} />
      <Route path="/store/:slug/delivery" element={<DeliveryPanel />} />
    </Routes>
  );
}

// Main app content that conditionally renders based on custom domain
function AppContent() {
  const { isCustomDomain, loading } = useCustomDomain();
  const location = useLocation();

  // Landing page - ALWAYS render immediately, no waiting
  if (location.pathname === '/') {
    return <Index />;
  }

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
              <AppContent />
            </Suspense>
          </CustomDomainProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
