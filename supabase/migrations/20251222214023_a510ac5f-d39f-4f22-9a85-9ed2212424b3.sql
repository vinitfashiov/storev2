-- Add shiprocket pickup location to tenant_integrations
ALTER TABLE public.tenant_integrations 
ADD COLUMN IF NOT EXISTS shiprocket_pickup_location text;