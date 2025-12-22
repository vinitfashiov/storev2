import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Tenant {
  id: string;
  store_name: string;
  store_slug: string;
  business_type: 'ecommerce' | 'grocery';
}

export function useStoreTenant() {
  const { slug } = useParams<{ slug: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [slug]);

  return { tenant, loading };
}
