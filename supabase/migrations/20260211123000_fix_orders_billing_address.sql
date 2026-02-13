-- Fix for "record 'new' has no field 'billing_address'" error
-- A trigger is expecting billing_address to exist on the orders table
-- We add it as a generated column mirroring shipping_address to satisfy the trigger
-- and avoid null values.

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS billing_address JSONB GENERATED ALWAYS AS (shipping_address) STORED;

COMMENT ON COLUMN public.orders.billing_address IS 'Generated column to support triggers referencing billing_address defaulting to shipping_address';
