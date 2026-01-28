-- Theme Editor Migration
-- Creates tables for theme layouts and section templates

-- Theme Layouts Table
CREATE TABLE IF NOT EXISTS theme_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  layout_name VARCHAR(255) DEFAULT 'Default Theme',
  layout_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_theme_layouts_tenant ON theme_layouts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_theme_layouts_published ON theme_layouts(tenant_id, is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_theme_layouts_updated ON theme_layouts(tenant_id, updated_at DESC);

-- Unique constraint: Only one published layout per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_theme_layouts_unique_published 
ON theme_layouts(tenant_id) 
WHERE is_published = true;

-- Theme Layout History (for version control)
CREATE TABLE IF NOT EXISTS theme_layout_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id UUID REFERENCES theme_layouts(id) ON DELETE CASCADE NOT NULL,
  layout_data JSONB NOT NULL,
  version INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(layout_id, version)
);

CREATE INDEX IF NOT EXISTS idx_theme_layout_history_layout ON theme_layout_history(layout_id, version DESC);

-- Section Templates (for future template system)
CREATE TABLE IF NOT EXISTS section_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  template_name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) NOT NULL,
  html_code TEXT,
  css_code TEXT,
  preview_image_url TEXT,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_section_templates_tenant ON section_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_section_templates_public ON section_templates(is_public, template_type) WHERE is_public = true;

-- RLS Policies for theme_layouts
ALTER TABLE theme_layouts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tenant's layouts
CREATE POLICY "Users can view their tenant's theme layouts"
  ON theme_layouts FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can insert layouts for their tenant
CREATE POLICY "Users can create theme layouts for their tenant"
  ON theme_layouts FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can update their tenant's layouts
CREATE POLICY "Users can update their tenant's theme layouts"
  ON theme_layouts FOR UPDATE
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can delete their tenant's layouts
CREATE POLICY "Users can delete their tenant's theme layouts"
  ON theme_layouts FOR DELETE
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- RLS Policies for theme_layout_history
ALTER TABLE theme_layout_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant's theme layout history"
  ON theme_layout_history FOR SELECT
  USING (
    layout_id IN (
      SELECT id FROM theme_layouts 
      WHERE tenant_id IN (
        SELECT id FROM tenants WHERE owner_id = auth.uid()
      )
    )
  );

-- RLS Policies for section_templates
ALTER TABLE section_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public templates or their own"
  ON section_templates FOR SELECT
  USING (
    is_public = true OR
    tenant_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create templates for their tenant"
  ON section_templates FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_theme_layout_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for theme_layouts
CREATE TRIGGER update_theme_layouts_updated_at
  BEFORE UPDATE ON theme_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_theme_layout_updated_at();

-- Trigger for section_templates
CREATE TRIGGER update_section_templates_updated_at
  BEFORE UPDATE ON section_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_theme_layout_updated_at();
