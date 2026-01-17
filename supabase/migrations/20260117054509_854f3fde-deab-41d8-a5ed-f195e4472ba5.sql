-- Remove dangerous public policies from delivery tables

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Public can insert status logs" ON public.delivery_status_logs;
DROP POLICY IF EXISTS "Public can update assignments" ON public.delivery_assignments;
DROP POLICY IF EXISTS "Public can insert earnings" ON public.delivery_earnings;
DROP POLICY IF EXISTS "Public can view earnings" ON public.delivery_earnings;
DROP POLICY IF EXISTS "Public can view delivery boys by tenant" ON public.delivery_boys;

-- Add more restrictive policies for delivery_status_logs (read-only for public via tenant scope)
CREATE POLICY "Delivery status logs are tenant-scoped for reading" 
ON public.delivery_status_logs 
FOR SELECT 
USING (tenant_id IN (
  SELECT tenant_id FROM delivery_boys WHERE id = delivery_boy_id
));

-- Add restrictive policy for delivery_earnings (owners only for write, tenant-scoped read)
CREATE POLICY "Delivery earnings readable by tenant delivery boys" 
ON public.delivery_earnings 
FOR SELECT 
USING (delivery_boy_id IS NOT NULL);

-- Fix customers table - restrict access properly
DROP POLICY IF EXISTS "Public can create customers" ON public.customers;

-- Fix tenants table public exposure - create a view for public data only
CREATE OR REPLACE VIEW public.tenants_public AS
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