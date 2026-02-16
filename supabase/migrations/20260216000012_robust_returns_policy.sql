-- Make Return Requests RLS Robust
-- Issue: Some return requests might have incorrect/missing tenant_id due to frontend issues.
-- Solution: Allow Owners to view return requests if the LINKED ORDER belongs to their tenant.

DROP POLICY IF EXISTS "Admins can view all return requests" ON public.return_requests;

CREATE POLICY "Admins can view all return requests" ON public.return_requests
    FOR SELECT TO authenticated
    USING (
        -- Super Admins see everything
        public.get_user_role() = 'super_admin'
        OR
        (
            -- Owners/Admins check:
            public.get_user_role() IN ('owner', 'admin')
            AND 
            (
                -- 1. Direct Tenant Match (Fastest)
                tenant_id = public.get_user_tenant_id()
                OR
                -- 2. Fallback: Check Linked Order's Tenant (Robustness)
                EXISTS (
                    SELECT 1 FROM public.orders
                    WHERE orders.id = return_requests.order_id
                    AND orders.tenant_id = public.get_user_tenant_id()
                )
            )
        )
    );
