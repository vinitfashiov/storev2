-- Function: Atomic stock reduction for orders
CREATE OR REPLACE FUNCTION public.reduce_stock_atomic(
  p_items JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
  v_product_id UUID;
  v_variant_id UUID;
  v_qty INT;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (item->>'product_id')::UUID;
    v_variant_id := (item->>'variant_id')::UUID;
    v_qty := (item->>'qty')::INT;
    
    IF v_variant_id IS NOT NULL THEN
      UPDATE product_variants 
      SET stock_qty = stock_qty - v_qty 
      WHERE id = v_variant_id AND stock_qty >= v_qty;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock for variant %', v_variant_id;
      END IF;
    ELSE
      UPDATE products 
      SET stock_qty = stock_qty - v_qty 
      WHERE id = v_product_id AND stock_qty >= v_qty;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
      END IF;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$;
