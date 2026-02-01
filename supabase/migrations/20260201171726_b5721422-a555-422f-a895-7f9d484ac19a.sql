-- Add callback_handled column to payment_intents table
ALTER TABLE payment_intents 
ADD COLUMN IF NOT EXISTS callback_handled BOOLEAN DEFAULT FALSE;