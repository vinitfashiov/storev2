import { ReactNode, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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

  const { data: tenantData, isLoading } = useQuery({
    queryKey: ['store-guard', slug],
    queryFn: async (): Promise<TenantStatus | null> => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('tenants')
        .select('id, store_name, store_slug, business_type, is_active, plan, trial_ends_at, deleted_at')
        .eq('store_slug', slug)
        .maybeSingle();

      if (error) {
        console.error('[StoreGuard] tenant fetch failed', error);
        return null;
      }

      return (data as TenantStatus) ?? null;
    },
    enabled: !!slug,
    // Performance: store status rarely changes; keep cached during navigation
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const { status, tenant } = useMemo((): { status: StoreStatus; tenant: TenantStatus | null } => {
    if (!slug) return { status: 'not_found', tenant: null };
    if (isLoading) return { status: 'loading', tenant: null };
    if (!tenantData) return { status: 'not_found', tenant: null };

    if (tenantData.deleted_at) {
      return { status: 'deleted', tenant: tenantData };
    }

    const now = new Date();
    const trialEndsAt = new Date(tenantData.trial_ends_at);
    const active = tenantData.is_active && (tenantData.plan === 'pro' || now < trialEndsAt);

    if (!active) {
      return { status: 'expired', tenant: tenantData };
    }

    return { status: 'active', tenant: tenantData };
  }, [slug, isLoading, tenantData]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="p-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="w-24 h-8 bg-muted rounded animate-pulse" />
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
              <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
            </div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="w-full h-40 bg-muted/40 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-square bg-muted/40 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'deleted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/40 via-background to-muted/40">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="relative mb-8">
            <div className="absolute inset-0 transform translate-y-4 blur-2xl opacity-30">
              <div className="w-32 h-32 mx-auto bg-destructive/40 rounded-3xl" />
            </div>
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 transform translate-x-2 translate-y-2 bg-destructive/30 rounded-3xl" />
              <div className="absolute inset-0 bg-destructive rounded-3xl flex items-center justify-center shadow-xl">
                <Trash2 className="w-14 h-14 text-destructive-foreground" />
              </div>
              <div className="absolute top-3 left-3 w-8 h-8 bg-background/20 rounded-full blur-sm" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-3">Store Deleted</h1>
          <p className="text-muted-foreground text-lg mb-6">This store has been permanently removed by its owner.</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-muted-foreground text-sm">
            <span className="w-2 h-2 bg-destructive rounded-full" />
            No longer available
          </div>
        </div>
      </div>
    );
  }

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
              : "This store's subscription has expired. Please contact the store owner for more information."}
          </p>
        </div>
      </div>
    );
  }

  return <StoreAuthProvider tenantId={tenant.id}>{children}</StoreAuthProvider>;
}

// Export tenant context hook for child components
export { useStoreTenant } from '@/hooks/useStoreTenant';

