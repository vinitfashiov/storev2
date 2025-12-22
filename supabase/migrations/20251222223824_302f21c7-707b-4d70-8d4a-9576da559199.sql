-- 1) Add parent_id to categories for subcategories
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);

-- 2) Create brands table
CREATE TABLE IF NOT EXISTS public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their brands" ON public.brands
  FOR ALL USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Public can view active brands" ON public.brands
  FOR SELECT USING (is_active = true);

-- Add brand_id to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_id);

-- 3) Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  type text NOT NULL CHECK (type IN ('percent', 'fixed')),
  value numeric NOT NULL,
  min_cart_amount numeric NOT NULL DEFAULT 0,
  max_discount_amount numeric,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their coupons" ON public.coupons
  FOR ALL USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Public can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = true);

-- Create coupon_redemptions table
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  discount_amount numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view coupon redemptions" ON public.coupon_redemptions
  FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Public can create redemptions" ON public.coupon_redemptions
  FOR INSERT WITH CHECK (true);

-- Add coupon fields to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS coupon_id uuid REFERENCES public.coupons(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS coupon_code text;

-- 4) Create wishlists table
CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, customer_id, product_id)
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can manage their wishlist" ON public.wishlists
  FOR ALL USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()))
  WITH CHECK (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

CREATE POLICY "Owners can view wishlists" ON public.wishlists
  FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE INDEX IF NOT EXISTS idx_wishlists_customer ON public.wishlists(customer_id);

-- 5) Create attributes table
CREATE TABLE IF NOT EXISTS public.attributes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

ALTER TABLE public.attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their attributes" ON public.attributes
  FOR ALL USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Public can view attributes" ON public.attributes
  FOR SELECT USING (true);

-- Create attribute_values table
CREATE TABLE IF NOT EXISTS public.attribute_values (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  attribute_id uuid NOT NULL REFERENCES public.attributes(id) ON DELETE CASCADE,
  value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(attribute_id, value)
);

ALTER TABLE public.attribute_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage attribute values" ON public.attribute_values
  FOR ALL USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Public can view attribute values" ON public.attribute_values
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_attribute_values_attribute ON public.attribute_values(attribute_id);

-- 6) Create product_variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku text,
  price numeric NOT NULL,
  compare_at_price numeric,
  stock_qty integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their variants" ON public.product_variants
  FOR ALL USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Public can view active variants" ON public.product_variants
  FOR SELECT USING (is_active = true);

CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);

-- Create variant_attributes junction table
CREATE TABLE IF NOT EXISTS public.variant_attributes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  attribute_id uuid NOT NULL REFERENCES public.attributes(id) ON DELETE CASCADE,
  attribute_value_id uuid NOT NULL REFERENCES public.attribute_values(id) ON DELETE CASCADE,
  UNIQUE(variant_id, attribute_id)
);

ALTER TABLE public.variant_attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage variant attributes" ON public.variant_attributes
  FOR ALL USING (
    variant_id IN (SELECT id FROM product_variants WHERE tenant_id = get_user_tenant_id())
  )
  WITH CHECK (
    variant_id IN (SELECT id FROM product_variants WHERE tenant_id = get_user_tenant_id())
  );

CREATE POLICY "Public can view variant attributes" ON public.variant_attributes
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_variant_attrs_variant ON public.variant_attributes(variant_id);

-- 7) Add variant_id to cart_items
ALTER TABLE public.cart_items
ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- 8) Add variant fields to order_items
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS variant_attributes jsonb;

-- 9) Add has_variants flag to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS has_variants boolean NOT NULL DEFAULT false;

-- 10) Create product-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product-images bucket
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Trigger for product_variants updated_at
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();