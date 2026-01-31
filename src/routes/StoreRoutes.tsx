import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import StoreGuard from "@/components/storefront/StoreGuard";
import { useStoreTenant } from "@/hooks/useStoreTenant";

// Lazy load pages
const StoreHome = lazy(() => import("@/pages/store/StoreHome"));
const ProductList = lazy(() => import("@/pages/store/ProductList"));
const GroceryCategoriesPage = lazy(() => import("@/pages/store/GroceryCategoriesPage"));
const ProductDetail = lazy(() => import("@/pages/store/ProductDetail"));
const CartPage = lazy(() => import("@/pages/store/CartPage"));
const CheckoutPage = lazy(() => import("@/pages/store/CheckoutPage"));
const OrderConfirmation = lazy(() => import("@/pages/store/OrderConfirmation"));
const StoreLogin = lazy(() => import("@/pages/store/StoreLogin"));
const StoreSignup = lazy(() => import("@/pages/store/StoreSignup"));
const StoreAccount = lazy(() => import("@/pages/store/StoreAccount"));
const StoreOrders = lazy(() => import("@/pages/store/StoreOrders"));
const StoreOrderDetail = lazy(() => import("@/pages/store/StoreOrderDetail"));
const StoreAddresses = lazy(() => import("@/pages/store/StoreAddresses"));
const StoreWishlist = lazy(() => import("@/pages/store/StoreWishlist"));
const StorePageView = lazy(() => import("@/pages/store/StorePageView"));
const DeliveryPanel = lazy(() => import("@/pages/delivery/DeliveryPanel"));

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

export default function StoreRoutes() {
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
