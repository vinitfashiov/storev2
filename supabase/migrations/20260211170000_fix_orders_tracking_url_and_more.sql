-- Fix for "record 'new' has no field 'tracking_url'" error
-- and catching other potential shipping/fulfillment fields that legacy triggers might check.

-- 1. Add tracking_url (Text)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_url TEXT;

-- 2. Add carrier (Text) - often paired with tracking_url
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS carrier TEXT;

-- 3. Add fulfillment timestamps (often checked by status triggers)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;

-- Comments
COMMENT ON COLUMN public.orders.tracking_url IS 'Added to satisfy legacy triggers referencing tracking_url.';
