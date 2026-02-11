-- ============================================================================
-- FIX #1 & #8: Atomic Order Creation for COD (with transaction safety)
-- Moved from 20260120232432... to resolve parser issues
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_tenant_id UUID,
  p_order_number TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_customer_name TEXT DEFAULT NULL,
  p_customer_phone TEXT DEFAULT NULL,
  p_customer_email TEXT DEFAULT NULL,
  p_shipping_address JSONB DEFAULT '{}'::JSONB,
  p_subtotal NUMERIC DEFAULT 0,
  p_discount_total NUMERIC DEFAULT 0,
  p_delivery_fee NUMERIC DEFAULT 0,
  p_total NUMERIC DEFAULT 0,
  p_payment_method TEXT DEFAULT 'cod',
  p_payment_status TEXT DEFAULT 'unpaid',
  p_status TEXT DEFAULT 'pending',
  p_delivery_zone_id UUID DEFAULT NULL,
  p_delivery_slot_id UUID DEFAULT NULL,
  p_delivery_option TEXT DEFAULT 'standard',
  p_coupon_id UUID DEFAULT NULL,
  p_coupon_code TEXT DEFAULT NULL,
  p_razorpay_order_id TEXT DEFAULT NULL,
  p_razorpay_payment_id TEXT DEFAULT NULL,
  p_order_items JSONB DEFAULT '[]'::JSONB,
  p_cart_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_variant_id UUID;
  v_qty INT;
  v_current_stock INT;
BEGIN
  -- Step 1: Check stock availability for all items BEFORE creating order
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_variant_id := (v_item->>'variant_id')::UUID;
    v_qty := (v_item->>'qty')::INT;
    
    IF v_variant_id IS NOT NULL THEN
      SELECT stock_qty INTO v_current_stock
      FROM product_variants
      WHERE id = v_variant_id;
      
      IF v_current_stock IS NULL OR v_current_stock < v_qty THEN
        RAISE EXCEPTION 'Insufficient stock for variant %', v_variant_id;
      END IF;
    ELSE
      SELECT stock_qty INTO v_current_stock
      FROM products
      WHERE id = v_product_id;
      
      IF v_current_stock IS NULL OR v_current_stock < v_qty THEN
        RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
      END IF;
    END IF;
  END LOOP;

  -- Step 2: Create order
  INSERT INTO orders (
    tenant_id, order_number, customer_id, customer_name, customer_phone,
    customer_email, shipping_address, subtotal, discount_total, delivery_fee,
    total, payment_method, payment_status, status, delivery_zone_id,
    delivery_slot_id, delivery_option, coupon_id, coupon_code,
    razorpay_order_id, razorpay_payment_id
  ) VALUES (
    p_tenant_id, p_order_number, p_customer_id, p_customer_name, p_customer_phone,
    p_customer_email, p_shipping_address, p_subtotal, p_discount_total, p_delivery_fee,
    p_total, p_payment_method, p_payment_status, p_status, p_delivery_zone_id,
    p_delivery_slot_id, p_delivery_option, p_coupon_id, p_coupon_code,
    p_razorpay_order_id, p_razorpay_payment_id
  )
  RETURNING id INTO v_order_id;

  -- Step 3: Insert order items and update stock atomically
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_variant_id := (v_item->>'variant_id')::UUID;
    v_qty := (v_item->>'qty')::INT;
    
    -- Insert order item
    INSERT INTO order_items (
      tenant_id, order_id, product_id, variant_id, name, qty, unit_price, line_total
    ) VALUES (
      p_tenant_id, v_order_id, v_product_id, v_variant_id,
      COALESCE(v_item->>'name', 'Product'),
      v_qty,
      (v_item->>'unit_price')::NUMERIC,
      COALESCE((v_item->>'line_total')::NUMERIC, (v_item->>'unit_price')::NUMERIC * v_qty)
    );
    
    -- Atomically reduce stock (with check to prevent negative)
    IF v_variant_id IS NOT NULL THEN
      UPDATE product_variants
      SET stock_qty = stock_qty - v_qty
      WHERE id = v_variant_id AND stock_qty >= v_qty;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to reduce stock for variant %', v_variant_id;
      END IF;
    ELSE
      UPDATE products
      SET stock_qty = stock_qty - v_qty
      WHERE id = v_product_id AND stock_qty >= v_qty;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to reduce stock for product %', v_product_id;
      END IF;
    END IF;
    
    -- Create inventory movement
    INSERT INTO inventory_movements (
      tenant_id, product_id, variant_id, movement_type, quantity,
      reference_type, reference_id, notes
    ) VALUES (
      p_tenant_id, v_product_id, v_variant_id, 'sale', -v_qty,
      'order', v_order_id, 'Order ' || p_order_number
    );
  END LOOP;

  -- Step 4: Update cart status if provided
  IF p_cart_id IS NOT NULL THEN
    UPDATE carts SET status = 'converted' WHERE id = p_cart_id;
  END IF;

  RETURN v_order_id;
END;
$$;
