-- Step 1: Add super_admin role to user_role enum
-- This must be done first and committed before using the value
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Note: After running this, you need to run the next migration file
-- or wait a moment and run the rest of the commands separately
