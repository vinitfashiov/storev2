-- Create homepage_layouts table for storing page builder layouts
CREATE TABLE public.homepage_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  layout_data JSONB NOT NULL DEFAULT '{"sections": []}',
  draft_data JSONB,
  published_at TIMESTAMP WITH TIME ZONE,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT homepage_layouts_tenant_unique UNIQUE (tenant_id)
);

-- Create layout_versions table for versioning
CREATE TABLE public.layout_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  layout_data JSONB NOT NULL,
  version INTEGER NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast version lookups
CREATE INDEX idx_layout_versions_tenant_version ON public.layout_versions(tenant_id, version DESC);

-- Enable RLS
ALTER TABLE public.homepage_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layout_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for homepage_layouts (admin access via user_tenants)
CREATE POLICY "Users can view their tenant layouts"
ON public.homepage_layouts
FOR SELECT
USING (
  tenant_id IN (
    SELECT ut.tenant_id FROM public.user_tenants ut WHERE ut.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their tenant layouts"
ON public.homepage_layouts
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT ut.tenant_id FROM public.user_tenants ut WHERE ut.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their tenant layouts"
ON public.homepage_layouts
FOR UPDATE
USING (
  tenant_id IN (
    SELECT ut.tenant_id FROM public.user_tenants ut WHERE ut.user_id = auth.uid()
  )
);

-- RLS policies for layout_versions
CREATE POLICY "Users can view their tenant versions"
ON public.layout_versions
FOR SELECT
USING (
  tenant_id IN (
    SELECT ut.tenant_id FROM public.user_tenants ut WHERE ut.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their tenant versions"
ON public.layout_versions
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT ut.tenant_id FROM public.user_tenants ut WHERE ut.user_id = auth.uid()
  )
);

-- Public read policy for storefront rendering (anonymous access to published layouts)
CREATE POLICY "Anyone can view published layouts"
ON public.homepage_layouts
FOR SELECT
USING (
  published_at IS NOT NULL AND layout_data IS NOT NULL
);

-- Trigger for updated_at
CREATE TRIGGER update_homepage_layouts_updated_at
BEFORE UPDATE ON public.homepage_layouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();