-- Add user_id to customers table for Supabase Auth integration
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS password_hash text;

-- Add unique constraint for phone per tenant
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_phone_tenant_unique;
ALTER TABLE public.customers ADD CONSTRAINT customers_phone_tenant_unique UNIQUE (tenant_id, phone);

-- Create customer_addresses table
CREATE TABLE public.customer_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Home',
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on customer_addresses
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- RLS for customer_addresses: customers can only access their own addresses
CREATE POLICY "Customers can view their own addresses"
ON public.customer_addresses
FOR SELECT
USING (
  customer_id IN (
    SELECT id FROM public.customers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Customers can create their own addresses"
ON public.customer_addresses
FOR INSERT
WITH CHECK (
  customer_id IN (
    SELECT id FROM public.customers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Customers can update their own addresses"
ON public.customer_addresses
FOR UPDATE
USING (
  customer_id IN (
    SELECT id FROM public.customers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Customers can delete their own addresses"
ON public.customer_addresses
FOR DELETE
USING (
  customer_id IN (
    SELECT id FROM public.customers WHERE user_id = auth.uid()
  )
);

-- Owners can manage addresses for their tenant
CREATE POLICY "Owners can manage customer addresses"
ON public.customer_addresses
FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- Add customer_id to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

-- Update orders RLS to allow customers to view their own orders
CREATE POLICY "Customers can view their own orders"
ON public.orders
FOR SELECT
USING (
  customer_id IN (
    SELECT id FROM public.customers WHERE user_id = auth.uid()
  )
);

-- Update customers RLS to allow customers to view/update their own profile
DROP POLICY IF EXISTS "Owners can manage their customers" ON public.customers;

CREATE POLICY "Owners can manage their customers"
ON public.customers
FOR ALL
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Customers can view their own profile"
ON public.customers
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Customers can update their own profile"
ON public.customers
FOR UPDATE
USING (user_id = auth.uid());

-- Allow public to create customers during signup
CREATE POLICY "Public can create customers"
ON public.customers
FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_phone ON public.customers(tenant_id, phone);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON public.customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);