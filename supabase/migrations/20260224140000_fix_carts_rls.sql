-- Fix carts table RLS policies to allow Add to Cart to function correctly for all visitors

-- Drop old policies that caused RLS violations
DROP POLICY IF EXISTS "Anonymous users can access carts by id" ON public.carts;
DROP POLICY IF EXISTS "Any authenticated user can create carts" ON public.carts;
DROP POLICY IF EXISTS "Authenticated customers can view their carts" ON public.carts;
DROP POLICY IF EXISTS "Users can update their own carts" ON public.carts;
DROP POLICY IF EXISTS "Tenant owners can manage carts" ON public.carts;

-- Create simplified, robust policies
CREATE POLICY "Anyone can view carts" ON public.carts FOR SELECT USING (status = 'active' OR tenant_id = get_user_tenant_id());
CREATE POLICY "Anyone can create carts" ON public.carts FOR INSERT WITH CHECK (tenant_id IS NOT NULL AND EXISTS (SELECT 1 FROM tenants WHERE id = tenant_id AND is_active = true));
CREATE POLICY "Anyone can update carts" ON public.carts FOR UPDATE USING (tenant_id IS NOT NULL);
CREATE POLICY "Tenant owners can manage carts" ON public.carts FOR ALL USING (tenant_id = get_user_tenant_id());
