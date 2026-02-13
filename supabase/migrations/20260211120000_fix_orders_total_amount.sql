-- Fix for "record 'new' has no field 'total_amount'" error
-- This error occurs when a trigger tries to access 'total_amount' which doesn't exist on orders table
-- We add it as a generated column so it's always available and in sync with 'total'

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS total_amount NUMERIC GENERATED ALWAYS AS (total) STORED;

-- Add comment explaining why this column exists
COMMENT ON COLUMN public.orders.total_amount IS 'Generated column to support triggers referencing total_amount instead of total';
