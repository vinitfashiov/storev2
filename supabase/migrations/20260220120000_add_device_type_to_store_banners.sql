
-- Add device_type column to store_banners table
ALTER TABLE store_banners 
ADD COLUMN IF NOT EXISTS device_type text NOT NULL DEFAULT 'all' 
CHECK (device_type IN ('desktop', 'mobile', 'all'));
