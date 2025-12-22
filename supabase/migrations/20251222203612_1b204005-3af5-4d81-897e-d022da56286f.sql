-- Create delivery_zones table for grocery tenants
CREATE TABLE public.delivery_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pincodes TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create delivery_slots table
CREATE TABLE public.delivery_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES public.delivery_zones(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tenant_delivery_settings table
CREATE TABLE public.tenant_delivery_settings (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  delivery_mode TEXT NOT NULL DEFAULT 'both' CHECK (delivery_mode IN ('slots', 'asap', 'both')),
  asap_eta_minutes INTEGER NOT NULL DEFAULT 30,
  min_order_amount NUMERIC NOT NULL DEFAULT 0,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  free_delivery_above NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_zone_availability table
CREATE TABLE public.product_zone_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES public.delivery_zones(id) ON DELETE CASCADE,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, zone_id)
);

-- Create shiprocket_shipments table
CREATE TABLE public.shiprocket_shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
  shiprocket_order_id TEXT,
  shipment_id TEXT,
  awb_code TEXT,
  courier_name TEXT,
  status TEXT,
  raw_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add delivery fields to orders table
ALTER TABLE public.orders 
  ADD COLUMN delivery_zone_id UUID REFERENCES public.delivery_zones(id) ON DELETE SET NULL,
  ADD COLUMN delivery_slot_id UUID REFERENCES public.delivery_slots(id) ON DELETE SET NULL,
  ADD COLUMN delivery_option TEXT NOT NULL DEFAULT 'standard' CHECK (delivery_option IN ('asap', 'slot', 'standard')),
  ADD COLUMN requested_delivery_time TIMESTAMP WITH TIME ZONE;

-- Enable RLS on all new tables
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_delivery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_zone_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shiprocket_shipments ENABLE ROW LEVEL SECURITY;

-- RLS for delivery_zones
CREATE POLICY "Owners can manage their delivery zones"
ON public.delivery_zones FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Public can view active delivery zones"
ON public.delivery_zones FOR SELECT
USING (is_active = true);

-- RLS for delivery_slots
CREATE POLICY "Owners can manage their delivery slots"
ON public.delivery_slots FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Public can view active delivery slots"
ON public.delivery_slots FOR SELECT
USING (is_active = true);

-- RLS for tenant_delivery_settings
CREATE POLICY "Owners can manage their delivery settings"
ON public.tenant_delivery_settings FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Public can view delivery settings"
ON public.tenant_delivery_settings FOR SELECT
USING (true);

-- RLS for product_zone_availability
CREATE POLICY "Owners can manage product zone availability"
ON public.product_zone_availability FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Public can view product zone availability"
ON public.product_zone_availability FOR SELECT
USING (true);

-- RLS for shiprocket_shipments
CREATE POLICY "Owners can manage their shipments"
ON public.shiprocket_shipments FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- Create indexes for performance
CREATE INDEX idx_delivery_zones_tenant ON public.delivery_zones(tenant_id);
CREATE INDEX idx_delivery_slots_tenant ON public.delivery_slots(tenant_id);
CREATE INDEX idx_delivery_slots_zone ON public.delivery_slots(zone_id);
CREATE INDEX idx_product_zone_availability_product ON public.product_zone_availability(product_id);
CREATE INDEX idx_product_zone_availability_zone ON public.product_zone_availability(zone_id);
CREATE INDEX idx_shiprocket_shipments_order ON public.shiprocket_shipments(order_id);