-- Fix for "record 'new' has no field 'canceled_at'" error
-- Spelling difference: canceled_at (US) vs cancelled_at (UK/Standard)
-- The trigger wants the single 'l' version.

-- 1. Add canceled_at (Timestamp) - mirrors cancelled_at check
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE;

-- 2. Add fulfillment_status (Text) - another likely missing field
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'unfulfilled';

-- Comments
COMMENT ON COLUMN public.orders.canceled_at IS 'Added to satisfy legacy triggers referencing canceled_at (1 L).';
