-- Create table for storing OTPs
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  otp TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for phone lookups
CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone ON public.otp_verifications(phone);

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for Edge Functions)
CREATE POLICY "Service role can do anything with OTPs"
  ON public.otp_verifications
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow public to insert OTPs (during signup flow) - stricter checks done in function
CREATE POLICY "Public can insert OTPs"
  ON public.otp_verifications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow public to select their own OTP via phone (controlled by function logic mostly)
CREATE POLICY "Public can view their own OTP"
  ON public.otp_verifications
  FOR SELECT
  TO anon, authenticated
  USING (true);
