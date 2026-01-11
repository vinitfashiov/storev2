import { useEffect, useState, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StoreAuthProvider } from '@/contexts/StoreAuthContext';
import { AlertTriangle, Trash2 } from 'lucide-react';

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
  deleted_at: string | null;
}

type StoreStatus = 'loading' | 'active' | 'deleted' | 'expired' | 'not_found';

export default function StoreGuard({ children }: StoreGuardProps) {
  const { slug } = useParams<{ slug: string }>();
  const [status, setStatus] = useState<StoreStatus>('loading');
  const [tenant, setTenant] = useState<TenantStatus | null>(null);

  useEffect(() => {
    const checkTenant = async () => {
      if (!slug) {
        setStatus('not_found');
        return;
      }

      // Check including deleted stores
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('id, store_name, store_slug, business_type, is_active, plan, trial_ends_at, deleted_at')
        .eq('store_slug', slug)
        .maybeSingle();

      if (!tenantData) {
        setStatus('not_found');
        return;
      }

      // Check if store is deleted
      if (tenantData.deleted_at) {
        setTenant(tenantData as TenantStatus);
        setStatus('deleted');
        return;
      }

      const now = new Date();
      const trialEndsAt = new Date(tenantData.trial_ends_at);
      const active = tenantData.is_active && (tenantData.plan === 'pro' || now < trialEndsAt);
      
      if (!active) {
        setTenant(tenantData as TenantStatus);
        setStatus('expired');
        return;
      }

      setTenant(tenantData as TenantStatus);
      setStatus('active');
    };

    checkTenant();
  }, [slug]);

if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header skeleton */}
        <div className="p-4 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <div className="w-24 h-8 bg-neutral-200 rounded animate-pulse" />
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-neutral-200 rounded-full animate-pulse" />
              <div className="w-8 h-8 bg-neutral-200 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
        {/* Content skeleton */}
        <div className="p-4 space-y-4">
          <div className="w-full h-40 bg-neutral-100 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="aspect-square bg-neutral-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Deleted store - show beautiful 3D graphic
  if (status === 'deleted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-100">
        <div className="text-center max-w-md mx-auto px-4">
          {/* 3D Style Graphic */}
          <div className="relative mb-8">
            {/* Shadow */}
            <div className="absolute inset-0 transform translate-y-4 blur-2xl opacity-30">
              <div className="w-32 h-32 mx-auto bg-red-400 rounded-3xl" />
            </div>
            {/* Main 3D Box */}
            <div className="relative w-32 h-32 mx-auto">
              {/* Back face */}
              <div className="absolute inset-0 transform translate-x-2 translate-y-2 bg-red-300 rounded-3xl" />
              {/* Front face */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-500 rounded-3xl flex items-center justify-center shadow-xl">
                <Trash2 className="w-14 h-14 text-white drop-shadow-lg" />
              </div>
              {/* Shine effect */}
              <div className="absolute top-3 left-3 w-8 h-8 bg-white/20 rounded-full blur-sm" />
            </div>
            {/* Floating particles */}
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-red-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="absolute -bottom-1 -left-3 w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            <div className="absolute top-1/2 -right-4 w-2 h-2 bg-red-200 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
          </div>
          
          <h1 className="text-3xl font-bold text-neutral-800 mb-3">
            Store Deleted
          </h1>
          <p className="text-neutral-500 text-lg mb-6">
            This store has been permanently removed by its owner.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-full text-neutral-500 text-sm">
            <span className="w-2 h-2 bg-red-400 rounded-full" />
            No longer available
          </div>
        </div>
      </div>
    );
  }

  // Expired subscription
  if (status === 'expired' || status === 'not_found' || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {status === 'not_found' ? 'Store not found' : 'Store temporarily unavailable'}
          </h1>
          <p className="text-muted-foreground">
            {status === 'not_found' 
              ? 'The store you are looking for does not exist.'
              : "This store's subscription has expired. Please contact the store owner for more information."
            }
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
