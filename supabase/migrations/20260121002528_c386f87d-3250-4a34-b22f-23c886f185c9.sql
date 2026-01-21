-- The carts table has RESTRICTIVE owner policy for ALL which blocks customer inserts.
-- Recreate the owner policy as PERMISSIVE so either owner OR customer insert policies can pass.

DROP POLICY IF EXISTS "Tenant owners can manage carts" ON public.carts;

CREATE POLICY "Tenant owners can manage carts"
ON public.carts
AS PERMISSIVE
FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- Also ensure the customer/authenticated insert policy is PERMISSIVE (default), recreate explicitly.
DROP POLICY IF EXISTS "Any authenticated user can create carts" ON public.carts;

CREATE POLICY "Any authenticated user can create carts"
ON public.carts
AS PERMISSIVE
FOR INSERT
WITH CHECK (
  tenant_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.tenants
    WHERE tenants.id = tenant_id
      AND tenants.is_active = true
  )
);