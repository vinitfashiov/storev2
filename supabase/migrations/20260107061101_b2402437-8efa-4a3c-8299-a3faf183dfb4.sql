-- Ensure published homepage layouts are publicly readable (storefront is public)
ALTER TABLE public.homepage_layouts ENABLE ROW LEVEL SECURITY;

-- Public can read ONLY published layouts
DROP POLICY IF EXISTS "Public can read published homepage layouts" ON public.homepage_layouts;
CREATE POLICY "Public can read published homepage layouts"
ON public.homepage_layouts
FOR SELECT
TO anon, authenticated
USING (published_at IS NOT NULL);

-- (Optional but safe) prevent public reading drafts via other queries
-- No INSERT/UPDATE/DELETE policies added here.
