-- =====================================================
-- 1. REVOKE ATOMIC FUNCTION PUBLIC ACCESS
-- These should only be called by service role (edge functions)
-- wrapped in DO block to ensure atomic execution and parser compatibility
-- =====================================================

DO $$
BEGIN
  -- Revoke execute permissions
  -- We revoke from PUBLIC first, then specific roles to be thorough
  REVOKE EXECUTE ON FUNCTION public.create_order_atomic FROM public;
  REVOKE EXECUTE ON FUNCTION public.increment_coupon_usage FROM public;
  REVOKE EXECUTE ON FUNCTION public.create_pos_sale_atomic FROM public;

  REVOKE EXECUTE ON FUNCTION public.create_order_atomic FROM anon, authenticated;
  REVOKE EXECUTE ON FUNCTION public.increment_coupon_usage FROM anon, authenticated;
  REVOKE EXECUTE ON FUNCTION public.create_pos_sale_atomic FROM anon, authenticated;
END $$;