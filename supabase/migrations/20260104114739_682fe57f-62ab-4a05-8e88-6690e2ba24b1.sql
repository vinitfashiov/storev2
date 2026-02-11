-- ===========================================
-- ENTERPRISE DATABASE OPTIMIZATIONS
-- For 100,000+ users/day and high-volume operations
-- ===========================================

-- =====================
-- PERFORMANCE INDEXES
-- =====================

-- Orders: Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status ON public.orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_created ON public.orders(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_payment ON public.orders(tenant_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- Products: Composite indexes for storefront queries
CREATE INDEX IF NOT EXISTS idx_products_tenant_active ON public.products(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_tenant_category ON public.products(tenant_id, category_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_tenant_brand ON public.products(tenant_id, brand_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(tenant_id, price) WHERE is_active = true;

-- Categories: Optimize category lookups
CREATE INDEX IF NOT EXISTS idx_categories_tenant_active ON public.categories(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(tenant_id, slug);

-- Brands: Optimize brand lookups
CREATE INDEX IF NOT EXISTS idx_brands_tenant_active ON public.brands(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_brands_slug ON public.brands(tenant_id, slug);

-- Cart and Cart Items: Optimize checkout flow
CREATE INDEX IF NOT EXISTS idx_carts_tenant_status ON public.carts(tenant_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON public.cart_items(product_id);

-- Customers: Optimize customer lookups
CREATE INDEX IF NOT EXISTS idx_customers_tenant_email ON public.customers(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_phone ON public.customers(tenant_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id) WHERE user_id IS NOT NULL;

-- Customer addresses: Optimize address lookups
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON public.customer_addresses(customer_id);

-- Order items: Optimize order detail queries
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id) WHERE product_id IS NOT NULL;

-- Product variants: Optimize variant lookups
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(tenant_id, sku) WHERE sku IS NOT NULL;

-- Inventory movements: Optimize stock tracking
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created ON public.inventory_movements(tenant_id, created_at DESC);

-- Store banners: Optimize storefront banner queries
CREATE INDEX IF NOT EXISTS idx_store_banners_tenant_active ON public.store_banners(tenant_id, is_active, position) WHERE is_active = true;

-- Delivery assignments: Optimize delivery tracking
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order ON public.delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_boy ON public.delivery_assignments(delivery_boy_id) WHERE delivery_boy_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_status ON public.delivery_assignments(tenant_id, status);

-- Payment intents: Optimize payment flow
CREATE INDEX IF NOT EXISTS idx_payment_intents_cart ON public.payment_intents(cart_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON public.payment_intents(tenant_id, status);

-- Coupons: Optimize coupon validation
CREATE INDEX IF NOT EXISTS idx_coupons_tenant_code ON public.coupons(tenant_id, code) WHERE is_active = true;

-- Wishlists: Optimize wishlist queries
CREATE INDEX IF NOT EXISTS idx_wishlists_customer ON public.wishlists(customer_id);

-- Tenants: Optimize tenant lookups
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(store_slug) WHERE is_active = true AND deleted_at IS NULL;

-- Custom domains: Optimize domain resolution
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON public.custom_domains(domain) WHERE status = 'active';

-- =====================
-- FULL-TEXT SEARCH
-- =====================

-- Add GIN index for product search
CREATE INDEX IF NOT EXISTS idx_products_search ON public.products 
USING GIN(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));

-- Add GIN index for customer search (admin panel)
CREATE INDEX IF NOT EXISTS idx_customers_search ON public.customers
USING GIN(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(phone, '')));

-- =====================
-- OPTIMIZED FUNCTIONS
-- =====================

-- Function: Get paginated orders with count
CREATE OR REPLACE FUNCTION public.get_paginated_orders(
  p_tenant_id UUID,
  p_status TEXT DEFAULT NULL,
  p_payment_status TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  orders JSONB,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_orders AS (
    SELECT o.*
    FROM orders o
    WHERE o.tenant_id = p_tenant_id
      AND (p_status IS NULL OR o.status = p_status)
      AND (p_payment_status IS NULL OR o.payment_status = p_payment_status)
  ),
  counted AS (
    SELECT COUNT(*) as cnt FROM filtered_orders
  )
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'id', fo.id,
        'order_number', fo.order_number,
        'customer_name', fo.customer_name,
        'customer_phone', fo.customer_phone,
        'total', fo.total,
        'status', fo.status,
        'payment_status', fo.payment_status,
        'payment_method', fo.payment_method,
        'created_at', fo.created_at
      )
      ORDER BY fo.created_at DESC
    ) as orders,
    c.cnt as total_count
  FROM (
    SELECT * FROM filtered_orders
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) fo
  CROSS JOIN counted c
  GROUP BY c.cnt;
END;
$$;

-- Function: Get paginated products with count
CREATE OR REPLACE FUNCTION public.get_paginated_products(
  p_tenant_id UUID,
  p_category_id UUID DEFAULT NULL,
  p_brand_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  products JSONB,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_products AS (
    SELECT p.*, c.name as category_name, b.name as brand_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE p.tenant_id = p_tenant_id
      AND p.is_active = true
      AND (p_category_id IS NULL OR p.category_id = p_category_id)
      AND (p_brand_id IS NULL OR p.brand_id = p_brand_id)
      AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
  ),
  counted AS (
    SELECT COUNT(*) as cnt FROM filtered_products
  )
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'id', fp.id,
        'name', fp.name,
        'slug', fp.slug,
        'price', fp.price,
        'compare_at_price', fp.compare_at_price,
        'images', fp.images,
        'stock_qty', fp.stock_qty,
        'has_variants', fp.has_variants,
        'category', jsonb_build_object('name', fp.category_name),
        'brand', jsonb_build_object('name', fp.brand_name)
      )
      ORDER BY fp.created_at DESC
    ) as products,
    c.cnt as total_count
  FROM (
    SELECT * FROM filtered_products
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) fp
  CROSS JOIN counted c
  GROUP BY c.cnt;
END;
$$;

-- Functions moved to 20260211000000_fix_functions_2.sql to fix syntax error
-- CREATE OR REPLACE FUNCTION public.check_stock_availability(...)
-- CREATE OR REPLACE FUNCTION public.reduce_stock_atomic(...)
-- CREATE OR REPLACE FUNCTION public.get_dashboard_stats(...)