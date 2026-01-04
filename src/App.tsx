import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CustomDomainProvider, useCustomDomain } from "@/contexts/CustomDomainContext";
import { CustomDomainRoutes } from "@/components/CustomDomainRoutes";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import StoreHome from "./pages/store/StoreHome";
import ProductList from "./pages/store/ProductList";
import ProductDetail from "./pages/store/ProductDetail";
import CartPage from "./pages/store/CartPage";
import CheckoutPage from "./pages/store/CheckoutPage";
import OrderConfirmation from "./pages/store/OrderConfirmation";
import StoreLogin from "./pages/store/StoreLogin";
import StoreSignup from "./pages/store/StoreSignup";
import StoreAccount from "./pages/store/StoreAccount";
import StoreOrders from "./pages/store/StoreOrders";
import StoreOrderDetail from "./pages/store/StoreOrderDetail";
import StoreAddresses from "./pages/store/StoreAddresses";
import StoreWishlist from "./pages/store/StoreWishlist";
import StorePageView from "./pages/store/StorePageView";
import StoreGuard from "./components/storefront/StoreGuard";
import DeliveryPanel from "./pages/delivery/DeliveryPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
import { useStoreTenant } from "./hooks/useStoreTenant";

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
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
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
        <Route path="/store/:slug" element={<StoreGuard><StoreHome /></StoreGuard>} />
        <Route path="/store/:slug/products" element={<StoreGuard><ProductList /></StoreGuard>} />
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
        <CustomDomainProvider>
          <AppContent />
        </CustomDomainProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
