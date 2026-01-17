-- Create a secure view that excludes sensitive secret columns
-- This view will be used by the client instead of direct table access

CREATE VIEW public.tenant_integrations_safe 
WITH (security_invoker = true) AS
SELECT 
  id,
  tenant_id,
  razorpay_key_id,
  shiprocket_email,
  shiprocket_pickup_location,
  created_at,
  updated_at,
  CASE WHEN razorpay_key_secret IS NOT NULL AND razorpay_key_secret != '' THEN true ELSE false END as has_razorpay_secret,
  CASE WHEN shiprocket_password IS NOT NULL AND shiprocket_password != '' THEN true ELSE false END as has_shiprocket_password
FROM public.tenant_integrations;

-- Grant SELECT access to authenticated users on the safe view
GRANT SELECT ON public.tenant_integrations_safe TO authenticated;

-- Add comment explaining the purpose
COMMENT ON VIEW public.tenant_integrations_safe IS 'Safe view of tenant_integrations that excludes sensitive credentials. Use this from client-side code.';