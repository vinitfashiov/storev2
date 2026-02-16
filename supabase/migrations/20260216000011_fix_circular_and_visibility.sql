-- Fix Admin Returns Page "Failed to fetch"
-- 1. Update return_requests policy to use helper functions (avoids querying profiles table directly, preventing loops)
-- 2. Expand profiles policy to allow seeing any user who has a transaction in the tenant

-- Step 1: Optimize return_requests policy to use SECURITY DEFINER functions
DROP POLICY IF EXISTS "Admins can view all return requests" ON public.return_requests;

CREATE POLICY "Admins can view all return requests" ON public.return_requests
    FOR SELECT TO authenticated
    USING (
        -- Check role using function (bypasses RLS recursion)
        (public.get_user_role() IN ('owner', 'super_admin') AND tenant_id = public.get_user_tenant_id())
        OR
        public.get_user_role() = 'super_admin'
    );

-- Step 2: Expand profiles policy to be "Transactional"
-- Allow admins to see profiles of people who interacted with their store
DROP POLICY IF EXISTS "Admins can view tenant profiles" ON public.profiles;

CREATE POLICY "Admins can view tenant profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        public.get_user_role() IN ('owner', 'admin', 'super_admin') 
        AND
        (
            -- 1. Profile belongs to the tenant (direct match)
            tenant_id = public.get_user_tenant_id()
            OR
            -- 2. Profile has a return request in the tenant
            EXISTS (
                SELECT 1 FROM public.return_requests
                WHERE return_requests.customer_id = profiles.id
                AND return_requests.tenant_id = public.get_user_tenant_id()
            )
            OR
            -- 3. Profile is linked to a customer record in the tenant
            EXISTS (
                SELECT 1 FROM public.customers
                WHERE customers.user_id = profiles.id
                AND customers.tenant_id = public.get_user_tenant_id()
            )
        )
    );
