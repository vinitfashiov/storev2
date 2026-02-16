-- Fix RLS policies for return_requests table
-- Issue: Customer inserts are failing because tenant_id validation is missing

-- Drop existing policies
DROP POLICY IF EXISTS "Customers can create return requests" ON public.return_requests;
DROP POLICY IF EXISTS "Admins can view all return requests" ON public.return_requests;
DROP POLICY IF EXISTS "Admins can update return requests" ON public.return_requests;

-- Recreate customer insert policy with tenant_id validation from order
CREATE POLICY "Customers can create return requests" ON public.return_requests
    FOR INSERT TO authenticated
    WITH CHECK (
        customer_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = return_requests.order_id
            AND orders.customer_id = auth.uid()
            AND orders.tenant_id = return_requests.tenant_id
        )
    );

-- Recreate admin policies with correct role reference ('owner' instead of 'admin')
CREATE POLICY "Admins can view all return requests" ON public.return_requests
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'super_admin')
            AND profiles.tenant_id = return_requests.tenant_id
        ) OR
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    );

CREATE POLICY "Admins can update return requests" ON public.return_requests
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'super_admin')
            AND profiles.tenant_id = return_requests.tenant_id
        ) OR
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    );
