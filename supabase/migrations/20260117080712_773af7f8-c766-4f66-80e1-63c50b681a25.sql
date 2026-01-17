-- Allow authenticated users to insert their own customer record during signup
CREATE POLICY "Users can insert their own customer record"
ON public.customers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Also allow users to read their own customer records
CREATE POLICY "Users can view their own customer record"
ON public.customers
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to update their own customer record
CREATE POLICY "Users can update their own customer record"
ON public.customers
FOR UPDATE
USING (auth.uid() = user_id);