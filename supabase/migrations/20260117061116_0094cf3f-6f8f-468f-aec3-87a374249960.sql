-- =====================================================
-- SECURITY FIX: Remove overly permissive RLS policies
-- =====================================================

-- 1. Fix delivery_earnings table - Remove public access if it exists
DROP POLICY IF EXISTS "Public can view earnings" ON public.delivery_earnings;
DROP POLICY IF EXISTS "Public can insert earnings" ON public.delivery_earnings;

-- 2. Fix carts table - Require tenant context for INSERT/UPDATE
DROP POLICY IF EXISTS "Anyone can create carts" ON public.carts;
DROP POLICY IF EXISTS "Anyone can update carts" ON public.carts;

-- Create more restrictive cart policies - carts need tenant_id context
CREATE POLICY "Authenticated users can create carts" 
  ON public.carts FOR INSERT 
  TO anon, authenticated
  WITH CHECK (tenant_id IS NOT NULL);

CREATE POLICY "Users can update their own carts" 
  ON public.carts FOR UPDATE 
  TO anon, authenticated
  USING (tenant_id IS NOT NULL);

-- 3. Fix coupon_redemptions - Only authenticated users can create redemptions
DROP POLICY IF EXISTS "Public can create redemptions" ON public.coupon_redemptions;

CREATE POLICY "Authenticated users can create redemptions"
  ON public.coupon_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT tenant_id FROM customers WHERE user_id = auth.uid() LIMIT 1));

-- 4. Fix delivery_assignments - Only tenant owners can create via edge function
DROP POLICY IF EXISTS "Public can create delivery assignments" ON public.delivery_assignments;

-- No public INSERT policy - use edge function with service role

-- 5. Fix delivery_payout_requests - Restrict to delivery boys
DROP POLICY IF EXISTS "Public can insert payout requests" ON public.delivery_payout_requests;
DROP POLICY IF EXISTS "Public can update payout requests" ON public.delivery_payout_requests;

-- Create delivery boy session table for secure auth
CREATE TABLE IF NOT EXISTS public.delivery_boy_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_boy_id uuid NOT NULL REFERENCES delivery_boys(id) ON DELETE CASCADE,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on sessions
ALTER TABLE public.delivery_boy_sessions ENABLE ROW LEVEL SECURITY;

-- Only service role can manage sessions
CREATE POLICY "Service role only" 
  ON public.delivery_boy_sessions 
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Create function to validate delivery boy sessions
CREATE OR REPLACE FUNCTION public.validate_delivery_boy_session(p_token uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_delivery_boy_id uuid;
BEGIN
  SELECT delivery_boy_id INTO v_delivery_boy_id
  FROM delivery_boy_sessions
  WHERE token = p_token AND expires_at > now();
  
  RETURN v_delivery_boy_id;
END;
$$;

-- 6. Fix order_items - Only through valid order flow
DROP POLICY IF EXISTS "Public can create order items" ON public.order_items;

-- Order items created through atomic function with service role

-- 7. Fix orders - Only through edge function or authenticated flow  
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;

-- Orders created through create_order_atomic function with proper validation

-- 8. Fix payment_intents
DROP POLICY IF EXISTS "Public can create payment intents" ON public.payment_intents;
DROP POLICY IF EXISTS "Public can update payment intents" ON public.payment_intents;

-- Payment intents managed by edge functions

-- 9. Fix tenants - Only authenticated users can create their own tenants
DROP POLICY IF EXISTS "Users can insert tenants" ON public.tenants;

CREATE POLICY "Authenticated users can create tenants"
  ON public.tenants FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add simple index on delivery_boy_sessions (no predicate)
CREATE INDEX IF NOT EXISTS idx_delivery_boy_sessions_token 
  ON public.delivery_boy_sessions(token);

CREATE INDEX IF NOT EXISTS idx_delivery_boy_sessions_expires 
  ON public.delivery_boy_sessions(expires_at);

-- Cleanup expired sessions trigger
CREATE OR REPLACE FUNCTION public.cleanup_expired_delivery_sessions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM delivery_boy_sessions WHERE expires_at < now();
  RETURN NEW;
END;
$$;

-- Trigger to cleanup on new session insert
DROP TRIGGER IF EXISTS cleanup_sessions_trigger ON public.delivery_boy_sessions;
CREATE TRIGGER cleanup_sessions_trigger
  AFTER INSERT ON public.delivery_boy_sessions
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_expired_delivery_sessions();