-- Fix the security definer view issue - use security invoker
DROP VIEW IF EXISTS public.tenants_public;

CREATE VIEW public.tenants_public 
WITH (security_invoker=on) AS
SELECT 
  id,
  store_name,
  store_slug,
  business_type,
  is_active
FROM public.tenants
WHERE is_active = true;

-- Grant select on the public view
GRANT SELECT ON public.tenants_public TO anon, authenticated;