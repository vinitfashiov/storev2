-- =====================================================
-- RESTORE FUNCTION PERMISSIONS
-- The frontend calls these functions directly via RPC, so they need public access.
-- =====================================================

DO $$
BEGIN
  -- Grant execute permissions back to anon and authenticated roles
  GRANT EXECUTE ON FUNCTION public.create_order_atomic TO anon, authenticated;
  GRANT EXECUTE ON FUNCTION public.increment_coupon_usage TO anon, authenticated;
  
  -- Note: create_pos_sale_atomic is for POS (staff only), so we can keep it restricted 
  -- or grant it only to authenticated if needed. 
  -- For now, we'll leave it restricted unless we find a frontend usage.
END $$;
