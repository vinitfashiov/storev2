-- Fix for "record 'new' has no field 'estimated_delivery_date'" error
-- and catching other likely shipping integration fields based on 'shiprocket_shipments' schema.

-- 1. Add estimated_delivery_date
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMP WITH TIME ZONE;

-- 2. Add last_tracking_status (Text)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS last_tracking_status TEXT;

-- 3. Add last_tracking_update_at (Timestamp)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS last_tracking_update_at TIMESTAMP WITH TIME ZONE;

-- 4. Add current_location (Text)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS current_location TEXT;

-- 5. Add shiprocket_order_id (Text) - integration identifiers
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shiprocket_order_id TEXT;

-- 6. Add shipment_id (Text)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipment_id TEXT;

-- Comments
COMMENT ON COLUMN public.orders.estimated_delivery_date IS 'Added to satisfy legacy triggers referencing estimated_delivery_date.';
