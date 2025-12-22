-- Create store_banners table
CREATE TABLE public.store_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_path TEXT NOT NULL,
  cta_text TEXT,
  cta_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on store_banners
ALTER TABLE public.store_banners ENABLE ROW LEVEL SECURITY;

-- RLS policies for store_banners
CREATE POLICY "Owners can manage their banners"
ON public.store_banners FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Public can view active banners"
ON public.store_banners FOR SELECT
USING (
  is_active = true
  AND (starts_at IS NULL OR now() >= starts_at)
  AND (ends_at IS NULL OR now() <= ends_at)
);

-- Add logo_path to brands table
ALTER TABLE public.brands ADD COLUMN logo_path TEXT;

-- Create store_settings table (one row per tenant)
CREATE TABLE public.store_settings (
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE PRIMARY KEY,
  website_title TEXT,
  website_description TEXT,
  store_phone TEXT,
  store_email TEXT,
  store_address TEXT,
  logo_path TEXT,
  favicon_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on store_settings
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for store_settings
CREATE POLICY "Owners can manage their store settings"
ON public.store_settings FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Public can view store settings"
ON public.store_settings FOR SELECT
USING (true);

-- Create store_pages table
CREATE TABLE public.store_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content_html TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

-- Enable RLS on store_pages
ALTER TABLE public.store_pages ENABLE ROW LEVEL SECURITY;

-- RLS policies for store_pages
CREATE POLICY "Owners can manage their pages"
ON public.store_pages FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Public can view published pages"
ON public.store_pages FOR SELECT
USING (is_published = true);

-- Create store-assets storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for store-assets bucket
CREATE POLICY "Owners can upload store assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'store-assets' 
  AND (storage.foldername(name))[1] = get_user_tenant_id()::text
);

CREATE POLICY "Owners can update store assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'store-assets' 
  AND (storage.foldername(name))[1] = get_user_tenant_id()::text
);

CREATE POLICY "Owners can delete store assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'store-assets' 
  AND (storage.foldername(name))[1] = get_user_tenant_id()::text
);

CREATE POLICY "Public can view store assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'store-assets');

-- Create trigger for store_settings updated_at
CREATE TRIGGER update_store_settings_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for store_pages updated_at
CREATE TRIGGER update_store_pages_updated_at
BEFORE UPDATE ON public.store_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();