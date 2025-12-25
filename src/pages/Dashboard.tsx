import { useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { toast } from 'sonner';
import AdminDashboard from './admin/AdminDashboard';
import AdminProducts from './admin/AdminProducts';
import AdminProductForm from './admin/AdminProductForm';
import AdminCategories from './admin/AdminCategories';
import AdminBrands from './admin/AdminBrands';
import AdminAttributes from './admin/AdminAttributes';
import AdminCoupons from './admin/AdminCoupons';
import AdminCustomers from './admin/AdminCustomers';
import AdminOrders from './admin/AdminOrders';
import AdminOrderDetail from './admin/AdminOrderDetail';
import AdminSettings from './admin/AdminSettings';
import AdminIntegrations from './admin/AdminIntegrations';

import AdminDeliverySlots from './admin/AdminDeliverySlots';
import AdminDeliverySettings from './admin/AdminDeliverySettings';
import AdminProductAvailability from './admin/AdminProductAvailability';
import AdminPaymentIntents from './admin/AdminPaymentIntents';
import AdminStoreSettings from './admin/AdminStoreSettings';
import AdminStoreBanners from './admin/AdminStoreBanners';
import AdminStorePages from './admin/AdminStorePages';
import AdminUpgrade from './admin/AdminUpgrade';
import AdminSubscription from './admin/AdminSubscription';
import AdminDomains from './admin/AdminDomains';
import AdminInventory from './admin/AdminInventory';
import AdminSuppliers from './admin/AdminSuppliers';
import AdminPurchaseOrders from './admin/AdminPurchaseOrders';
import AdminBatches from './admin/AdminBatches';
import AdminPOS from './admin/AdminPOS';
import AdminPOSReports from './admin/AdminPOSReports';
import AdminDeliveryBoys from './admin/AdminDeliveryBoys';
import AdminDeliveryAreas from './admin/AdminDeliveryAreas';
import AdminDeliveryOrders from './admin/AdminDeliveryOrders';
import AdminDeliveryPayouts from './admin/AdminDeliveryPayouts';

// Wrapper to pass productId from route params
function ProductFormWrapper({ tenantId, disabled }: { tenantId: string; disabled: boolean }) {
  const { productId } = useParams<{ productId: string }>();
  return <AdminProductForm tenantId={tenantId} productId={productId} disabled={disabled} />;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, tenant, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && user && !profile?.onboarding_completed) {
      navigate('/onboarding');
    }
  }, [user, profile, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
    toast.success('Logged out successfully');
  };

  const getDaysRemaining = () => {
    if (!tenant?.trial_ends_at) return 0;
    const now = new Date();
    const trialEnd = new Date(tenant.trial_ends_at);
    const diff = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const isTrialExpired = tenant?.plan === 'trial' && getDaysRemaining() <= 0;

  const handleUpgrade = () => {
    navigate('/dashboard/upgrade');
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!tenant) return null;

  const isGrocery = tenant.business_type === 'grocery';

  return (
    <AdminLayout
      storeName={tenant.store_name}
      storeSlug={tenant.store_slug}
      businessType={tenant.business_type}
      onSignOut={handleSignOut}
      isTrialExpired={isTrialExpired}
      onUpgrade={handleUpgrade}
    >
      <Routes>
        <Route index element={<AdminDashboard tenant={tenant} isTrialExpired={isTrialExpired} />} />
        <Route path="products" element={<AdminProducts tenantId={tenant.id} disabled={isTrialExpired} />} />
        <Route path="products/new" element={<AdminProductForm tenantId={tenant.id} disabled={isTrialExpired} />} />
        <Route path="products/:productId" element={<ProductFormWrapper tenantId={tenant.id} disabled={isTrialExpired} />} />
        <Route path="categories" element={<AdminCategories tenantId={tenant.id} disabled={isTrialExpired} />} />
        <Route path="brands" element={<AdminBrands tenantId={tenant.id} disabled={isTrialExpired} />} />
        <Route path="attributes" element={<AdminAttributes tenantId={tenant.id} disabled={isTrialExpired} />} />
        <Route path="coupons" element={<AdminCoupons tenantId={tenant.id} disabled={isTrialExpired} />} />
        <Route path="customers" element={<AdminCustomers tenantId={tenant.id} />} />
        <Route path="orders" element={<AdminOrders tenantId={tenant.id} />} />
        <Route path="orders/:orderId" element={<AdminOrderDetail tenantId={tenant.id} disabled={isTrialExpired} isGrocery={isGrocery} />} />
        <Route path="payment-intents" element={<AdminPaymentIntents tenantId={tenant.id} />} />
        <Route path="settings" element={<AdminSettings tenant={tenant} disabled={isTrialExpired} />} />
        <Route path="integrations" element={<AdminIntegrations tenantId={tenant.id} disabled={isTrialExpired} />} />
        <Route path="store-settings" element={<AdminStoreSettings tenantId={tenant.id} disabled={isTrialExpired} />} />
        <Route path="banners" element={<AdminStoreBanners tenantId={tenant.id} disabled={isTrialExpired} />} />
        <Route path="pages" element={<AdminStorePages tenantId={tenant.id} storeSlug={tenant.store_slug} disabled={isTrialExpired} />} />
        <Route path="upgrade" element={<AdminUpgrade />} />
        <Route path="subscription" element={<AdminSubscription />} />
        <Route path="domains" element={<AdminDomains />} />
        {/* Inventory Management - Both business types */}
        <Route path="inventory" element={<AdminInventory tenantId={tenant.id} />} />
        <Route path="suppliers" element={<AdminSuppliers tenantId={tenant.id} />} />
        <Route path="purchase-orders" element={<AdminPurchaseOrders tenantId={tenant.id} businessType={tenant.business_type} />} />
        {/* Grocery-specific routes */}
        {isGrocery && (
          <>
            <Route path="batches" element={<AdminBatches tenantId={tenant.id} />} />
            <Route path="pos" element={<AdminPOS tenantId={tenant.id} />} />
            <Route path="pos-reports" element={<AdminPOSReports tenantId={tenant.id} />} />
            <Route path="delivery-boys" element={<AdminDeliveryBoys tenantId={tenant.id} />} />
            <Route path="delivery-areas" element={<AdminDeliveryAreas tenantId={tenant.id} />} />
            <Route path="delivery-orders" element={<AdminDeliveryOrders tenantId={tenant.id} />} />
            <Route path="delivery-payouts" element={<AdminDeliveryPayouts tenantId={tenant.id} />} />
            
            <Route path="delivery-slots" element={<AdminDeliverySlots tenantId={tenant.id} disabled={isTrialExpired} />} />
            <Route path="delivery-settings" element={<AdminDeliverySettings tenantId={tenant.id} disabled={isTrialExpired} />} />
            <Route path="product-availability" element={<AdminProductAvailability tenantId={tenant.id} disabled={isTrialExpired} />} />
          </>
        )}
      </Routes>
    </AdminLayout>
  );
}
