-- Fix for "record 'new' has no field 'notes'" error and other potential missing fields
-- The zombie trigger continues to demand legacy fields.
-- We add 'notes' and other likely missing fields to satisfy it.

-- 1. Add notes (Text)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Add shipping_method (Text) - often paired with delivery_option
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_method TEXT;

-- 3. Add tracking_number (Text)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_number TEXT;

-- 4. Add cancel_reason (Text)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- Comments
COMMENT ON COLUMN public.orders.notes IS 'Added to satisfy legacy triggers referencing notes.';
