-- Add OAuth columns to tenant_integrations for Razorpay OAuth flow
ALTER TABLE public.tenant_integrations
ADD COLUMN IF NOT EXISTS razorpay_oauth_access_token TEXT,
ADD COLUMN IF NOT EXISTS razorpay_oauth_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS razorpay_oauth_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS razorpay_oauth_merchant_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_oauth_public_token TEXT,
ADD COLUMN IF NOT EXISTS razorpay_oauth_state TEXT,
ADD COLUMN IF NOT EXISTS razorpay_oauth_connected BOOLEAN DEFAULT false;

-- Update the safe view to include OAuth status (but not tokens)
DROP VIEW IF EXISTS public.tenant_integrations_safe;

CREATE VIEW public.tenant_integrations_safe AS
SELECT 
  id,
  tenant_id,
  razorpay_key_id,
  shiprocket_email,
  shiprocket_pickup_location,
  created_at,
  updated_at,
  (razorpay_key_secret IS NOT NULL AND razorpay_key_secret != '') AS has_razorpay_secret,
  (shiprocket_password IS NOT NULL AND shiprocket_password != '') AS has_shiprocket_password,
  razorpay_oauth_connected,
  razorpay_oauth_merchant_id,
  razorpay_oauth_public_token
FROM public.tenant_integrations;