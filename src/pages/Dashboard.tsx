import { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { toast } from 'sonner';
import AdminDashboard from './admin/AdminDashboard';
import AdminProducts from './admin/AdminProducts';
import AdminCategories from './admin/AdminCategories';
import AdminOrders from './admin/AdminOrders';
import AdminOrderDetail from './admin/AdminOrderDetail';
import AdminSettings from './admin/AdminSettings';
import AdminIntegrations from './admin/AdminIntegrations';
import AdminDeliveryZones from './admin/AdminDeliveryZones';
import AdminDeliverySlots from './admin/AdminDeliverySlots';
import AdminDeliverySettings from './admin/AdminDeliverySettings';
import AdminProductAvailability from './admin/AdminProductAvailability';

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

  const handleUpgrade = async () => {
    toast.info('Please configure Razorpay in Integrations to enable payments.');
    navigate('/dashboard/integrations');
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
        <Route path="categories" element={<AdminCategories tenantId={tenant.id} disabled={isTrialExpired} />} />
        <Route path="orders" element={<AdminOrders tenantId={tenant.id} />} />
        <Route path="orders/:orderId" element={<AdminOrderDetail tenantId={tenant.id} disabled={isTrialExpired} />} />
        <Route path="settings" element={<AdminSettings tenant={tenant} disabled={isTrialExpired} />} />
        <Route path="integrations" element={<AdminIntegrations tenantId={tenant.id} disabled={isTrialExpired} />} />
        {isGrocery && (
          <>
            <Route path="delivery-zones" element={<AdminDeliveryZones tenantId={tenant.id} disabled={isTrialExpired} />} />
            <Route path="delivery-slots" element={<AdminDeliverySlots tenantId={tenant.id} disabled={isTrialExpired} />} />
            <Route path="delivery-settings" element={<AdminDeliverySettings tenantId={tenant.id} disabled={isTrialExpired} />} />
            <Route path="product-availability" element={<AdminProductAvailability tenantId={tenant.id} disabled={isTrialExpired} />} />
          </>
        )}
      </Routes>
    </AdminLayout>
  );
}
