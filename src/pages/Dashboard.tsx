import { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { TrialPopup } from '@/components/admin/TrialPopup';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { DashboardSkeleton } from '@/components/ui/skeleton-loaders';

// Lazy load all admin pages for faster initial dashboard load
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./admin/AdminProducts'));
const AdminProductForm = lazy(() => import('./admin/AdminProductForm'));
const AdminCategories = lazy(() => import('./admin/AdminCategories'));
const AdminBrands = lazy(() => import('./admin/AdminBrands'));
const AdminAttributes = lazy(() => import('./admin/AdminAttributes'));
const AdminCoupons = lazy(() => import('./admin/AdminCoupons'));
const AdminCustomers = lazy(() => import('./admin/AdminCustomers'));
const AdminOrders = lazy(() => import('./admin/AdminOrders'));
const AdminOrderDetail = lazy(() => import('./admin/AdminOrderDetail'));
const AdminSettings = lazy(() => import('./admin/AdminSettings'));
const AdminIntegrations = lazy(() => import('./admin/AdminIntegrations'));
const AdminStores = lazy(() => import('./admin/AdminStores'));
const AdminDeliverySlots = lazy(() => import('./admin/AdminDeliverySlots'));
const AdminDeliverySettings = lazy(() => import('./admin/AdminDeliverySettings'));
const AdminProductAvailability = lazy(() => import('./admin/AdminProductAvailability'));
const AdminPaymentIntents = lazy(() => import('./admin/AdminPaymentIntents'));
const AdminStoreSettings = lazy(() => import('./admin/AdminStoreSettings'));
const AdminPageBuilder = lazy(() => import('./admin/AdminPageBuilder'));
const AdminStoreBanners = lazy(() => import('./admin/AdminStoreBanners'));
const AdminStorePages = lazy(() => import('./admin/AdminStorePages'));
const AdminUpgrade = lazy(() => import('./admin/AdminUpgrade'));
const AdminSubscription = lazy(() => import('./admin/AdminSubscription'));
const AdminDomains = lazy(() => import('./admin/AdminDomains'));
const AdminInventory = lazy(() => import('./admin/AdminInventory'));
const AdminSuppliers = lazy(() => import('./admin/AdminSuppliers'));
const AdminPurchaseOrders = lazy(() => import('./admin/AdminPurchaseOrders'));
const AdminBatches = lazy(() => import('./admin/AdminBatches'));
const AdminPOS = lazy(() => import('./admin/AdminPOS'));
const AdminPOSReports = lazy(() => import('./admin/AdminPOSReports'));
const AdminDeliveryBoys = lazy(() => import('./admin/AdminDeliveryBoys'));
const AdminDeliveryAreas = lazy(() => import('./admin/AdminDeliveryAreas'));
const AdminDeliveryOrders = lazy(() => import('./admin/AdminDeliveryOrders'));
const AdminDeliveryPayouts = lazy(() => import('./admin/AdminDeliveryPayouts'));
const AdminAccount = lazy(() => import('./admin/AdminAccount'));
const AdminAnalytics = lazy(() => import('./admin/AdminAnalytics'));

// Skeleton loading for route transitions - feels much faster than spinner
function PageLoader() {
  return <DashboardSkeleton />;
}

// Wrapper to pass productId from route params
function ProductFormWrapper({ tenantId, disabled }: { tenantId: string; disabled: boolean }) {
  const { productId } = useParams<{ productId: string }>();
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminProductForm tenantId={tenantId} productId={productId} disabled={disabled} />
    </Suspense>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, tenant, loading, signOut, switchTenant, refreshTenants } = useAuth();
  const [showTrialPopup, setShowTrialPopup] = useState(false);

  // Single redirect effect - runs once when auth state is determined
  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;
    
    // If not logged in, redirect to auth
    if (!user) {
      navigate('/authentication', { replace: true });
      return;
    }
    
    // If onboarding not completed, redirect there
    if (profile && !profile.onboarding_completed) {
      navigate('/onboarding', { replace: true });
    }
  }, [user, profile, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/authentication', { replace: true });
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

  // Show trial popup on login/signup or when trial expires
  useEffect(() => {
    if (!loading && tenant) {
      if (tenant.plan === 'pro') {
        setShowTrialPopup(false);
        return;
      }
      
      if (tenant.plan === 'trial') {
        const popupKey = `trial_popup_shown_${tenant.id}`;
        const hasShownThisSession = sessionStorage.getItem(popupKey);
        
        if (isTrialExpired) {
          setShowTrialPopup(true);
        } else if (!hasShownThisSession) {
          setShowTrialPopup(true);
          sessionStorage.setItem(popupKey, 'true');
        }
      }
    }
  }, [loading, tenant, isTrialExpired]);

  const handleTenantChange = async (newTenantId: string) => {
    await switchTenant(newTenantId);
  };

  // Show skeleton while auth is loading or we don't have tenant yet
  // Skeleton feels much faster than spinner
  if (loading || !tenant) {
    return (
      <div className="min-h-screen bg-background">
        {/* Show a shell with skeleton content */}
        <div className="flex h-screen">
          {/* Sidebar skeleton */}
          <div className="hidden lg:flex w-64 flex-col border-r bg-card p-4 space-y-4">
            <div className="h-10 w-full rounded-lg bg-muted/60 animate-pulse" />
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-9 w-full rounded-lg bg-muted/40 animate-pulse" />
              ))}
            </div>
          </div>
          {/* Main content skeleton */}
          <div className="flex-1 overflow-auto">
            <div className="h-14 border-b bg-card px-6 flex items-center justify-between">
              <div className="h-6 w-32 rounded bg-muted/60 animate-pulse" />
              <div className="h-9 w-9 rounded-full bg-muted/60 animate-pulse" />
            </div>
            <DashboardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const isGrocery = tenant.business_type === 'grocery';

  return (
    <>
      <TrialPopup
        tenant={tenant}
        isTrialExpired={isTrialExpired}
        onUpgrade={handleUpgrade}
        open={showTrialPopup}
        onOpenChange={setShowTrialPopup}
      />
      <AdminLayout
        storeName={tenant.store_name}
        storeSlug={tenant.store_slug}
        tenantId={tenant.id}
        businessType={tenant.business_type}
        onSignOut={handleSignOut}
        onTenantChange={handleTenantChange}
        isTrialExpired={isTrialExpired}
        onUpgrade={handleUpgrade}
      >
        <Suspense fallback={<PageLoader />}>
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
            <Route path="page-builder" element={<AdminPageBuilder tenantId={tenant.id} disabled={isTrialExpired} />} />
            <Route path="banners" element={<AdminStoreBanners tenantId={tenant.id} disabled={isTrialExpired} />} />
            <Route path="pages" element={<AdminStorePages tenantId={tenant.id} storeSlug={tenant.store_slug} disabled={isTrialExpired} />} />
            <Route path="upgrade" element={<AdminUpgrade />} />
            <Route path="subscription" element={<AdminSubscription />} />
            <Route path="domains" element={<AdminDomains />} />
            <Route path="stores" element={<AdminStores onTenantChange={handleTenantChange} onRefresh={refreshTenants} />} />
            <Route path="account" element={<AdminAccount />} />
            <Route path="analytics" element={<AdminAnalytics tenantId={tenant.id} />} />
            {/* Inventory Management */}
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
        </Suspense>
      </AdminLayout>
    </>
  );
}
