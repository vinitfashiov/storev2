-- Creating D2C Delivery Settings Table
CREATE TABLE IF NOT EXISTS public.tenant_delivery_settings_d2c (
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE PRIMARY KEY,
    fixed_delivery_fee_enabled boolean DEFAULT false,
    fixed_delivery_fee numeric DEFAULT 0,
    free_delivery_enabled boolean DEFAULT false,
    free_delivery_threshold numeric DEFAULT 0,
    minimum_order_enabled boolean DEFAULT false,
    minimum_order_value numeric DEFAULT 0,
    max_delivery_fee_enabled boolean DEFAULT false,
    max_delivery_fee numeric DEFAULT 0,
    weight_based_delivery_enabled boolean DEFAULT false,
    weight_calculation_type text DEFAULT 'slab' CHECK (weight_calculation_type IN ('slab', 'per_kg')),
    per_kg_rate numeric DEFAULT 0,
    weight_slabs jsonb DEFAULT '[]'::jsonb,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.tenant_delivery_settings_d2c ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all" ON public.tenant_delivery_settings_d2c
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for tenant members" ON public.tenant_delivery_settings_d2c
    FOR ALL
    USING (tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
    WITH CHECK (tenant_id = public.get_user_tenant_id() OR public.is_super_admin());

CREATE OR REPLACE FUNCTION update_tenant_delivery_settings_d2c_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenant_delivery_settings_d2c_updated_at
    BEFORE UPDATE ON public.tenant_delivery_settings_d2c
    FOR EACH ROW
    EXECUTE PROCEDURE update_tenant_delivery_settings_d2c_updated_at();

-- Altering Grocery Delivery Settings
ALTER TABLE public.tenant_delivery_settings
ADD COLUMN IF NOT EXISTS fixed_delivery_fee_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS free_delivery_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS minimum_order_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS max_delivery_fee_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS max_delivery_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS distance_based_delivery_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS distance_calculation_type text DEFAULT 'slab' CHECK (distance_calculation_type IN ('slab', 'per_km')),
ADD COLUMN IF NOT EXISTS per_km_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS rounding_rule text DEFAULT 'round_up' CHECK (rounding_rule IN ('round_up', 'round_nearest', 'no_rounding')),
ADD COLUMN IF NOT EXISTS max_delivery_distance numeric,
ADD COLUMN IF NOT EXISTS store_latitude numeric,
ADD COLUMN IF NOT EXISTS store_longitude numeric,
ADD COLUMN IF NOT EXISTS store_address text,
ADD COLUMN IF NOT EXISTS distance_slabs jsonb DEFAULT '[]'::jsonb;

-- Delivery Areas
ALTER TABLE public.delivery_areas
ADD COLUMN IF NOT EXISTS delivery_fee numeric DEFAULT 0;

-- Products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS product_delivery_fee_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS product_delivery_fee numeric,
ADD COLUMN IF NOT EXISTS product_weight numeric,
ADD COLUMN IF NOT EXISTS product_length numeric,
ADD COLUMN IF NOT EXISTS product_width numeric,
ADD COLUMN IF NOT EXISTS product_height numeric;

-- Product Variants
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS weight numeric,
ADD COLUMN IF NOT EXISTS length numeric,
ADD COLUMN IF NOT EXISTS width numeric,
ADD COLUMN IF NOT EXISTS height numeric;
