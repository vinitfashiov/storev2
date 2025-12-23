import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Tenant {
  id: string;
  store_name: string;
  store_slug: string;
  business_type: 'ecommerce' | 'grocery';
  plan: 'trial' | 'pro';
  trial_ends_at: string;
  is_active: boolean;
  address: string | null;
  phone: string | null;
}

interface CustomDomainContextType {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  isCustomDomain: boolean;
}

const CustomDomainContext = createContext<CustomDomainContextType>({
  tenant: null,
  loading: true,
  error: null,
  isCustomDomain: false,
});

export function useCustomDomain() {
  return useContext(CustomDomainContext);
}

// List of platform domains that should not be treated as custom domains
const PLATFORM_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'lovableproject.com',
  'lovable.app',
  'vercel.app',
  'netlify.app',
];

function isPlatformDomain(hostname: string): boolean {
  return PLATFORM_DOMAINS.some(domain => 
    hostname === domain || 
    hostname.endsWith(`.${domain}`) ||
    hostname.includes('localhost')
  );
}

interface CustomDomainProviderProps {
  children: ReactNode;
}

export function CustomDomainProvider({ children }: CustomDomainProviderProps) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCustomDomain, setIsCustomDomain] = useState(false);

  useEffect(() => {
    const resolveTenant = async () => {
      const hostname = window.location.hostname.toLowerCase();
      
      // Check if this is a custom domain (not a platform domain)
      if (!isPlatformDomain(hostname)) {
        setIsCustomDomain(true);
        
        // Look up tenant by custom domain
        const { data: domainData, error: domainError } = await supabase
          .from('custom_domains')
          .select('tenant_id')
          .eq('domain', hostname)
          .eq('status', 'active')
          .maybeSingle();

        if (domainError || !domainData) {
          // Also try with www prefix removed
          const withoutWww = hostname.replace(/^www\./, '');
          const { data: altDomainData } = await supabase
            .from('custom_domains')
            .select('tenant_id')
            .eq('domain', withoutWww)
            .eq('status', 'active')
            .maybeSingle();

          if (!altDomainData) {
            setError('Domain not configured');
            setLoading(false);
            return;
          }
          
          // Fetch tenant
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', altDomainData.tenant_id)
            .eq('is_active', true)
            .maybeSingle();

          if (tenantData) {
            // Check trial expiry
            const trialEnd = new Date(tenantData.trial_ends_at);
            const now = new Date();
            if (tenantData.plan === 'trial' && trialEnd < now) {
              setError('This store is currently unavailable');
            } else {
              setTenant(tenantData as Tenant);
            }
          } else {
            setError('Store not found');
          }
        } else {
          // Fetch tenant
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', domainData.tenant_id)
            .eq('is_active', true)
            .maybeSingle();

          if (tenantData) {
            const trialEnd = new Date(tenantData.trial_ends_at);
            const now = new Date();
            if (tenantData.plan === 'trial' && trialEnd < now) {
              setError('This store is currently unavailable');
            } else {
              setTenant(tenantData as Tenant);
            }
          } else {
            setError('Store not found');
          }
        }
      }
      
      setLoading(false);
    };

    resolveTenant();
  }, []);

  return (
    <CustomDomainContext.Provider value={{ tenant, loading, error, isCustomDomain }}>
      {children}
    </CustomDomainContext.Provider>
  );
}
