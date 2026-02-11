-- =============================================================================
-- FIX #1-5: Critical Database Fixes - RLS Policies, Atomic COD Order, Indexes
-- =============================================================================

-- ============================================================================
-- FIX #3: Create atomic coupon increment if not exists (for COD path)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_coupon_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE coupons
  SET used_count = used_count + 1,
      updated_at = now()
  WHERE id = p_coupon_id;
END;
$$;

-- ============================================================================
-- FIX #1 & #8: Atomic Order Creation for COD (with transaction safety)
-- Function definition moved to 20260120232433_create_order_atomic.sql
-- ============================================================================

-- ============================================================================
-- FIX #2: Atomic POS Sale Creation
-- Function definition moved to 20260120232434_create_pos_sale_atomic.sql
-- ============================================================================

-- ============================================================================
-- FIX #4: Tighten RLS Policies - Remove overly permissive ones
-- ============================================================================

-- Fix store_events - require tenant_id validation
DROP POLICY IF EXISTS "Service role can insert events" ON store_events;
CREATE POLICY "Allow insert events with valid tenant"
  ON store_events FOR INSERT
  WITH CHECK (
    tenant_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM tenants WHERE id = tenant_id AND is_active = true)
  );

-- Fix store_page_views
DROP POLICY IF EXISTS "Service role can insert page views" ON store_page_views;
CREATE POLICY "Allow insert page views with valid tenant"
  ON store_page_views FOR INSERT
  WITH CHECK (
    tenant_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM tenants WHERE id = tenant_id AND is_active = true)
  );

-- Fix store_performance_metrics
DROP POLICY IF EXISTS "Service role can insert performance metrics" ON store_performance_metrics;
CREATE POLICY "Allow insert performance metrics with valid tenant"
  ON store_performance_metrics FOR INSERT
  WITH CHECK (
    tenant_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM tenants WHERE id = tenant_id AND is_active = true)
  );

-- Fix store_sessions
DROP POLICY IF EXISTS "Service role can insert sessions" ON store_sessions;
DROP POLICY IF EXISTS "Service role can update sessions" ON store_sessions;

CREATE POLICY "Allow insert sessions with valid tenant"
  ON store_sessions FOR INSERT
  WITH CHECK (
    tenant_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM tenants WHERE id = tenant_id AND is_active = true)
  );

CREATE POLICY "Allow update own sessions"
  ON store_sessions FOR UPDATE
  USING (
    tenant_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM tenants WHERE id = tenant_id AND is_active = true)
  );

-- Fix tenants INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create tenants" ON tenants;
CREATE POLICY "Authenticated users can create tenants"
  ON tenants FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- ============================================================================
-- FIX #13 & #16: Add missing indexes for performance
-- ============================================================================

-- Index for order date filtering
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(tenant_id, created_at DESC);

-- Index for customer phone lookup
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(tenant_id, phone);

-- Index for cart items lookup
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);

-- Index for order number uniqueness check
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(tenant_id, order_number);

-- Index for inventory movements by reference
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference ON inventory_movements(reference_type, reference_id);

-- Index for sessions lookup
CREATE INDEX IF NOT EXISTS idx_store_sessions_tenant_started ON store_sessions(tenant_id, started_at DESC);

-- Index for page views lookup
CREATE INDEX IF NOT EXISTS idx_store_page_views_tenant_viewed ON store_page_views(tenant_id, viewed_at DESC);

-- ============================================================================
-- FIX #13: Unique Order Number Generation Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_unique_order_number(p_tenant_id UUID, p_prefix TEXT DEFAULT 'ORD')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order_number TEXT;
  v_counter INT := 0;
BEGIN
  LOOP
    v_order_number := p_prefix || '-' || to_char(now(), 'YYYYMMDD') || '-' || 
                      lpad(floor(random() * 10000)::text, 4, '0');
    
    -- Check if exists
    IF NOT EXISTS (SELECT 1 FROM orders WHERE tenant_id = p_tenant_id AND order_number = v_order_number) THEN
      RETURN v_order_number;
    END IF;
    
    v_counter := v_counter + 1;
    IF v_counter > 100 THEN
      -- Fallback to timestamp-based
      RETURN p_prefix || '-' || extract(epoch from now())::bigint::text;
    END IF;
  END LOOP;
END;
$$;