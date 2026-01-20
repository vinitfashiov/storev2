-- =====================================================
-- ENTERPRISE SECURITY & PERFORMANCE FIX MIGRATION
-- Fixes all critical security issues and adds performance indexes
-- =====================================================

-- =====================================================
-- 1. REVOKE ATOMIC FUNCTION PUBLIC ACCESS
-- These should only be called by service role (edge functions)
-- =====================================================

-- Revoke execute from anon and authenticated - service role retains access
REVOKE EXECUTE ON FUNCTION create_order_atomic FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION increment_coupon_usage FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION create_pos_sale_atomic FROM anon, authenticated, public;

-- =====================================================
-- 2. FIX SECURITY DEFINER VIEWS
-- Convert to SECURITY INVOKER for safety
-- =====================================================

-- Drop and recreate tenants_public view with SECURITY INVOKER
DROP VIEW IF EXISTS public.tenants_public;
CREATE VIEW public.tenants_public 
WITH (security_invoker = on)
AS
SELECT 
  id,
  store_name,
  store_slug,
  business_type,
  is_active
FROM public.tenants
WHERE is_active = true AND deleted_at IS NULL;

-- Grant access to the view
GRANT SELECT ON public.tenants_public TO anon, authenticated;

-- Drop and recreate tenant_integrations_safe view with SECURITY INVOKER
DROP VIEW IF EXISTS public.tenant_integrations_safe;
CREATE VIEW public.tenant_integrations_safe
WITH (security_invoker = on)
AS
SELECT 
  id,
  tenant_id,
  created_at,
  updated_at,
  razorpay_key_id,
  razorpay_oauth_connected,
  razorpay_oauth_merchant_id,
  razorpay_oauth_public_token,
  shiprocket_email,
  shiprocket_pickup_location,
  CASE WHEN razorpay_key_secret IS NOT NULL AND razorpay_key_secret != '' THEN true ELSE false END as has_razorpay_secret,
  CASE WHEN shiprocket_password IS NOT NULL AND shiprocket_password != '' THEN true ELSE false END as has_shiprocket_password
FROM public.tenant_integrations;

-- Grant access to the safe view
GRANT SELECT ON public.tenant_integrations_safe TO authenticated;

-- Drop and recreate delivery_boys_safe view with SECURITY INVOKER
DROP VIEW IF EXISTS public.delivery_boys_safe;
CREATE VIEW public.delivery_boys_safe
WITH (security_invoker = on)
AS
SELECT 
  id,
  tenant_id,
  full_name,
  mobile_number,
  payment_type,
  monthly_salary,
  per_order_amount,
  percentage_value,
  is_active,
  wallet_balance,
  total_earned,
  total_paid,
  created_at,
  updated_at,
  CASE WHEN account_number IS NOT NULL AND account_number != '' THEN true ELSE false END as has_bank_account,
  CASE WHEN upi_id IS NOT NULL AND upi_id != '' THEN true ELSE false END as has_upi
FROM public.delivery_boys;

-- Grant access to the safe view
GRANT SELECT ON public.delivery_boys_safe TO authenticated;

-- =====================================================
-- 3. TIGHTEN DELIVERY ASSIGNMENTS RLS
-- Remove public SELECT, add proper tenant scoping
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

-- =====================================================
-- 4. ADD MISSING PERFORMANCE INDEXES
-- Fix high sequential scan tables
-- =====================================================

-- user_tenants - extremely high seq scans (34K)
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id 
ON public.user_tenants(user_id);

CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id 
ON public.user_tenants(tenant_id);

-- orders - need better indexing for common queries
CREATE INDEX IF NOT EXISTS idx_orders_tenant_created 
ON public.orders(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id 
ON public.orders(customer_id) WHERE customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_status_tenant 
ON public.orders(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
ON public.orders(tenant_id, payment_status);

-- products - optimize for active product queries
CREATE INDEX IF NOT EXISTS idx_products_tenant_active_created 
ON public.products(tenant_id, created_at DESC) WHERE is_active = true;

-- customers - optimize phone/email lookups
CREATE INDEX IF NOT EXISTS idx_customers_user_id 
ON public.customers(user_id) WHERE user_id IS NOT NULL;

-- cart_items - optimize cart lookups
CREATE INDEX IF NOT EXISTS idx_cart_items_tenant_cart 
ON public.cart_items(tenant_id, cart_id);

-- store_sessions - optimize analytics queries
CREATE INDEX IF NOT EXISTS idx_store_sessions_tenant_started 
ON public.store_sessions(tenant_id, started_at DESC);

-- store_events - optimize event queries
CREATE INDEX IF NOT EXISTS idx_store_events_tenant_created 
ON public.store_events(tenant_id, created_at DESC);

-- delivery_assignments - optimize status queries
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_status 
ON public.delivery_assignments(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_delivery_assignments_delivery_boy 
ON public.delivery_assignments(delivery_boy_id) WHERE delivery_boy_id IS NOT NULL;

-- Suppliers index for performance
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant 
ON public.suppliers(tenant_id);

-- =====================================================
-- 5. OPTIMIZE ANALYTICS TABLES WITH BRIN INDEXES
-- Perfect for time-series append-only data
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_store_events_created_brin 
ON public.store_events USING BRIN(created_at);

CREATE INDEX IF NOT EXISTS idx_store_sessions_started_brin 
ON public.store_sessions USING BRIN(started_at);

CREATE INDEX IF NOT EXISTS idx_store_page_views_viewed_brin 
ON public.store_page_views USING BRIN(viewed_at);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_brin 
ON public.inventory_movements USING BRIN(created_at);

-- =====================================================
-- 6. ADD COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- =====================================================

-- Product listing with category filter
CREATE INDEX IF NOT EXISTS idx_products_tenant_category 
ON public.products(tenant_id, category_id) WHERE is_active = true;

-- Product listing with brand filter
CREATE INDEX IF NOT EXISTS idx_products_tenant_brand 
ON public.products(tenant_id, brand_id) WHERE is_active = true;

-- Order lookup by order number
CREATE INDEX IF NOT EXISTS idx_orders_number_lookup 
ON public.orders(tenant_id, order_number);

-- =====================================================
-- 7. UPDATE TABLE STATISTICS
-- =====================================================

ANALYZE public.user_tenants;
ANALYZE public.profiles;
ANALYZE public.tenants;
ANALYZE public.orders;
ANALYZE public.products;
ANALYZE public.customers;
ANALYZE public.cart_items;
ANALYZE public.carts;
ANALYZE public.store_sessions;
ANALYZE public.store_events;