-- Robust Profiles Access Policy
-- Issue: Admin could not see Profiles (name/email) because previous policy relied on return_requests.tenant_id which might be missing.
-- Solution: Allow viewing Profile if it is linked to a Return Request -> Order -> Tenant.

DROP POLICY IF EXISTS "Admins can view tenant profiles" ON public.profiles;

CREATE POLICY "Admins can view tenant profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        public.get_user_role() = 'super_admin'
        OR
        (
            public.get_user_role() IN ('owner', 'super_admin')
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
