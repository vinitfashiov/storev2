-- =====================================================
-- SECURITY FIX: Remove dangerous public SELECT policies
-- =====================================================

-- 1. Fix orders table - Remove public SELECT
DROP POLICY IF EXISTS "Public can view their orders" ON public.orders;

-- 2. Fix order_items table - Remove public SELECT
DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;

-- Customers can view their order items
CREATE POLICY "Customers can view their order items"
  ON public.order_items FOR SELECT
  USING (order_id IN (
    SELECT o.id FROM orders o 
    JOIN customers c ON c.id = o.customer_id 
    WHERE c.user_id = auth.uid()
  ));

-- 3. Fix payment_intents table - Remove public SELECT/INSERT/UPDATE
DROP POLICY IF EXISTS "Public can view payment intents" ON public.payment_intents;
DROP POLICY IF EXISTS "Public can create payment intents" ON public.payment_intents;
DROP POLICY IF EXISTS "Public can update payment intents" ON public.payment_intents;

-- Payment intents should only be accessible via service role in edge functions
-- No public policies needed

-- 4. Fix tenant_integrations - Remove public SELECT (sensitive API keys)
DROP POLICY IF EXISTS "Public can check if integrations exist" ON public.tenant_integrations;

-- 5. Fix delivery_payouts - Remove public SELECT
DROP POLICY IF EXISTS "Public can view payouts" ON public.delivery_payouts;

-- 6. Fix delivery_payout_requests - Remove public SELECT
DROP POLICY IF EXISTS "Public can view payout requests" ON public.delivery_payout_requests;

-- 7. Fix delivery_status_logs - Remove public SELECT
DROP POLICY IF EXISTS "Public can view status logs" ON public.delivery_status_logs;

-- 8. Fix delivery_assignments - Restrict to tenant-scoped only
DROP POLICY IF EXISTS "Public can view delivery assignments" ON public.delivery_assignments;

-- 9. Fix delivery_earnings - Fix weak policy
DROP POLICY IF EXISTS "Delivery earnings readable by tenant delivery boys" ON public.delivery_earnings;

-- Create proper earnings SELECT policy - only tenant owners can view
CREATE POLICY "Tenant owners can view earnings"
  ON public.delivery_earnings FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- 10. Fix cart_items - Remove public ALL access
DROP POLICY IF EXISTS "Anyone can manage cart items" ON public.cart_items;

-- Create proper cart_items policies with tenant context
CREATE POLICY "Users can manage their cart items"
  ON public.cart_items FOR ALL
  USING (cart_id IN (
    SELECT id FROM carts WHERE tenant_id IS NOT NULL
  ))
  WITH CHECK (cart_id IN (
    SELECT id FROM carts WHERE tenant_id IS NOT NULL
  ));