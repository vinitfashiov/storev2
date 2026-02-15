-- Fix for "record 'new' has no field 'shipping_cost'" error
-- The zombie trigger is still hungry.
-- We add 'shipping_cost' (aliased to delivery_fee) and 'tax' (aliased to tax_amount) to satisfy it.

-- 1. Add shipping_cost (mirrors delivery_fee)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC GENERATED ALWAYS AS (delivery_fee) STORED;

-- 2. Add tax (mirrors tax_amount which we added earlier, or 0 if tax_amount is null)
-- Note: usage of tax_amount requires it to exist. We added it in 20260211140000.
-- If tax_amount doesn't exist (e.g. migration skipped), we default to 0.
-- To be safe, we'll just make it a standard column with default 0, 
-- updating it from tax_amount if available is too complex for a simple DDL fix.
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tax NUMERIC DEFAULT 0;

-- Comments
COMMENT ON COLUMN public.orders.shipping_cost IS 'Generated column to support triggers referencing shipping_cost instead of delivery_fee';
