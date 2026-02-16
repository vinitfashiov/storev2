-- Function to sync return_requests status to orders table and UPDATE main status columns
CREATE OR REPLACE FUNCTION public.sync_return_status_to_orders()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Handle INSERT or UPDATE
  -- Status mapping:
  -- requested -> return: requested, refund: pending
  -- approved -> return: approved, refund: processing, order: return_approved
  -- rejected -> return: rejected, refund: rejected
  -- refunded -> return: returned, refund: refunded, order: returned, payment: refunded

  IF NEW.status = 'requested' THEN
    UPDATE public.orders
    SET return_status = 'requested',
        refund_status = 'pending'
    WHERE id = NEW.order_id;
  
  ELSIF NEW.status = 'approved' THEN
    UPDATE public.orders
    SET return_status = 'approved',
        refund_status = 'processing',
        status = 'return_approved' -- Update main status
    WHERE id = NEW.order_id;
  
  ELSIF NEW.status = 'rejected' THEN
    UPDATE public.orders
    SET return_status = 'rejected',
        refund_status = 'rejected'
        -- Main status remains 'delivered' or whatever it was
    WHERE id = NEW.order_id;
  
  ELSIF NEW.status = 'refunded' THEN
    UPDATE public.orders
    SET return_status = 'returned',
        refund_status = 'refunded',
        status = 'returned', -- Update main status
        payment_status = 'refunded' -- Update payment status
    WHERE id = NEW.order_id;
  
  ELSIF NEW.status = 'cancelled' THEN
     -- If user cancels return request
    UPDATE public.orders
    SET return_status = 'cancelled',
        refund_status = NULL,
        status = 'delivered' -- Reset main status to delivered (assuming returns only happen after delivery)
    WHERE id = NEW.order_id;
  END IF;

  RETURN NEW;
END;
$$;

-- No need to recreate trigger as it calls the same function name.
-- Just need to backfill existing data to fix the "Delivered" / "Paid" issue.

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
