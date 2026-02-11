-- =====================================================
-- 2. FIX SECURITY DEFINER VIEWS
-- Convert to SECURITY INVOKER for safety
-- Extracted from 20260120234326...
-- =====================================================

-- Drop and recreate tenants_public view with SECURITY INVOKER
DROP VIEW IF EXISTS public.tenants_public;
CREATE VIEW public.tenants_public 
WITH (security_invoker = on)
AS
SELECT 
  id,
  store_name,
  store_slug,
  business_type,
  is_active
FROM public.tenants
WHERE is_active = true AND deleted_at IS NULL;

-- Grant access to the view
GRANT SELECT ON public.tenants_public TO anon, authenticated;

-- Drop and recreate tenant_integrations_safe view with SECURITY INVOKER
DROP VIEW IF EXISTS public.tenant_integrations_safe;
CREATE VIEW public.tenant_integrations_safe
WITH (security_invoker = on)
AS
SELECT 
  id,
  tenant_id,
  created_at,
  updated_at,
  razorpay_key_id,
  razorpay_oauth_connected,
  razorpay_oauth_merchant_id,
  razorpay_oauth_public_token,
  shiprocket_email,
  shiprocket_pickup_location,
  CASE WHEN razorpay_key_secret IS NOT NULL AND razorpay_key_secret != '' THEN true ELSE false END as has_razorpay_secret,
  CASE WHEN shiprocket_password IS NOT NULL AND shiprocket_password != '' THEN true ELSE false END as has_shiprocket_password
FROM public.tenant_integrations;

-- Grant access to the safe view
GRANT SELECT ON public.tenant_integrations_safe TO authenticated;

-- Drop and recreate delivery_boys_safe view with SECURITY INVOKER
DROP VIEW IF EXISTS public.delivery_boys_safe;
CREATE VIEW public.delivery_boys_safe
WITH (security_invoker = on)
AS
SELECT 
  id,
  tenant_id,
  full_name,
  mobile_number,
  payment_type,
  monthly_salary,
  per_order_amount,
  percentage_value,
  is_active,
  wallet_balance,
  total_earned,
  total_paid,
  created_at,
  updated_at,
  CASE WHEN account_number IS NOT NULL AND account_number != '' THEN true ELSE false END as has_bank_account,
  CASE WHEN upi_id IS NOT NULL AND upi_id != '' THEN true ELSE false END as has_upi
FROM public.delivery_boys;

-- Grant access to the safe view
GRANT SELECT ON public.delivery_boys_safe TO authenticated;
