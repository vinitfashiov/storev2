-- Diagnostic: Open Return Requests Visibility
-- CAUTION: This removes tenant isolation for return requests TEMPORARILY.
-- Use this to check if data exists but is being hidden by RLS.

DROP POLICY IF EXISTS "Admins can view all return requests" ON public.return_requests;

CREATE POLICY "Admins can view all return requests" ON public.return_requests
    FOR SELECT TO authenticated
    USING (true);
