import { useEffect, useState, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StoreAuthProvider } from '@/contexts/StoreAuthContext';
import { AlertTriangle } from 'lucide-react';

interface StoreGuardProps {
  children: ReactNode;
}

interface TenantStatus {
  id: string;
  store_name: string;
  store_slug: string;
  business_type: 'ecommerce' | 'grocery';
  is_active: boolean;
  plan: 'trial' | 'pro';
  trial_ends_at: string;
}

export default function StoreGuard({ children }: StoreGuardProps) {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [tenant, setTenant] = useState<TenantStatus | null>(null);

  useEffect(() => {
    const checkTenant = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      const { data: tenantData } = await supabase
        .from('tenants')
        .select('id, store_name, store_slug, business_type, is_active, plan, trial_ends_at')
        .eq('store_slug', slug)
        .maybeSingle();

      if (!tenantData) {
        setIsActive(false);
        setLoading(false);
        return;
      }

      const now = new Date();
      const trialEndsAt = new Date(tenantData.trial_ends_at);
      const active = tenantData.is_active && (tenantData.plan === 'pro' || now < trialEndsAt);
      
      setTenant(tenantData as TenantStatus);
      setIsActive(active);
      setLoading(false);
    };

    checkTenant();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isActive || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Store temporarily unavailable</h1>
          <p className="text-muted-foreground">
            This store's subscription has expired. Please contact the store owner for more information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <StoreAuthProvider tenantId={tenant.id}>
      {children}
    </StoreAuthProvider>
  );
}

// Export tenant context hook for child components
export { useStoreTenant } from '@/hooks/useStoreTenant';
