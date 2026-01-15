import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CustomDomainProvider, useCustomDomain } from "@/contexts/CustomDomainContext";
import { CustomDomainRoutes } from "@/components/CustomDomainRoutes";
import StoreGuard from "./components/storefront/StoreGuard";
import { useStoreTenant } from "./hooks/useStoreTenant";

// Landing page is NOT lazy loaded - it's the first thing users see
import Index from "./pages/Index";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Performance: avoid refetch storms on focus/navigation
      staleTime: 1000 * 60, // 1 min
      gcTime: 1000 * 60 * 10, // 10 min
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

function AppFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
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

// Main app content that conditionally renders based on custom domain
function AppContent() {
  const { isCustomDomain, loading } = useCustomDomain();

  if (loading) {
    return <AppFallback />;
  }

  // If custom domain, render storefront routes only
  if (isCustomDomain) {
    return <CustomDomainRoutes />;
  }

  // Platform routes (admin, auth, and /store/:slug routes)
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/authentication" element={<Auth />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/page-builder" element={<GrapesJSPageBuilder />} />
        <Route path="/page-builder-legacy" element={<PageBuilder />} />
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<AppFallback />}>
          <CustomDomainProvider>
            <AppContent />
          </CustomDomainProvider>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
