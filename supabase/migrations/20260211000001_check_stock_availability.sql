-- Moved from 20260104114739 to fix "cannot insert multiple commands" error
-- Function: Fast stock check for checkout
CREATE OR REPLACE FUNCTION public.check_stock_availability(
  p_items JSONB
)
RETURNS TABLE(
  product_id UUID,
  variant_id UUID,
  requested_qty INT,
  available_qty INT,
  is_available BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (item->>'product_id')::UUID as product_id,
    (item->>'variant_id')::UUID as variant_id,
    (item->>'qty')::INT as requested_qty,
    CASE 
      WHEN (item->>'variant_id') IS NOT NULL THEN 
        COALESCE((SELECT pv.stock_qty FROM product_variants pv WHERE pv.id = (item->>'variant_id')::UUID), 0)
      ELSE 
        COALESCE((SELECT p.stock_qty FROM products p WHERE p.id = (item->>'product_id')::UUID), 0)
    END as available_qty,
    CASE 
      WHEN (item->>'variant_id') IS NOT NULL THEN 
        COALESCE((SELECT pv.stock_qty FROM product_variants pv WHERE pv.id = (item->>'variant_id')::UUID), 0) >= (item->>'qty')::INT
      ELSE 
        COALESCE((SELECT p.stock_qty FROM products p WHERE p.id = (item->>'product_id')::UUID), 0) >= (item->>'qty')::INT
    END as is_available
  FROM jsonb_array_elements(p_items) as item;
END;
$$;
