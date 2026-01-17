-- Fix: Customer Email Addresses and Phone Numbers Could Be Stolen
-- Fix: Customer Home Addresses Could Be Publicly Accessible

-- First, drop any existing permissive policies on customers table
DROP POLICY IF EXISTS "Public can view customers" ON public.customers;
DROP POLICY IF EXISTS "Anyone can view customers" ON public.customers;

-- Create proper RLS policies for customers table
-- Tenant owners can manage all their customers
CREATE POLICY "Tenant owners can manage customers"
ON public.customers
FOR ALL
TO authenticated
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- Authenticated customers can view only their own data
CREATE POLICY "Customers can view own data"
ON public.customers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Authenticated customers can update only their own data
CREATE POLICY "Customers can update own data"
ON public.customers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Drop any existing permissive policies on customer_addresses table
DROP POLICY IF EXISTS "Public can view customer addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Anyone can view customer addresses" ON public.customer_addresses;

-- Create proper RLS policies for customer_addresses table
-- Tenant owners can manage all addresses in their tenant
CREATE POLICY "Tenant owners can manage customer addresses"
ON public.customer_addresses
FOR ALL
TO authenticated
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- Customers can view only their own addresses
CREATE POLICY "Customers can view own addresses"
ON public.customer_addresses
FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM public.customers 
    WHERE user_id = auth.uid()
  )
);

-- Customers can manage their own addresses (insert, update, delete)
CREATE POLICY "Customers can manage own addresses"
ON public.customer_addresses
FOR ALL
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM public.customers 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  customer_id IN (
    SELECT id FROM public.customers 
    WHERE user_id = auth.uid()
  )
);