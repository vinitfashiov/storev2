-- Create table to store OTPs for verification
CREATE TABLE public.otp_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(10) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX idx_otp_verifications_phone ON public.otp_verifications(phone);
CREATE INDEX idx_otp_verifications_expires ON public.otp_verifications(expires_at);

-- Enable RLS but allow service role full access
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- No public access - only service role can access this table
-- This is intentional as OTPs should only be managed by the edge function