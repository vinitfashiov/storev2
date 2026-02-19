-- Fix trigger function security
-- The function create_order_partition_for_tenant needs to run with SECURITY DEFINER
-- because it performs DDL (CREATE TABLE) which normal users don't have permissions for.

CREATE OR REPLACE FUNCTION public.create_order_partition_for_tenant()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    partition_name text;
BEGIN
    partition_name := 'orders_' || replace(NEW.id::text, '-', '_');
    
    -- Check if partition exists to avoid errors? 
    -- Actually 'IF NOT EXISTS' in CREATE TABLE handles it
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF orders_partitioned FOR VALUES IN (%L)', partition_name, NEW.id);
    
    -- Also enable RLS on the new partition (Inherited automatically, but good to be sure)
    -- ALTER TABLE ... ENABLE ROW LEVEL SECURITY; (Inherited)
    
    RETURN NEW;
END;
$function$;

-- Ensure proper owner (usually postgres)
ALTER FUNCTION public.create_order_partition_for_tenant() OWNER TO postgres;

-- Grant execution to authenticated users (so they can trigger it via INSERT)
GRANT EXECUTE ON FUNCTION public.create_order_partition_for_tenant() TO authenticated, service_role;
