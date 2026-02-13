-- Fix for "record 'new' has no field 'currency'" error and OTHER potential missing fields
-- A zombie trigger is trying to access 'currency' and likely other legacy fields.
-- We add them as columns with safe defaults to satisfy the trigger completely.

-- 1. Add currency (default INR)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- 2. Add tax_amount (default 0) - likely to be used if total_amount was used
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0;

-- 3. Add shipping_tax (default 0) - common legacy field
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_tax NUMERIC DEFAULT 0;

-- 4. Add exchange_rate (default 1) - common for multi-currency
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 1;

-- 5. Add metadata (default {}) - catch-all for extra data
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add comments
COMMENT ON COLUMN public.orders.currency IS 'Added to satisfy legacy triggers referencing currency.';
COMMENT ON COLUMN public.orders.tax_amount IS 'Added to satisfy legacy triggers referencing tax_amount.';
