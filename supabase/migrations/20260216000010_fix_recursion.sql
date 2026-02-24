-- Fix Infinite Recursion in Profiles RLS
-- The previous policy queried public.profiles inside the policy itself, causing an infinite loop.
-- Solution: Use a SECURITY DEFINER function to fetch the role. This acts as a "sudo" command, bypassing RLS.

-- 1. Create a secure function to get the current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT
  FROM public.profiles
  WHERE id = auth.uid();
$$;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "Admins can view tenant profiles" ON public.profiles;

-- 3. Re-create the policy using the safe function
CREATE POLICY "Admins can view tenant profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        tenant_id = public.get_user_tenant_id()
        AND 
        public.get_user_role() IN ('owner', 'admin', 'super_admin')
    );

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
