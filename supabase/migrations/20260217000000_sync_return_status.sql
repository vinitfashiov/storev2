-- Function to sync return_requests status to orders table
CREATE OR REPLACE FUNCTION public.sync_return_status_to_orders()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Handle INSERT or UPDATE
  -- Status mapping:
  -- requested -> return: requested, refund: pending
  -- approved -> return: approved, refund: processing
  -- rejected -> return: rejected, refund: null (or failed/rejected)
  -- refunded -> return: approved/completed, refund: completed

  IF NEW.status = 'requested' THEN
    UPDATE public.orders
    SET return_status = 'requested',
        refund_status = 'pending'
    WHERE id = NEW.order_id;
  
  ELSIF NEW.status = 'approved' THEN
    UPDATE public.orders
    SET return_status = 'approved',
        refund_status = 'processing'
    WHERE id = NEW.order_id;
  
  ELSIF NEW.status = 'rejected' THEN
    UPDATE public.orders
    SET return_status = 'rejected',
        refund_status = 'rejected' -- Explicitly mark refund as rejected too
    WHERE id = NEW.order_id;
  
  ELSIF NEW.status = 'refunded' THEN
    UPDATE public.orders
    SET return_status = 'returned', -- Final state
        refund_status = 'refunded'
    WHERE id = NEW.order_id;
  
  ELSIF NEW.status = 'cancelled' THEN
     -- If user cancels return request
    UPDATE public.orders
    SET return_status = 'cancelled',
        refund_status = NULL
    WHERE id = NEW.order_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create Trigger
DROP TRIGGER IF EXISTS on_return_request_change ON public.return_requests;
CREATE TRIGGER on_return_request_change
AFTER INSERT OR UPDATE ON public.return_requests
FOR EACH ROW
EXECUTE FUNCTION public.sync_return_status_to_orders();

-- Backfill existing data
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT * FROM public.return_requests LOOP
    -- Re-run logic for existing rows by simulating an update (or just directly calling logic, but simpler to update orders directly here matching the logic)
    IF r.status = 'requested' THEN
      UPDATE public.orders SET return_status = 'requested', refund_status = 'pending' WHERE id = r.order_id;
    ELSIF r.status = 'approved' THEN
      UPDATE public.orders SET return_status = 'approved', refund_status = 'processing' WHERE id = r.order_id;
    ELSIF r.status = 'rejected' THEN
      UPDATE public.orders SET return_status = 'rejected', refund_status = 'rejected' WHERE id = r.order_id;
    ELSIF r.status = 'refunded' THEN
      UPDATE public.orders SET return_status = 'returned', refund_status = 'refunded' WHERE id = r.order_id;
    END IF;
  END LOOP;
END;
$$;
