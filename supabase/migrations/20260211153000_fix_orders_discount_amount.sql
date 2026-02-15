-- Fix for "record 'new' has no field 'discount_amount'" error
-- The zombie trigger continues. We are mapping modern column names to legacy ones.

-- 1. Add discount_amount (mirrors discount_total)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC GENERATED ALWAYS AS (discount_total) STORED;

-- 2. Add promo_code (mirrors coupon_code) - likely next error
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS promo_code TEXT GENERATED ALWAYS AS (coupon_code) STORED;

-- Comments
COMMENT ON COLUMN public.orders.discount_amount IS 'Generated column to support triggers referencing discount_amount instead of discount_total';
