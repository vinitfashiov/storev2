-- Create store_sessions table for tracking visitor sessions
CREATE TABLE public.store_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  visitor_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  page_views INTEGER DEFAULT 1,
  country TEXT,
  country_code TEXT,
  city TEXT,
  region TEXT,
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  device_type TEXT,
  browser TEXT,
  os TEXT,
  referrer TEXT,
  landing_page TEXT,
  exit_page TEXT,
  is_bounce BOOLEAN DEFAULT false,
  is_converted BOOLEAN DEFAULT false,
  order_id UUID REFERENCES public.orders(id),
  cart_value NUMERIC(12, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create page_views table for detailed page tracking
CREATE TABLE public.store_page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  page_title TEXT,
  load_time_ms INTEGER,
  time_on_page_seconds INTEGER,
  scroll_depth INTEGER,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create store_events table for tracking specific events
CREATE TABLE public.store_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  page_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create performance_metrics table
CREATE TABLE public.store_performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  measured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  page_url TEXT NOT NULL,
  ttfb_ms INTEGER,
  fcp_ms INTEGER,
  lcp_ms INTEGER,
  fid_ms INTEGER,
  cls NUMERIC(6, 4),
  dom_interactive_ms INTEGER,
  dom_complete_ms INTEGER,
  device_type TEXT,
  connection_type TEXT
);

-- Create daily analytics summary table for faster querying
CREATE TABLE public.store_analytics_daily (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  avg_session_duration_seconds NUMERIC(10, 2),
  bounce_rate NUMERIC(5, 2),
  conversion_rate NUMERIC(5, 2),
  total_orders INTEGER DEFAULT 0,
  total_revenue NUMERIC(12, 2) DEFAULT 0,
  successful_payments INTEGER DEFAULT 0,
  failed_payments INTEGER DEFAULT 0,
  avg_load_time_ms INTEGER,
  top_pages JSONB,
  top_referrers JSONB,
  device_breakdown JSONB,
  country_breakdown JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, date)
);

-- Create indexes for performance
CREATE INDEX idx_store_sessions_tenant_started ON public.store_sessions(tenant_id, started_at DESC);
CREATE INDEX idx_store_sessions_session_id ON public.store_sessions(session_id);
CREATE INDEX idx_store_sessions_location ON public.store_sessions(tenant_id, country_code);
CREATE INDEX idx_store_page_views_tenant ON public.store_page_views(tenant_id, viewed_at DESC);
CREATE INDEX idx_store_page_views_session ON public.store_page_views(session_id);
CREATE INDEX idx_store_events_tenant ON public.store_events(tenant_id, created_at DESC);
CREATE INDEX idx_store_events_type ON public.store_events(tenant_id, event_type);
CREATE INDEX idx_store_performance_tenant ON public.store_performance_metrics(tenant_id, measured_at DESC);
CREATE INDEX idx_store_analytics_daily_tenant ON public.store_analytics_daily(tenant_id, date DESC);

-- Enable RLS
ALTER TABLE public.store_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_analytics_daily ENABLE ROW LEVEL SECURITY;

-- RLS Policies for store owners to view their analytics
CREATE POLICY "Store owners can view their sessions" ON public.store_sessions
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()));

CREATE POLICY "Store owners can view their page views" ON public.store_page_views
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()));

CREATE POLICY "Store owners can view their events" ON public.store_events
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()));

CREATE POLICY "Store owners can view their performance metrics" ON public.store_performance_metrics
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()));

CREATE POLICY "Store owners can view their daily analytics" ON public.store_analytics_daily
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()));

-- Insert policies for edge functions (using service role)
CREATE POLICY "Service role can insert sessions" ON public.store_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update sessions" ON public.store_sessions
  FOR UPDATE USING (true);

CREATE POLICY "Service role can insert page views" ON public.store_page_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert events" ON public.store_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert performance metrics" ON public.store_performance_metrics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage daily analytics" ON public.store_analytics_daily
  FOR ALL USING (true);

-- Function to get live session stats
CREATE OR REPLACE FUNCTION public.get_live_session_stats(p_tenant_id uuid, p_minutes integer DEFAULT 5)
RETURNS TABLE(
  active_sessions bigint,
  visitors_right_now bigint,
  active_carts bigint,
  checking_out bigint,
  purchased bigint,
  top_locations jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM store_sessions 
     WHERE tenant_id = p_tenant_id 
     AND started_at >= now() - (p_minutes || ' minutes')::interval
     AND (ended_at IS NULL OR ended_at >= now() - interval '2 minutes')) as active_sessions,
    (SELECT COUNT(DISTINCT visitor_id) FROM store_sessions 
     WHERE tenant_id = p_tenant_id 
     AND started_at >= now() - (p_minutes || ' minutes')::interval) as visitors_right_now,
    (SELECT COUNT(*) FROM store_events 
     WHERE tenant_id = p_tenant_id 
     AND event_type = 'add_to_cart'
     AND created_at >= now() - (p_minutes || ' minutes')::interval) as active_carts,
    (SELECT COUNT(*) FROM store_events 
     WHERE tenant_id = p_tenant_id 
     AND event_type = 'checkout_started'
     AND created_at >= now() - (p_minutes || ' minutes')::interval) as checking_out,
    (SELECT COUNT(*) FROM store_events 
     WHERE tenant_id = p_tenant_id 
     AND event_type = 'purchase_complete'
     AND created_at >= now() - (p_minutes || ' minutes')::interval) as purchased,
    (SELECT jsonb_agg(loc) FROM (
      SELECT jsonb_build_object(
        'country', country,
        'country_code', country_code,
        'city', city,
        'lat', latitude,
        'lng', longitude,
        'count', COUNT(*)
      ) as loc
      FROM store_sessions
      WHERE tenant_id = p_tenant_id
      AND started_at >= now() - (p_minutes || ' minutes')::interval
      AND latitude IS NOT NULL
      GROUP BY country, country_code, city, latitude, longitude
      ORDER BY COUNT(*) DESC
      LIMIT 50
    ) sub) as top_locations;
END;
$$;

-- Function to get analytics summary
CREATE OR REPLACE FUNCTION public.get_analytics_summary(
  p_tenant_id uuid, 
  p_date_from date DEFAULT (CURRENT_DATE - interval '30 days')::date, 
  p_date_to date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_sessions bigint,
  unique_visitors bigint,
  total_page_views bigint,
  avg_session_duration numeric,
  bounce_rate numeric,
  conversion_rate numeric,
  total_orders bigint,
  total_revenue numeric,
  successful_payments bigint,
  failed_payments bigint,
  avg_load_time numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(sad.total_sessions), 0)::bigint,
    COALESCE(SUM(sad.unique_visitors), 0)::bigint,
    COALESCE(SUM(sad.page_views), 0)::bigint,
    COALESCE(AVG(sad.avg_session_duration_seconds), 0)::numeric,
    COALESCE(AVG(sad.bounce_rate), 0)::numeric,
    COALESCE(AVG(sad.conversion_rate), 0)::numeric,
    COALESCE(SUM(sad.total_orders), 0)::bigint,
    COALESCE(SUM(sad.total_revenue), 0)::numeric,
    COALESCE(SUM(sad.successful_payments), 0)::bigint,
    COALESCE(SUM(sad.failed_payments), 0)::bigint,
    COALESCE(AVG(sad.avg_load_time_ms), 0)::numeric
  FROM store_analytics_daily sad
  WHERE sad.tenant_id = p_tenant_id
  AND sad.date BETWEEN p_date_from AND p_date_to;
END;
$$;