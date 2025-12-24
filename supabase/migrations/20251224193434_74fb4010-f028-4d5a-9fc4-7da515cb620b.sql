-- Create enum for delivery boy payment types
CREATE TYPE public.delivery_payment_type AS ENUM ('monthly_salary', 'fixed_per_order', 'percentage_per_order');

-- Create enum for delivery order status
CREATE TYPE public.delivery_status AS ENUM ('unassigned', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'failed', 'returned');

-- Create enum for payout status
CREATE TYPE public.payout_status AS ENUM ('pending', 'approved', 'paid', 'rejected');

-- Delivery Boys table
CREATE TABLE public.delivery_boys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  payment_type delivery_payment_type NOT NULL DEFAULT 'fixed_per_order',
  monthly_salary NUMERIC DEFAULT 0,
  per_order_amount NUMERIC DEFAULT 0,
  percentage_value NUMERIC DEFAULT 0,
  account_holder_name TEXT,
  account_number TEXT,
  upi_id TEXT,
  ifsc_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  wallet_balance NUMERIC NOT NULL DEFAULT 0,
  total_earned NUMERIC NOT NULL DEFAULT 0,
  total_paid NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, mobile_number)
);

-- Delivery Areas table
CREATE TABLE public.delivery_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pincodes TEXT[] NOT NULL DEFAULT '{}',
  localities TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Junction table for delivery boy area assignments
CREATE TABLE public.delivery_boy_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  delivery_boy_id UUID NOT NULL REFERENCES public.delivery_boys(id) ON DELETE CASCADE,
  delivery_area_id UUID NOT NULL REFERENCES public.delivery_areas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(delivery_boy_id, delivery_area_id)
);

-- Delivery Assignments table (links orders to delivery boys)
CREATE TABLE public.delivery_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  delivery_boy_id UUID REFERENCES public.delivery_boys(id) ON DELETE SET NULL,
  delivery_area_id UUID REFERENCES public.delivery_areas(id) ON DELETE SET NULL,
  status delivery_status NOT NULL DEFAULT 'unassigned',
  assigned_at TIMESTAMP WITH TIME ZONE,
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  cod_collected NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);

-- Delivery Status Logs table
CREATE TABLE public.delivery_status_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.delivery_assignments(id) ON DELETE CASCADE,
  delivery_boy_id UUID REFERENCES public.delivery_boys(id) ON DELETE SET NULL,
  old_status delivery_status,
  new_status delivery_status NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Delivery Earnings table
CREATE TABLE public.delivery_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  delivery_boy_id UUID NOT NULL REFERENCES public.delivery_boys(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.delivery_assignments(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  earning_type delivery_payment_type NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Delivery Payout Requests table
CREATE TABLE public.delivery_payout_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  delivery_boy_id UUID NOT NULL REFERENCES public.delivery_boys(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status payout_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Delivery Payouts table (actual payouts made)
CREATE TABLE public.delivery_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  delivery_boy_id UUID NOT NULL REFERENCES public.delivery_boys(id) ON DELETE CASCADE,
  payout_request_id UUID REFERENCES public.delivery_payout_requests(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  transaction_reference TEXT,
  notes TEXT,
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.delivery_boys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_boy_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_payouts ENABLE ROW LEVEL SECURITY;

-- Security definer function to get delivery boy tenant
CREATE OR REPLACE FUNCTION public.get_delivery_boy_tenant_id(delivery_boy_uuid UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.delivery_boys WHERE id = delivery_boy_uuid
$$;

-- RLS Policies for delivery_boys
CREATE POLICY "Owners can manage delivery boys"
ON public.delivery_boys FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- RLS Policies for delivery_areas  
CREATE POLICY "Owners can manage delivery areas"
ON public.delivery_areas FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- RLS Policies for delivery_boy_areas
CREATE POLICY "Owners can manage delivery boy areas"
ON public.delivery_boy_areas FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- RLS Policies for delivery_assignments
CREATE POLICY "Owners can manage delivery assignments"
ON public.delivery_assignments FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Public can view assignments by tenant"
ON public.delivery_assignments FOR SELECT
USING (true);

CREATE POLICY "Public can update assignments"
ON public.delivery_assignments FOR UPDATE
USING (true);

-- RLS Policies for delivery_status_logs
CREATE POLICY "Owners can manage status logs"
ON public.delivery_status_logs FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Public can insert status logs"
ON public.delivery_status_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can view status logs"
ON public.delivery_status_logs FOR SELECT
USING (true);

-- RLS Policies for delivery_earnings
CREATE POLICY "Owners can manage earnings"
ON public.delivery_earnings FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Public can view earnings"
ON public.delivery_earnings FOR SELECT
USING (true);

CREATE POLICY "Public can insert earnings"
ON public.delivery_earnings FOR INSERT
WITH CHECK (true);

-- RLS Policies for delivery_payout_requests
CREATE POLICY "Owners can manage payout requests"
ON public.delivery_payout_requests FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Public can view payout requests"
ON public.delivery_payout_requests FOR SELECT
USING (true);

CREATE POLICY "Public can insert payout requests"
ON public.delivery_payout_requests FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update payout requests"
ON public.delivery_payout_requests FOR UPDATE
USING (true);

-- RLS Policies for delivery_payouts
CREATE POLICY "Owners can manage payouts"
ON public.delivery_payouts FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Public can view payouts"
ON public.delivery_payouts FOR SELECT
USING (true);

-- Indexes for performance
CREATE INDEX idx_delivery_boys_tenant ON public.delivery_boys(tenant_id);
CREATE INDEX idx_delivery_boys_mobile ON public.delivery_boys(tenant_id, mobile_number);
CREATE INDEX idx_delivery_areas_tenant ON public.delivery_areas(tenant_id);
CREATE INDEX idx_delivery_boy_areas_boy ON public.delivery_boy_areas(delivery_boy_id);
CREATE INDEX idx_delivery_boy_areas_area ON public.delivery_boy_areas(delivery_area_id);
CREATE INDEX idx_delivery_assignments_order ON public.delivery_assignments(order_id);
CREATE INDEX idx_delivery_assignments_boy ON public.delivery_assignments(delivery_boy_id);
CREATE INDEX idx_delivery_assignments_status ON public.delivery_assignments(tenant_id, status);
CREATE INDEX idx_delivery_earnings_boy ON public.delivery_earnings(delivery_boy_id);
CREATE INDEX idx_delivery_payout_requests_boy ON public.delivery_payout_requests(delivery_boy_id);
CREATE INDEX idx_delivery_payout_requests_status ON public.delivery_payout_requests(tenant_id, status);

-- Trigger for updated_at on delivery_boys
CREATE TRIGGER update_delivery_boys_updated_at
BEFORE UPDATE ON public.delivery_boys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on delivery_assignments
CREATE TRIGGER update_delivery_assignments_updated_at
BEFORE UPDATE ON public.delivery_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();