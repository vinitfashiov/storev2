-- ============================================
-- Setup cron job for log cleanup
-- ============================================

-- Note: pg_cron extension needs to be enabled in Supabase dashboard
-- If pg_cron is not available, this migration will fail gracefully

-- Try to enable pg_cron extension (might already be enabled)
DO $$
BEGIN
  -- Only enable if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- If pg_cron is not available, log warning but continue
  RAISE WARNING 'pg_cron extension not available. Cron job will not be scheduled.';
END $$;

-- Schedule cleanup job to run daily at 3 AM
-- This will delete logs older than 30 days and metrics older than 7 days
DO $block$
BEGIN
  -- Check if job already exists
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'cleanup-old-logs'
  ) THEN
    -- Unschedule existing job first
    PERFORM cron.unschedule('cleanup-old-logs');
  END IF;
  
  -- Schedule the job
  PERFORM cron.schedule(
    'cleanup-old-logs',
    '0 3 * * *',  -- Run daily at 3:00 AM (UTC)
    $$SELECT cleanup_old_logs()$$
  );
  
  RAISE NOTICE 'Cron job "cleanup-old-logs" scheduled successfully';
EXCEPTION WHEN OTHERS THEN
  -- If cron scheduling fails, log warning but don't fail migration
  RAISE WARNING 'Failed to schedule cron job: %. You can schedule it manually using: SELECT cron.schedule(''cleanup-old-logs'', ''0 3 * * *'', $$SELECT cleanup_old_logs()$$);', SQLERRM;
END $block$;

-- Add comment to function
COMMENT ON FUNCTION cleanup_old_logs() IS 'Cleanup function scheduled to run daily at 3 AM UTC via pg_cron. Deletes logs older than 30 days and metrics older than 7 days.';
