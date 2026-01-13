import { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useCustomDomain } from '@/contexts/CustomDomainContext';
import { StoreAuthProvider } from '@/contexts/StoreAuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store } from 'lucide-react';
import StoreHome from '@/pages/store/StoreHome';
import ProductList from '@/pages/store/ProductList';
import ProductDetail from '@/pages/store/ProductDetail';
import CartPage from '@/pages/store/CartPage';
import CheckoutPage from '@/pages/store/CheckoutPage';
import OrderConfirmation from '@/pages/store/OrderConfirmation';
import StoreAuth from '@/pages/store/StoreAuth';
import StoreAccount from '@/pages/store/StoreAccount';
import StoreOrders from '@/pages/store/StoreOrders';
import StoreOrderDetail from '@/pages/store/StoreOrderDetail';
import StoreAddresses from '@/pages/store/StoreAddresses';
import StoreWishlist from '@/pages/store/StoreWishlist';
import StorePageView from '@/pages/store/StorePageView';

// Wrapper that provides tenant context for custom domain routes
function CustomDomainStoreWrapper({ children }: { children: ReactNode }) {
  const { tenant, loading, error } = useCustomDomain();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-neutral-400" />
            </div>
            <h1 className="text-2xl font-serif font-semibold mb-2">
              {error || 'Store not found'}
            </h1>
            <p className="text-neutral-500 mb-6">
              This domain is not configured or the store is unavailable.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <StoreAuthProvider tenantId={tenant.id}>
      {children}
    </StoreAuthProvider>
  );
}

export function CustomDomainRoutes() {
  const { tenant } = useCustomDomain();

  // Always render wrapper so it can show loading/error states.
  // (Returning null here would cause a white screen when domain isn't mapped.)
  return (
    <CustomDomainStoreWrapper>
      <Routes>
        <Route path="/" element={<StoreHome />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/product/:productSlug" element={<ProductDetail />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />

        {/* tenant is guaranteed by CustomDomainStoreWrapper; fallbacks satisfy TS */}
        <Route
          path="/login"
          element={<StoreAuth tenantId={tenant?.id ?? ''} storeName={tenant?.store_name ?? ''} />}
        />
        <Route
          path="/signup"
          element={<StoreAuth tenantId={tenant?.id ?? ''} storeName={tenant?.store_name ?? ''} />}
        />
        <Route path="/account" element={<StoreAccount storeName={tenant?.store_name ?? ''} />} />
        <Route path="/account/orders" element={<StoreOrders />} />
        <Route path="/account/orders/:orderId" element={<StoreOrderDetail />} />
        <Route path="/account/addresses" element={<StoreAddresses tenantId={tenant?.id ?? ''} />} />
        <Route path="/wishlist" element={<StoreWishlist />} />
        <Route path="/page/:pageSlug" element={<StorePageView />} />

        {/* Redirect any /store/slug paths to root */}
        <Route path="/store/*" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CustomDomainStoreWrapper>
  );
}

