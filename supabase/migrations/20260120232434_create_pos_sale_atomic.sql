-- ============================================================================
-- FIX #2: Atomic POS Sale Creation
-- Moved from 20260120232432... to resolve parser issues
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_pos_sale_atomic(
  p_tenant_id UUID,
  p_sale_number TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_customer_name TEXT DEFAULT 'Walk-in Customer',
  p_customer_phone TEXT DEFAULT NULL,
  p_subtotal NUMERIC DEFAULT 0,
  p_discount_amount NUMERIC DEFAULT 0,
  p_total NUMERIC DEFAULT 0,
  p_payment_method TEXT DEFAULT 'cash',
  p_cash_amount NUMERIC DEFAULT NULL,
  p_online_amount NUMERIC DEFAULT NULL,
  p_change_amount NUMERIC DEFAULT NULL,
  p_items JSONB DEFAULT '[]'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sale_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_qty INT;
  v_current_stock INT;
BEGIN
  -- Step 1: Check stock for all items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_qty := (v_item->>'quantity')::INT;
    
    SELECT stock_qty INTO v_current_stock
    FROM products
    WHERE id = v_product_id;
    
    IF v_current_stock IS NULL OR v_current_stock < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
    END IF;
  END LOOP;

  -- Step 2: Create POS sale
  INSERT INTO pos_sales (
    tenant_id, sale_number, customer_id, customer_name, customer_phone,
    subtotal, discount_amount, total, payment_method,
    cash_amount, online_amount, change_amount
  ) VALUES (
    p_tenant_id, p_sale_number, p_customer_id, p_customer_name, p_customer_phone,
    p_subtotal, p_discount_amount, p_total, p_payment_method,
    p_cash_amount, p_online_amount, p_change_amount
  )
  RETURNING id INTO v_sale_id;

  -- Step 3: Insert sale items and update stock atomically
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_qty := (v_item->>'quantity')::INT;
    
    -- Insert sale item
    INSERT INTO pos_sale_items (
      tenant_id, pos_sale_id, product_id, product_name, quantity,
      unit_price, discount_amount, line_total
    ) VALUES (
      p_tenant_id, v_sale_id, v_product_id,
      v_item->>'name',
      v_qty,
      (v_item->>'price')::NUMERIC,
      COALESCE((v_item->>'discount')::NUMERIC, 0),
      (v_item->>'price')::NUMERIC * v_qty - COALESCE((v_item->>'discount')::NUMERIC, 0)
    );
    
    -- Atomically reduce stock
    UPDATE products
    SET stock_qty = stock_qty - v_qty
    WHERE id = v_product_id AND stock_qty >= v_qty;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Failed to reduce stock for product %', v_product_id;
    END IF;
    
    -- Create inventory movement
    INSERT INTO inventory_movements (
      tenant_id, product_id, variant_id, movement_type, quantity,
      reference_type, reference_id, notes
    ) VALUES (
      p_tenant_id, v_product_id, NULL, 'pos_sale', -v_qty,
      'pos_sale', v_sale_id, 'POS Sale ' || p_sale_number
    );
  END LOOP;

  RETURN v_sale_id;
END;
$$;
