-- Function: Get dashboard analytics (cached-friendly)
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
  p_tenant_id UUID,
  p_date_from DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_date_to DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_orders BIGINT,
  total_revenue NUMERIC,
  avg_order_value NUMERIC,
  pending_orders BIGINT,
  total_customers BIGINT,
  total_products BIGINT,
  low_stock_products BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM orders WHERE tenant_id = p_tenant_id AND created_at::DATE BETWEEN p_date_from AND p_date_to) as total_orders,
    (SELECT COALESCE(SUM(total), 0) FROM orders WHERE tenant_id = p_tenant_id AND created_at::DATE BETWEEN p_date_from AND p_date_to AND payment_status = 'paid') as total_revenue,
    (SELECT COALESCE(AVG(total), 0) FROM orders WHERE tenant_id = p_tenant_id AND created_at::DATE BETWEEN p_date_from AND p_date_to) as avg_order_value,
    (SELECT COUNT(*) FROM orders WHERE tenant_id = p_tenant_id AND status = 'pending') as pending_orders,
    (SELECT COUNT(*) FROM customers WHERE tenant_id = p_tenant_id) as total_customers,
    (SELECT COUNT(*) FROM products WHERE tenant_id = p_tenant_id) as total_products,
    (SELECT COUNT(*) FROM products WHERE tenant_id = p_tenant_id AND is_active = true AND stock_qty <= COALESCE(low_stock_threshold, 10)) as low_stock_products;
END;
$$;
