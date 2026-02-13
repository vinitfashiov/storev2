-- Fix for "record 'new' has no field 'items'" error
-- A zombie trigger is trying to access 'items' on the orders table.
-- We add it as a JSONB column with an empty array default to satisfy the trigger
-- without affecting the actual order processing (which happens in create_order_atomic).

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.orders.items IS 'Added to satisfy legacy triggers referencing items column. Not used for actual storage.';
