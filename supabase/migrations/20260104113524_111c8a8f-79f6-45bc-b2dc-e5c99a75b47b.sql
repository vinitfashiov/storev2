-- Add policy to allow checking if Razorpay is configured (read-only, by tenant_id)
-- This is needed for storefront checkout to detect payment method availability
CREATE POLICY "Public can check if integrations exist"
ON public.tenant_integrations
FOR SELECT
USING (true);

-- Note: The razorpay_key_secret should never be exposed in client queries
-- The edge function handles the actual secret lookup securely