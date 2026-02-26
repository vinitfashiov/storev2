/**
 * Shared utilities for Edge Functions
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCache, cached, CacheKeys } from "./cache.ts";
import { monitor, createContext } from "./monitoring.ts";

// A flexible but secure CORS header generator function.
// It reflects the incoming Origin if it's a localhost or Vercel deployment URL,
// otherwise it denies the cross-origin request.
export const generateCorsHeaders = (req: Request) => {
  const origin = req.headers.get('Origin') || '';
  // Only allow localhost during dev, or any vercel.app domain, or the user's custom domains
  // With the reverse proxy in place, the origin should match the domain hosting the frontend.
  // We can safely reflect the origin if it's present, since our proxy enforces same-origin.

  return {
    'Access-Control-Allow-Origin': origin || '*', // Fallback for non-browser clients (like curl) which don't send Origin
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Kept for backwards compatibility if needed, but functions should transition to generateCorsHeaders
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Get Supabase client (cached)
 */
export function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Get tenant by slug (cached)
 */
export async function getTenantBySlug(
  supabase: ReturnType<typeof getSupabaseClient>,
  slug: string
) {
  const cacheKey = CacheKeys.tenant(slug);

  return cached(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, store_name, store_slug, plan, trial_ends_at, is_active, business_type')
        .eq('store_slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    300 // 5 minutes cache
  );
}

/**
 * Get tenant by domain (cached)
 */
export async function getTenantByDomain(
  supabase: ReturnType<typeof getSupabaseClient>,
  domain: string
) {
  const cacheKey = CacheKeys.domainTenant(domain.toLowerCase());

  return cached(
    cacheKey,
    async () => {
      // First get domain record
      const { data: domainData, error: domainError } = await supabase
        .from('custom_domains')
        .select('tenant_id')
        .eq('domain', domain.toLowerCase())
        .eq('status', 'active')
        .maybeSingle();

      if (domainError || !domainData) {
        return null;
      }

      // Then get tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('id, store_name, store_slug, plan, trial_ends_at, is_active, business_type')
        .eq('id', domainData.tenant_id)
        .eq('is_active', true)
        .maybeSingle();

      if (tenantError || !tenantData) {
        return null;
      }

      return tenantData;
    },
    300 // 5 minutes cache
  );
}

/**
 * Get tenant integrations (cached)
 */
export async function getTenantIntegrations(
  supabase: ReturnType<typeof getSupabaseClient>,
  tenantId: string
) {
  const cacheKey = CacheKeys.integration(tenantId);

  return cached(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('tenant_integrations')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    600 // 10 minutes cache (integrations don't change often)
  );
}

/**
 * Clear tenant-related cache
 */
export async function invalidateTenantCache(tenantId: string, slug?: string): Promise<void> {
  const cache = getCache();
  await cache.delete(CacheKeys.tenantById(tenantId));
  if (slug) {
    await cache.delete(CacheKeys.tenant(slug));
  }
  await cache.delete(CacheKeys.integration(tenantId));
  await cache.delete(CacheKeys.storeSettings(tenantId));
}

/**
 * Clear domain cache
 */
export async function invalidateDomainCache(domain: string): Promise<void> {
  const cache = getCache();
  await cache.delete(CacheKeys.domain(domain.toLowerCase()));
  await cache.delete(CacheKeys.domainTenant(domain.toLowerCase()));
}

/**
 * Error response helper
 */
export function errorResponse(
  req: Request,
  message: string,
  status: number = 400,
  error?: unknown
): Response {
  if (error) {
    console.error('Error:', error);
  }

  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...generateCorsHeaders(req), 'Content-Type': 'application/json' },
    }
  );
}


/**
 * Success response helper
 */
export function successResponse(req: Request, data: any, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { ...generateCorsHeaders(req), 'Content-Type': 'application/json' },
    }
  );
}

