-- Create custom_domains table
CREATE TABLE public.custom_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT domain_lowercase CHECK (domain = lower(domain)),
  CONSTRAINT domain_unique UNIQUE (domain)
);

-- Enable RLS
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

-- Owner can manage their own domains
CREATE POLICY "Owners can manage their custom domains"
ON public.custom_domains
FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- Public can read active domains for storefront resolution
CREATE POLICY "Public can view active domains"
ON public.custom_domains
FOR SELECT
USING (status = 'active');

-- Create function to get tenant by domain
CREATE OR REPLACE FUNCTION public.get_tenant_id_by_domain(custom_domain TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.custom_domains 
  WHERE domain = lower(custom_domain) AND status = 'active'
$$;