-- Create user_tenants junction table for multi-store support
-- CREATE TABLE public.user_tenants (
--   id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
--   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
--   is_primary BOOLEAN NOT NULL DEFAULT false,
--   created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
--   UNIQUE(user_id, tenant_id)
-- );

-- Add deleted_at column to tenants for soft delete
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Enable RLS
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_tenants
CREATE POLICY "Users can view their own tenant associations"
ON public.user_tenants FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own tenant associations"
ON public.user_tenants FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tenant associations"
ON public.user_tenants FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own tenant associations"
ON public.user_tenants FOR DELETE
USING (user_id = auth.uid());

-- Function to get all tenants for a user
DROP FUNCTION IF EXISTS public.get_user_tenants();
CREATE OR REPLACE FUNCTION public.get_user_tenants()
RETURNS TABLE (
  id UUID,
  store_name TEXT,
  store_slug TEXT,
  business_type TEXT,
  is_active BOOLEAN,
  plan TEXT,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  is_primary BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.store_name,
    t.store_slug,
    t.business_type::TEXT,
    t.is_active,
    t.plan::TEXT,
    t.trial_ends_at,
    ut.is_primary,
    t.created_at
  FROM user_tenants ut
  JOIN tenants t ON t.id = ut.tenant_id
  WHERE ut.user_id = auth.uid()
    AND t.deleted_at IS NULL
  ORDER BY ut.is_primary DESC, t.created_at DESC;
END;
$$;

-- Function to get primary tenant ID
DROP FUNCTION IF EXISTS public.get_user_primary_tenant_id();
CREATE OR REPLACE FUNCTION public.get_user_primary_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  primary_tenant_id UUID;
BEGIN
  SELECT ut.tenant_id INTO primary_tenant_id
  FROM user_tenants ut
  JOIN tenants t ON t.id = ut.tenant_id
  WHERE ut.user_id = auth.uid()
    AND ut.is_primary = true
    AND t.deleted_at IS NULL
  LIMIT 1;
  
  IF primary_tenant_id IS NULL THEN
    SELECT ut.tenant_id INTO primary_tenant_id
    FROM user_tenants ut
    JOIN tenants t ON t.id = ut.tenant_id
    WHERE ut.user_id = auth.uid()
      AND t.deleted_at IS NULL
    ORDER BY t.created_at ASC
    LIMIT 1;
  END IF;
  
  RETURN primary_tenant_id;
END;
$$;

-- Function to set primary tenant
DROP FUNCTION IF EXISTS public.set_primary_tenant(UUID);
CREATE OR REPLACE FUNCTION public.set_primary_tenant(target_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_tenants SET is_primary = false WHERE user_id = auth.uid();
  UPDATE user_tenants SET is_primary = true WHERE user_id = auth.uid() AND tenant_id = target_tenant_id;
  UPDATE profiles SET tenant_id = target_tenant_id WHERE id = auth.uid();
  RETURN true;
END;
$$;

-- Function to soft delete a tenant
DROP FUNCTION IF EXISTS public.delete_tenant(UUID);
DROP FUNCTION IF EXISTS public.delete_tenant(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.delete_tenant(target_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_tenants WHERE user_id = auth.uid() AND tenant_id = target_tenant_id
  ) INTO has_access;
  
  IF NOT has_access THEN
    RETURN false;
  END IF;
  
  UPDATE tenants SET deleted_at = now(), is_active = false WHERE id = target_tenant_id;
  DELETE FROM user_tenants WHERE tenant_id = target_tenant_id;
  
  RETURN true;
END;
$$;

-- Migrate existing data: create user_tenants entries for existing profile-tenant relationships
INSERT INTO user_tenants (user_id, tenant_id, is_primary)
SELECT p.id, p.tenant_id, true
FROM profiles p
WHERE p.tenant_id IS NOT NULL
ON CONFLICT (user_id, tenant_id) DO NOTHING;