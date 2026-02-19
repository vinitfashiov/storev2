-- Restore permissions on public schema
-- This fixes "permission denied for schema public" errors

-- 1. Grant USAGE on public schema to all roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Grant ALL on public schema to postgres and service_role (owners)
GRANT ALL ON SCHEMA public TO postgres, service_role;

-- 3. Grant ALL on all tables, routines, and sequences to postgres and service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;

-- 4. Ensure future tables get these permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;

-- 5. Note for anon/authenticated:
-- We primarily need USAGE on the schema.
-- Table-level access is controlled via RLS (Row Level Security) and specific GRANTs.
-- By default in Supabase, they might need permissions on specific tables, but USAGE is the prerequisite.
