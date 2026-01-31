-- Secure RLS Policies
-- Fixes warnings about 'USING (true)' and secures sensitive tables

-- 1. Analytics Sessions (Update was open to public!)
DROP POLICY IF EXISTS "Public update sessions" ON public.analytics_sessions;
-- Restrict updates to service_role only (e.g. for background jobs) or owner
CREATE POLICY "Service role update sessions" ON public.analytics_sessions
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Store Analytics Daily (Was open to public!)
DROP POLICY IF EXISTS "Service role can manage daily analytics" ON public.store_analytics_daily;
CREATE POLICY "Service role manage daily analytics" ON public.store_analytics_daily
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Analytics Events (Explicit public insert)
DROP POLICY IF EXISTS "Public insert events" ON public.analytics_events;
CREATE POLICY "Public insert events" ON public.analytics_events
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 4. Analytics Sessions (Explicit public insert)
DROP POLICY IF EXISTS "Public insert sessions" ON public.analytics_sessions;
CREATE POLICY "Public insert sessions" ON public.analytics_sessions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 5. Fix "RLS Enabled No Policy" warnings
-- Add default deny policies or specific policies for tables that might be missing them

-- Example: tenants table (usually well protected, but ensure no gaps)
-- (Assuming tenants table has policies, skipping if unsure to avoid breakage, but fixing specific known issues)

-- Fix Store Performance Metrics (Explicit service role)
DROP POLICY IF EXISTS "Service role can insert performance metrics" ON public.store_performance_metrics;
CREATE POLICY "Service role insert performance metrics" ON public.store_performance_metrics
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Fix Store Events (Explicit service role)
DROP POLICY IF EXISTS "Service role can insert events" ON public.store_events;
CREATE POLICY "Service role insert events" ON public.store_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Fix Store Page Views (Explicit service role)
DROP POLICY IF EXISTS "Service role can insert page views" ON public.store_page_views;
CREATE POLICY "Service role insert page views" ON public.store_page_views
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Fix Store Sessions (Explicit service role)
DROP POLICY IF EXISTS "Service role can insert sessions" ON public.store_sessions;
CREATE POLICY "Service role insert sessions" ON public.store_sessions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update sessions" ON public.store_sessions;
CREATE POLICY "Service role update sessions" ON public.store_sessions
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on any tables that might have it missing (safety check)
ALTER TABLE IF EXISTS public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.store_analytics_daily ENABLE ROW LEVEL SECURITY;
