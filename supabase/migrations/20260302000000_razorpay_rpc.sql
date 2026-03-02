-- Add RPC function to securely check if Razorpay is configured for a tenant
CREATE OR REPLACE FUNCTION public.get_tenant_razorpay_key(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT razorpay_key_id
  FROM public.tenant_integrations
  WHERE tenant_id = p_tenant_id;
$$;
