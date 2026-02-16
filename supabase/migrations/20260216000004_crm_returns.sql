-- Create customer_notes table
CREATE TABLE IF NOT EXISTS public.customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_id UUID NULL,
    note TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

-- Policies for customer_notes
DROP POLICY IF EXISTS "Admins can view all notes" ON public.customer_notes;
CREATE POLICY "Admins can view all notes" ON public.customer_notes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'super_admin')
            AND profiles.tenant_id = customer_notes.tenant_id
        ) OR 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    );

DROP POLICY IF EXISTS "Admins can insert notes" ON public.customer_notes;
CREATE POLICY "Admins can insert notes" ON public.customer_notes
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admins can update notes" ON public.customer_notes;
CREATE POLICY "Admins can update notes" ON public.customer_notes
    FOR UPDATE TO authenticated
    USING (
         EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Admins can delete notes" ON public.customer_notes;
CREATE POLICY "Admins can delete notes" ON public.customer_notes
    FOR DELETE TO authenticated
    USING (
         EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'super_admin')
        )
    );


-- Create Return Status Enum
DO $$ BEGIN
    CREATE TYPE public.return_status AS ENUM ('requested', 'approved', 'rejected', 'refunded', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create return_requests table
CREATE TABLE IF NOT EXISTS public.return_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status public.return_status DEFAULT 'requested',
    reason TEXT NOT NULL,
    refund_method TEXT CHECK (refund_method IN ('upi', 'bank_transfer')),
    payment_details JSONB,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;

-- Policies for return_requests

DROP POLICY IF EXISTS "Customers can view their own return requests" ON public.return_requests;
CREATE POLICY "Customers can view their own return requests" ON public.return_requests
    FOR SELECT TO authenticated
    USING (
        customer_id = auth.uid()
    );

DROP POLICY IF EXISTS "Customers can create return requests" ON public.return_requests;
CREATE POLICY "Customers can create return requests" ON public.return_requests
    FOR INSERT TO authenticated
    WITH CHECK (
        customer_id = auth.uid()
    );

DROP POLICY IF EXISTS "Admins can view all return requests" ON public.return_requests;
CREATE POLICY "Admins can view all return requests" ON public.return_requests
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'super_admin')
            AND profiles.tenant_id = return_requests.tenant_id
        ) OR
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    );

DROP POLICY IF EXISTS "Admins can update return requests" ON public.return_requests;
CREATE POLICY "Admins can update return requests" ON public.return_requests
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('owner', 'super_admin')
            AND profiles.tenant_id = return_requests.tenant_id
        ) OR
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    );
