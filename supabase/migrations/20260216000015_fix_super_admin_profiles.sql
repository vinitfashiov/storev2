-- 1. Ensure get_user_role exists and is robust
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- 2. Update Profiles Policy to explicitly use is_super_admin()
DROP POLICY IF EXISTS "Admins can view tenant profiles" ON public.profiles;

CREATE POLICY "Admins can view tenant profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        -- Explicit Super Admin Check (Safest)
        public.is_super_admin()
        OR
        (
            -- Owner Check (using the function we just ensured exists)
            public.get_user_role() = 'owner'
            AND
            (
                -- 1. Direct Tenant Match
                tenant_id = public.get_user_tenant_id()
                OR
                -- 2. Linked via Customer Record
                EXISTS (
                    SELECT 1 FROM public.customers
                    WHERE customers.user_id = profiles.id
                    AND customers.tenant_id = public.get_user_tenant_id()
                )
                OR
                -- 3. Linked via Return Request (Robust: Check Order's Tenant)
                EXISTS (
                    SELECT 1 FROM public.return_requests
                    WHERE return_requests.customer_id = profiles.id
                    AND EXISTS (
                        SELECT 1 FROM public.orders
                        WHERE orders.id = return_requests.order_id
                        AND orders.tenant_id = public.get_user_tenant_id()
                    )
                )
            )
        )
    );
