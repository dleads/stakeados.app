-- Purge script to fully clean the database before setup
-- This script removes tables, functions, and types that might conflict.

BEGIN;

-- Drop all tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS public.role_audit_log CASCADE;
DROP TABLE IF EXISTS public.news CASCADE;
DROP TABLE IF EXISTS public.articles CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop legacy tables just in case they exist from old setups
DROP TABLE IF EXISTS public.content_categories CASCADE;
DROP TABLE IF EXISTS public.news_articles CASCADE;
DROP TABLE IF EXISTS public.article_categories CASCADE;
DROP TABLE IF EXISTS public.news_categories CASCADE;
DROP TABLE IF EXISTS public.content_interactions CASCADE;
DROP TABLE IF EXISTS public.content_tags CASCADE;
DROP TABLE IF EXISTS public.news_sources CASCADE;
DROP TABLE IF EXISTS public.news_source_categories CASCADE;
DROP TABLE IF EXISTS public.role_permissions_cache CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS public.has_role_or_higher(user_id UUID, required_role TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_role_permissions(user_id UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_role(target_user_id UUID, new_role TEXT, reason TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Drop legacy functions
DROP FUNCTION IF EXISTS public.get_category_stats() CASCADE;
DROP FUNCTION IF EXISTS public.update_user_role(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.audit_role_change(uuid, text, text, text) CASCADE;

-- Drop custom types if they exist
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.article_status;
DROP TYPE IF EXISTS public.language_code;

COMMIT;
