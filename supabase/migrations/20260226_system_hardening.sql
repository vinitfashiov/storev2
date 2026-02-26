-- 20260226_system_hardening.sql
-- Comprehensive Security and Performance Hardening Script 
-- Fixes missing RLS, missing indexes, and restricts overly permissive policies.

BEGIN;

-- ==========================================
-- 1. ADD MISSING PERFORMANCE INDEXES
-- Critical for scaling beyond 10k stores
-- ==========================================

-- Orders table needs compound index for tenant and status (most common query)
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status ON public.orders(tenant_id, status);

-- Products need index on active status per tenant
CREATE INDEX IF NOT EXISTS idx_products_tenant_category ON public.products(tenant_id, category_id, is_active);

-- Customer lookups per tenant
CREATE INDEX IF NOT EXISTS idx_customers_tenant_email ON public.customers(tenant_id, email);

-- Cart items lookup by session/customer
CREATE INDEX IF NOT EXISTS idx_cart_items_session ON public.cart_items(session_id);

-- Analytics queries optimization
CREATE INDEX IF NOT EXISTS idx_analytics_tenant_date ON public.analytics(tenant_id, created_at);


-- ==========================================
-- 2. ENFORCE RLS ON ALL TABLES
-- Explicitly enable RLS to ensure no data leaks
-- ==========================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 3. AUDIT & RESTRICT PERMISSIVE POLICIES
-- Drop potentially dangerous public wildcard policies if they exist.
-- (Assumes standard Supabase Auth behavior)
-- ==========================================

DO $$
BEGIN
    -- Remove any potential public wide-open read access on sensitive tables
    BEGIN
        DROP POLICY IF EXISTS "Public can view all orders" ON public.orders;
    EXCEPTION
        WHEN undefined_object THEN null;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Public can view all customers" ON public.customers;
    EXCEPTION
        WHEN undefined_object THEN null;
    END;
END $$;

-- Define explicit locked-down policies if missing.
-- Note: Requires `tenant_id` context to be set for authenticated admin users.

-- Example strict policy for orders matching tenant context

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' AND policyname = 'Admins can view their tenant orders'
    ) THEN
        CREATE POLICY "Admins can view their tenant orders" ON public.orders
            FOR SELECT
            TO authenticated
            USING (
                tenant_id IN (
                    SELECT tenant_id FROM public.admin_profiles WHERE id = auth.uid()
                )
            );
    END IF;
END $$;


-- ==========================================
-- 4. FIX COUPON INCREMENT RACE CONDITION 
-- Ensure the increment_coupon_usage function is atomic and exists
-- ==========================================

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_coupon_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.coupons
    SET used_count = used_count + 1
    WHERE id = p_coupon_id
    AND (usage_limit IS NULL OR used_count < usage_limit);
END;
$$;

COMMIT;
