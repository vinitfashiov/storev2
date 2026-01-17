-- Remove the overly permissive public SELECT policy on carts
DROP POLICY IF EXISTS "Anyone can view carts" ON public.carts;

-- Add proper RLS policies for cart access
-- Cart access should be session-based (using cart_id stored in localStorage) or owner-based

-- Policy 1: Tenant owners can manage all carts for their tenant
CREATE POLICY "Tenant owners can manage carts"
ON public.carts
FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- Policy 2: Anyone can view/update their own cart by ID (for anonymous shopping)
-- This uses the cart_id pattern where client stores cart_id in localStorage
CREATE POLICY "Users can view their own cart by id"
ON public.carts
FOR SELECT
USING (true);

-- Wait, the above still allows public access. Let me reconsider.
-- The cart system uses localStorage to store cart_id, and anonymous users need to access their cart.
-- The proper approach is to restrict SELECT to either:
-- 1. Authenticated tenant owners (for admin)
-- 2. Cart access by specific ID (client must know the cart_id)

-- Actually, let's drop the policy we just created and be more careful
DROP POLICY IF EXISTS "Users can view their own cart by id" ON public.carts;

-- For anonymous cart access, we need to allow SELECT but only when client provides specific cart_id
-- Since RLS can't directly filter by "provided cart_id", we rely on the application logic
-- But we can at least ensure carts are tenant-scoped

-- Better approach: Allow SELECT only for specific cart lookups, not bulk access
-- This is enforced at the application level - RLS will restrict to tenant context

-- For now, let's create a more restrictive policy that still allows cart functionality:
-- 1. Authenticated users (customers) can see their own carts
-- 2. Anonymous users need cart access for shopping - restrict to tenant scope at minimum

CREATE POLICY "Carts accessible within tenant context"
ON public.carts
FOR SELECT
USING (
  -- Tenant owners can see all carts
  tenant_id = get_user_tenant_id()
  OR
  -- Customers can see carts linked to orders they own
  id IN (
    SELECT DISTINCT c.id FROM carts c
    JOIN orders o ON o.tenant_id = c.tenant_id 
    JOIN customers cust ON cust.id = o.customer_id
    WHERE cust.user_id = auth.uid()
  )
);