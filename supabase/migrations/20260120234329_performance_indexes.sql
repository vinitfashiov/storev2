-- =====================================================
-- 4. ADD MISSING PERFORMANCE INDEXES
-- Fix high sequential scan tables
-- Extracted from 20260120234326...
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
