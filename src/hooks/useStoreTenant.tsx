import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCustomDomain } from '@/contexts/CustomDomainContext';

interface Tenant {
  id: string;
  store_name: string;
  store_slug: string;
  business_type: 'ecommerce' | 'grocery';
}

export function useStoreTenant() {
  const { slug } = useParams<{ slug: string }>();
  const customDomain = useCustomDomain();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If we're on a custom domain, use that tenant
    if (customDomain.isCustomDomain && customDomain.tenant) {
      setTenant({
        id: customDomain.tenant.id,
        store_name: customDomain.tenant.store_name,
        store_slug: customDomain.tenant.store_slug,
        business_type: customDomain.tenant.business_type,
      });
      setLoading(false);
      return;
    }

    // Otherwise, fetch by slug
    const fetchTenant = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('tenants')
        .select('id, store_name, store_slug, business_type')
        .eq('store_slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        setTenant(data as Tenant);
      }
      setLoading(false);
    };

    fetchTenant();
  }, [slug, customDomain.isCustomDomain, customDomain.tenant]);

  return { tenant, loading };
}
