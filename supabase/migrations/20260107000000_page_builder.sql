-- Page Builder Migration
-- Stores homepage layout data for each tenant

CREATE TABLE IF NOT EXISTS public.homepage_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  layout_data JSONB NOT NULL DEFAULT '{"sections": []}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

-- Ensure columns exist if table was created previously without them
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'homepage_layouts' AND column_name = 'is_active') THEN
        ALTER TABLE public.homepage_layouts ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'homepage_layouts' AND column_name = 'layout_data') THEN
        ALTER TABLE public.homepage_layouts ADD COLUMN layout_data JSONB NOT NULL DEFAULT '{"sections": []}'::jsonb;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.homepage_layouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Owners can manage their homepage layouts" ON public.homepage_layouts;
CREATE POLICY "Owners can manage their homepage layouts"
ON public.homepage_layouts FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

DROP POLICY IF EXISTS "Public can view active homepage layouts" ON public.homepage_layouts;
CREATE POLICY "Public can view active homepage layouts"
ON public.homepage_layouts FOR SELECT
USING (is_active = true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_homepage_layouts_tenant_id ON public.homepage_layouts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_homepage_layouts_active ON public.homepage_layouts(tenant_id, is_active) WHERE is_active = true;
