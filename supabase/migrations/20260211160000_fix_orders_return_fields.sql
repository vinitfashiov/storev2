-- Fix for "record 'new' has no field 'return_status'" error
-- The zombie trigger demands return related fields.

-- 1. Add return_status (Text)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS return_status TEXT DEFAULT 'none';

-- 2. Add return_reason (Text)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS return_reason TEXT;

-- 3. Add return_requested_at (Timestamp)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS return_requested_at TIMESTAMP WITH TIME ZONE;

-- Comments
COMMENT ON COLUMN public.orders.return_status IS 'Added to satisfy legacy triggers referencing return_status.';
