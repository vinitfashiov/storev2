-- Add super_admin role to user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Create helper function to check if current user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- Grant super admin role to the platform owner
-- Note: Update this email to your actual email address
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE email = 'vinitfashionv@gmail.com';

-- Update RLS policies to allow super admins full access
-- We'll add OR is_super_admin() to all SELECT policies

-- Profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR is_super_admin());

-- Tenants table
DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;
CREATE POLICY "Users can view their own tenant"
ON public.tenants FOR SELECT
USING (id = public.get_user_tenant_id() OR is_super_admin());

-- User tenants table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_tenants') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their tenant associations" ON public.user_tenants';
    EXECUTE 'CREATE POLICY "Users can view their tenant associations" ON public.user_tenants FOR SELECT USING (user_id = auth.uid() OR is_super_admin())';
  END IF;
END $$;

-- Products table
DROP POLICY IF EXISTS "Users can view their tenant products" ON public.products;
CREATE POLICY "Users can view their tenant products"
ON public.products FOR SELECT
USING (tenant_id = public.get_user_tenant_id() OR is_super_admin());

-- Categories table
DROP POLICY IF EXISTS "Users can view their tenant categories" ON public.categories;
CREATE POLICY "Users can view their tenant categories"
ON public.categories FOR SELECT
USING (tenant_id = public.get_user_tenant_id() OR is_super_admin());

-- Brands table
DROP POLICY IF EXISTS "Users can view their tenant brands" ON public.brands;
CREATE POLICY "Users can view their tenant brands"
ON public.brands FOR SELECT
USING (tenant_id = public.get_user_tenant_id() OR is_super_admin());

-- Orders table
DROP POLICY IF EXISTS "Users can view their tenant orders" ON public.orders;
CREATE POLICY "Users can view their tenant orders"
ON public.orders FOR SELECT
USING (tenant_id = public.get_user_tenant_id() OR is_super_admin());

-- Order items table
DROP POLICY IF EXISTS "Users can view their tenant order items" ON public.order_items;
CREATE POLICY "Users can view their tenant order items"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.tenant_id = public.get_user_tenant_id() OR is_super_admin())
  )
);

-- Customers table
DROP POLICY IF EXISTS "Users can view their tenant customers" ON public.customers;
CREATE POLICY "Users can view their tenant customers"
ON public.customers FOR SELECT
USING (tenant_id = public.get_user_tenant_id() OR is_super_admin());

-- Coupons table
DROP POLICY IF EXISTS "Users can view their tenant coupons" ON public.coupons;
CREATE POLICY "Users can view their tenant coupons"
ON public.coupons FOR SELECT
USING (tenant_id = public.get_user_tenant_id() OR is_super_admin());

-- Subscriptions table
DROP POLICY IF EXISTS "Users can view their tenant subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their tenant subscriptions"
ON public.subscriptions FOR SELECT
USING (tenant_id = public.get_user_tenant_id() OR is_super_admin());

-- Delivery boys table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'delivery_boys') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their tenant delivery boys" ON public.delivery_boys';
    EXECUTE 'CREATE POLICY "Users can view their tenant delivery boys" ON public.delivery_boys FOR SELECT USING (tenant_id = public.get_user_tenant_id() OR is_super_admin())';
  END IF;
END $$;

-- Delivery areas table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'delivery_areas') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their tenant delivery areas" ON public.delivery_areas';
    EXECUTE 'CREATE POLICY "Users can view their tenant delivery areas" ON public.delivery_areas FOR SELECT USING (tenant_id = public.get_user_tenant_id() OR is_super_admin())';
  END IF;
END $$;

-- Suppliers table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their tenant suppliers" ON public.suppliers';
    EXECUTE 'CREATE POLICY "Users can view their tenant suppliers" ON public.suppliers FOR SELECT USING (tenant_id = public.get_user_tenant_id() OR is_super_admin())';
  END IF;
END $$;

-- Inventory movements table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_movements') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their tenant inventory movements" ON public.inventory_movements';
    EXECUTE 'CREATE POLICY "Users can view their tenant inventory movements" ON public.inventory_movements FOR SELECT USING (tenant_id = public.get_user_tenant_id() OR is_super_admin())';
  END IF;
END $$;

-- Purchase orders table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_orders') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their tenant purchase orders" ON public.purchase_orders';
    EXECUTE 'CREATE POLICY "Users can view their tenant purchase orders" ON public.purchase_orders FOR SELECT USING (tenant_id = public.get_user_tenant_id() OR is_super_admin())';
  END IF;
END $$;

-- Analytics tables
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_sessions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their tenant sessions" ON public.store_sessions';
    EXECUTE 'CREATE POLICY "Users can view their tenant sessions" ON public.store_sessions FOR SELECT USING (tenant_id = public.get_user_tenant_id() OR is_super_admin())';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_page_views') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their tenant page views" ON public.store_page_views';
    EXECUTE 'CREATE POLICY "Users can view their tenant page views" ON public.store_page_views FOR SELECT USING (tenant_id = public.get_user_tenant_id() OR is_super_admin())';
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_events') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their tenant events" ON public.store_events';
    EXECUTE 'CREATE POLICY "Users can view their tenant events" ON public.store_events FOR SELECT USING (tenant_id = public.get_user_tenant_id() OR is_super_admin())';
  END IF;
END $$;

-- Create function to get all table names (for data browser)
CREATE OR REPLACE FUNCTION public.get_all_tables()
RETURNS TABLE (table_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tablename::TEXT
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
  ORDER BY tablename;
$$;

-- Grant execute permission to authenticated users (will be restricted by is_super_admin check in frontend)
GRANT EXECUTE ON FUNCTION public.get_all_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

COMMENT ON FUNCTION public.is_super_admin() IS 'Returns true if the current user has super_admin role';
COMMENT ON FUNCTION public.get_all_tables() IS 'Returns list of all tables in public schema (super admin only)';
