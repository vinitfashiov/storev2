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

// Cache for domain lookups (5 minutes)
const domainCache = new Map<string, { tenant: Tenant | null; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CustomDomainProviderProps {
  children: ReactNode;
}

export function CustomDomainProvider({ children }: CustomDomainProviderProps) {
  const hostname = window.location.hostname.toLowerCase();
  const isPlatform = isPlatformDomain(hostname);

  // For platform domains, skip all async work - return immediately
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(!isPlatform); // Not loading for platform domains
  const [error, setError] = useState<string | null>(null);
  const [isCustomDomain, setIsCustomDomain] = useState(!isPlatform);

  useEffect(() => {
    // Skip entirely for platform domains
    if (isPlatform) return;

    const resolveTenant = async () => {
      // Check cache first
      const cached = domainCache.get(hostname);
      if (cached && cached.expiresAt > Date.now()) {
        setTenant(cached.tenant);
        setLoading(false);
        return;
      }

      // Try exact match
      let domainData = null;
      const { data: exactMatch } = await supabase
        .from('custom_domains')
        .select('tenant_id')
        .eq('domain', hostname)
        .maybeSingle();

      if (exactMatch) {
        domainData = exactMatch;
      } else {
        // Try without www
        const withoutWww = hostname.replace(/^www\./, '');
        const { data: wwwMatch } = await supabase
          .from('custom_domains')
          .select('tenant_id')
          .eq('domain', withoutWww)
          .maybeSingle();

        domainData = wwwMatch;
      }

      if (!domainData) {
        // Not a custom domain after all
        setIsCustomDomain(false);
        setError(null);
        setTenant(null);
        setLoading(false);
        domainCache.set(hostname, { tenant: null, expiresAt: Date.now() + CACHE_TTL });
        return;
      }

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
          domainCache.set(hostname, { tenant: null, expiresAt: Date.now() + CACHE_TTL });
        } else {
          setTenant(tenantData as Tenant);
          domainCache.set(hostname, { tenant: tenantData as Tenant, expiresAt: Date.now() + CACHE_TTL });
        }
      } else {
        setError('Store not found');
        domainCache.set(hostname, { tenant: null, expiresAt: Date.now() + CACHE_TTL });
      }

      setLoading(false);
    };

    resolveTenant();
  }, [isPlatform, hostname]);

  return (
    <CustomDomainContext.Provider value={{ tenant, loading, error, isCustomDomain }}>
      {children}
    </CustomDomainContext.Provider>
  );
}
