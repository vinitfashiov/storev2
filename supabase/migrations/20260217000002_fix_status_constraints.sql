-- Drop existing constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add updated constraint including return statuses
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status = ANY (ARRAY['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'return_approved', 'returned']));

-- Re-apply the function update (just to be safe and ensure it is the latest version)
CREATE OR REPLACE FUNCTION public.sync_return_status_to_orders()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Handle INSERT or UPDATE
  IF NEW.status = 'requested' THEN
    UPDATE public.orders
    SET return_status = 'requested',
        refund_status = 'pending'
    WHERE id = NEW.order_id;
  
  ELSIF NEW.status = 'approved' THEN
    UPDATE public.orders
    SET return_status = 'approved',
        refund_status = 'processing',
        status = 'return_approved'
    WHERE id = NEW.order_id;
  
  ELSIF NEW.status = 'rejected' THEN
    UPDATE public.orders
    SET return_status = 'rejected',
        refund_status = 'rejected'
    WHERE id = NEW.order_id;
  
  ELSIF NEW.status = 'refunded' THEN
    UPDATE public.orders
    SET return_status = 'returned',
        refund_status = 'refunded',
        status = 'returned',
        payment_status = 'refunded'
    WHERE id = NEW.order_id;
  
  ELSIF NEW.status = 'cancelled' THEN
    UPDATE public.orders
    SET return_status = 'cancelled',
        refund_status = NULL,
        status = 'delivered'
    WHERE id = NEW.order_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill again
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT * FROM public.return_requests LOOP
    IF r.status = 'approved' THEN
      UPDATE public.orders 
      SET status = 'return_approved' 
      WHERE id = r.order_id AND status != 'return_approved';
    ELSIF r.status = 'refunded' THEN
      UPDATE public.orders 
      SET status = 'returned', payment_status = 'refunded' 
      WHERE id = r.order_id AND (status != 'returned' OR payment_status != 'refunded');
    END IF;
  END LOOP;
END;
$$;
