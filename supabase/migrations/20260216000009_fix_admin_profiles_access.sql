-- Fix Admin Access to Profiles
-- Admins need to see the profiles of customers who submitted return requests.
-- The current 'profiles' policy only allows viewing your OWN profile.
-- We need to allow Admins/Owners to view ALL profiles in their tenant.

CREATE POLICY "Admins can view tenant profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        tenant_id = public.get_user_tenant_id()
        AND (
            SELECT role FROM public.profiles WHERE id = auth.uid()
        ) IN ('owner', 'admin', 'super_admin')
    );
