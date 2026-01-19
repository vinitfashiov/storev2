-- Make analytics work without relying on pre-aggregated daily tables (no cron required)

CREATE OR REPLACE FUNCTION public.get_analytics_summary(
  p_tenant_id uuid,
  p_date_from date DEFAULT ((CURRENT_DATE - '30 days'::interval))::date,
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
DECLARE
  v_total_sessions bigint;
  v_unique_visitors bigint;
  v_total_page_views bigint;
  v_avg_session_duration numeric;
  v_bounce_rate numeric;
  v_conversion_rate numeric;
  v_total_orders bigint;
  v_total_revenue numeric;
  v_successful_payments bigint;
  v_failed_payments bigint;
  v_avg_load_time numeric;
  v_converted_sessions bigint;
BEGIN
  -- Sessions
  SELECT
    COUNT(DISTINCT s.session_id),
    COUNT(DISTINCT s.visitor_id),
    COALESCE(AVG(s.duration_seconds), 0)
  INTO v_total_sessions, v_unique_visitors, v_avg_session_duration
  FROM store_sessions s
  WHERE s.tenant_id = p_tenant_id
    AND s.started_at::date BETWEEN p_date_from AND p_date_to;

  -- Bounce rate (% of sessions marked bounce)
  SELECT
    CASE WHEN v_total_sessions > 0
      THEN (COUNT(*) FILTER (WHERE s.is_bounce = true)::numeric / v_total_sessions::numeric) * 100
      ELSE 0
    END
  INTO v_bounce_rate
  FROM store_sessions s
  WHERE s.tenant_id = p_tenant_id
    AND s.started_at::date BETWEEN p_date_from AND p_date_to;

  -- Page views
  SELECT COUNT(*)
  INTO v_total_page_views
  FROM store_page_views pv
  WHERE pv.tenant_id = p_tenant_id
    AND pv.viewed_at::date BETWEEN p_date_from AND p_date_to;

  -- Avg load time (ms)
  SELECT COALESCE(AVG(pv.load_time_ms), 0)
  INTO v_avg_load_time
  FROM store_page_views pv
  WHERE pv.tenant_id = p_tenant_id
    AND pv.viewed_at::date BETWEEN p_date_from AND p_date_to;

  -- Conversion rate (sessions that completed purchase)
  SELECT COUNT(DISTINCT e.session_id)
  INTO v_converted_sessions
  FROM store_events e
  WHERE e.tenant_id = p_tenant_id
    AND e.created_at::date BETWEEN p_date_from AND p_date_to
    AND e.event_type = 'purchase_complete';

  v_conversion_rate := CASE WHEN v_total_sessions > 0
    THEN (v_converted_sessions::numeric / v_total_sessions::numeric) * 100
    ELSE 0
  END;

  -- Orders / revenue
  SELECT
    COUNT(*),
    COALESCE(SUM(o.total) FILTER (WHERE o.payment_status = 'paid'), 0),
    COUNT(*) FILTER (WHERE o.payment_status = 'paid'),
    COUNT(*) FILTER (WHERE o.payment_status = 'failed')
  INTO v_total_orders, v_total_revenue, v_successful_payments, v_failed_payments
  FROM orders o
  WHERE o.tenant_id = p_tenant_id
    AND o.created_at::date BETWEEN p_date_from AND p_date_to;

  RETURN QUERY
  SELECT
    COALESCE(v_total_sessions, 0)::bigint,
    COALESCE(v_unique_visitors, 0)::bigint,
    COALESCE(v_total_page_views, 0)::bigint,
    COALESCE(v_avg_session_duration, 0)::numeric,
    COALESCE(v_bounce_rate, 0)::numeric,
    COALESCE(v_conversion_rate, 0)::numeric,
    COALESCE(v_total_orders, 0)::bigint,
    COALESCE(v_total_revenue, 0)::numeric,
    COALESCE(v_successful_payments, 0)::bigint,
    COALESCE(v_failed_payments, 0)::bigint,
    COALESCE(v_avg_load_time, 0)::numeric;
END;
$$;

-- Daily timeseries for charts (sessions, page views, orders, revenue, visitors)
CREATE OR REPLACE FUNCTION public.get_analytics_daily(
  p_tenant_id uuid,
  p_date_from date,
  p_date_to date
)
RETURNS TABLE(
  date date,
  total_sessions bigint,
  unique_visitors bigint,
  page_views bigint,
  total_orders bigint,
  total_revenue numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH days AS (
    SELECT generate_series(p_date_from, p_date_to, interval '1 day')::date AS date
  ),
  s AS (
    SELECT
      started_at::date AS date,
      COUNT(DISTINCT session_id) AS total_sessions,
      COUNT(DISTINCT visitor_id) AS unique_visitors
    FROM store_sessions
    WHERE tenant_id = p_tenant_id
      AND started_at::date BETWEEN p_date_from AND p_date_to
    GROUP BY 1
  ),
  pv AS (
    SELECT
      viewed_at::date AS date,
      COUNT(*) AS page_views
    FROM store_page_views
    WHERE tenant_id = p_tenant_id
      AND viewed_at::date BETWEEN p_date_from AND p_date_to
    GROUP BY 1
  ),
  o AS (
    SELECT
      created_at::date AS date,
      COUNT(*) AS total_orders,
      COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid'), 0) AS total_revenue
    FROM orders
    WHERE tenant_id = p_tenant_id
      AND created_at::date BETWEEN p_date_from AND p_date_to
    GROUP BY 1
  )
  SELECT
    d.date,
    COALESCE(s.total_sessions, 0)::bigint,
    COALESCE(s.unique_visitors, 0)::bigint,
    COALESCE(pv.page_views, 0)::bigint,
    COALESCE(o.total_orders, 0)::bigint,
    COALESCE(o.total_revenue, 0)::numeric
  FROM days d
  LEFT JOIN s ON s.date = d.date
  LEFT JOIN pv ON pv.date = d.date
  LEFT JOIN o ON o.date = d.date
  ORDER BY d.date ASC;
$$;

-- Helpful indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_store_sessions_tenant_started_at ON public.store_sessions (tenant_id, started_at);
CREATE INDEX IF NOT EXISTS idx_store_page_views_tenant_viewed_at ON public.store_page_views (tenant_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_store_events_tenant_created_at_type ON public.store_events (tenant_id, created_at, event_type);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_created_at ON public.orders (tenant_id, created_at);
