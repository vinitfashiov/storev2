-- Add missing public RLS policies for payment_intents
-- This is necessary to allow storefront checkouts to initiate Razorpay payments without being authenticated

-- Public can create payment intents (storefront)
CREATE POLICY "Public can create payment intents"
ON public.payment_intents
FOR INSERT
WITH CHECK (true);

-- Public can update their own payment intents (by id, no auth required for storefront)
CREATE POLICY "Public can update payment intents"
ON public.payment_intents
FOR UPDATE
USING (true);

-- Public can view payment intents
CREATE POLICY "Public can view payment intents"
ON public.payment_intents
FOR SELECT
USING (true);
