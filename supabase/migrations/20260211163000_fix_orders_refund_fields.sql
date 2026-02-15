-- Fix for "record 'new' has no field 'refund_status'" error
-- The zombie trigger demands refund related fields.

-- 1. Add refund_status (Text)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none';

-- 2. Add refund_amount (Numeric)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC DEFAULT 0;

-- 3. Add refund_reason (Text)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS refund_reason TEXT;

-- Comments
COMMENT ON COLUMN public.orders.refund_status IS 'Added to satisfy legacy triggers referencing refund_status.';
