-- System Hardening Check & Rate Limiter Atomic Check
-- Prevent concurrent rate-limit checks from bypassing JS waits via Postgres locking.

CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_key text,
    p_limit integer,
    p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_window_start timestamp with time zone;
    v_current_count integer;
    v_last_request timestamp with time zone;
BEGIN
    v_window_start := now() - (p_window_seconds || ' seconds')::interval;

    -- Upsert the rate limit record atomically
    INSERT INTO public.rate_limits (key, count, last_request)
    VALUES (p_key, 1, now())
    ON CONFLICT (key) DO UPDATE
    SET 
        count = CASE 
            WHEN public.rate_limits.last_request < v_window_start THEN 1 
            ELSE public.rate_limits.count + 1 
        END,
        last_request = now()
    RETURNING count, last_request INTO v_current_count, v_last_request;

    -- If the resulting count is greater than the limit, decline.
    IF v_current_count > p_limit THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$$;
