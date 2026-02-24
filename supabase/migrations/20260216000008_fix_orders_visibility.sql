-- Fix Orders Visibility for Customers
-- The previous "Nuclear Fix" assumed orders.customer_id = auth.uid().
-- However, the Store App uses a separate `customers` table where customers.user_id = auth.uid().
-- Orders are linked to customers.id, NOT auth.uid().
-- This migration updates the RLS policy to correctly bridge this relationship.

DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;

CREATE POLICY "Customers can view their own orders" ON public.orders
    FOR SELECT TO authenticated
    USING (
        -- Check if the order belongs to a customer profile owned by the current user
        customer_id IN (
            SELECT id FROM public.customers WHERE user_id = auth.uid()
        )
        OR 
        -- Fallback: Check if order is directly linked to auth.uid() (legacy/admin created?)
        customer_id = auth.uid()
    );

-- Ensure we have an index on customers(user_id) for performance of this RLS check
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
