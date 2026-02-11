-- PERFORMANCE INDEXES FOR STOCK UPDATES

CREATE INDEX IF NOT EXISTS idx_products_stock_check 
ON public.products(id, stock_qty, is_active) 
WHERE stock_qty > 0 AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_product_variants_stock_check 
ON public.product_variants(id, stock_qty, is_active) 
WHERE stock_qty > 0 AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_orders_number_tenant 
ON public.orders(tenant_id, order_number);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_order 
ON public.inventory_movements(reference_type, reference_id, created_at DESC) 
WHERE reference_type = 'order';

CREATE INDEX IF NOT EXISTS idx_carts_id_status 
ON public.carts(id, status) 
WHERE status = 'active';
