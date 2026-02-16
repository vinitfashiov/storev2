-- Stock Audits Table
CREATE TABLE IF NOT EXISTS public.stock_audits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id text NOT NULL REFERENCES public.tenants(id),
    status text NOT NULL CHECK (status IN ('draft', 'completed', 'cancelled')),
    notes text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    completed_at timestamptz
);

-- Stock Audit Items Table
CREATE TABLE IF NOT EXISTS public.stock_audit_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_id uuid REFERENCES public.stock_audits(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id),
    variant_id uuid REFERENCES public.product_variants(id),
    expected_qty integer NOT NULL,
    counted_qty integer, -- Null means not yet counted
    cost_price numeric DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Add enhancements to Purchase Orders
ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS received_notes text,
ADD COLUMN IF NOT EXISTS expected_delivery_date date;

-- Add enhancements to Inventory Movements
-- To link movements to specific audits
ALTER TABLE public.inventory_movements
ADD COLUMN IF NOT EXISTS reference_id text; 
-- (Note: reference_id is already essentially supported by loose typing or existing columns, 
-- but ensuring we use it consistently for audit_id or po_id)

-- RLS Policies

-- Stock Audits
ALTER TABLE public.stock_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenant stock audits" ON public.stock_audits;
CREATE POLICY "Users can view their tenant stock audits"
ON public.stock_audits FOR SELECT
USING (tenant_id = public.get_user_tenant_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "Users can create their tenant stock audits" ON public.stock_audits;
CREATE POLICY "Users can create their tenant stock audits"
ON public.stock_audits FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "Users can update their tenant stock audits" ON public.stock_audits;
CREATE POLICY "Users can update their tenant stock audits"
ON public.stock_audits FOR UPDATE
USING (tenant_id = public.get_user_tenant_id() OR public.is_super_admin());

-- Stock Audit Items
ALTER TABLE public.stock_audit_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenant audit items" ON public.stock_audit_items;
CREATE POLICY "Users can view their tenant audit items"
ON public.stock_audit_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.stock_audits
        WHERE stock_audits.id = stock_audit_items.audit_id
        AND (stock_audits.tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
    )
);

DROP POLICY IF EXISTS "Users can manage their tenant audit items" ON public.stock_audit_items;
CREATE POLICY "Users can manage their tenant audit items"
ON public.stock_audit_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.stock_audits
        WHERE stock_audits.id = stock_audit_items.audit_id
        AND (stock_audits.tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
    )
);
