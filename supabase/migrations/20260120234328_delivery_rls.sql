-- =====================================================
-- 3. TIGHTEN DELIVERY ASSIGNMENTS RLS
-- Remove public SELECT, add proper tenant scoping
-- Extracted from 20260120234326...
-- =====================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public can view assignments by tenant" ON public.delivery_assignments;

-- Create a proper policy for delivery boys to view their assignments
CREATE POLICY "Delivery boys can view their assignments"
ON public.delivery_assignments
FOR SELECT
USING (
  tenant_id = get_user_tenant_id()
  OR 
  EXISTS (
    SELECT 1 FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE o.id = delivery_assignments.order_id
    AND c.user_id = auth.uid()
  )
);
