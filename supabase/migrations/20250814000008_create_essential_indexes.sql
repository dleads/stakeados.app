-- Create essential database indexes for performance optimization
-- This migration creates indexes on foreign keys, frequently queried columns,
-- and composite indexes for optimal query performance

-- Drop existing indexes if they exist (for idempotency)
DROP INDEX IF EXISTS idx_profiles_username;
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_profiles_wallet_address;
DROP INDEX IF EXISTS idx_profiles_genesis_nft_verified;

DROP INDEX IF EXISTS idx_categories_slug;
DROP INDEX IF EXISTS idx_categories_parent_id;
DROP INDEX IF EXISTS idx_categories_sort_order;

DROP INDEX IF EXISTS idx_articles_author_id;
DROP INDEX IF EXISTS idx_articles_category_id;
DROP INDEX IF EXISTS idx_articles_status;
DROP INDEX IF EXISTS idx_articles_slug;
DROP INDEX IF EXISTS idx_articles_published_at;
DROP INDEX IF EXISTS idx_articles_language;
DROP INDEX IF EXISTS idx_articles_status_published_at;
DROP INDEX IF EXISTS idx_articles_category_status;

DROP INDEX IF EXISTS idx_news_category_id;
DROP INDEX IF EXISTS idx_news_published_at;
DROP INDEX IF EXISTS idx_news_language;
DROP INDEX IF EXISTS idx_news_processed;
DROP INDEX IF EXISTS idx_news_trending_score;
DROP INDEX IF EXISTS idx_news_category_published;

DROP INDEX IF EXISTS idx_role_audit_log_user_id;
DROP INDEX IF EXISTS idx_role_audit_log_changed_by;
DROP INDEX IF EXISTS idx_role_audit_log_created_at;
DROP INDEX IF EXISTS idx_role_audit_log_user_created;

-- Profiles table indexes
-- Frequently queried columns based on actual schema
CREATE INDEX idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;
CREATE INDEX idx_profiles_role ON profiles(role) WHERE role IS NOT NULL;
CREATE INDEX idx_profiles_wallet_address ON profiles(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_profiles_genesis_nft_verified ON profiles(genesis_nft_verified) WHERE genesis_nft_verified = true;

-- Categories table indexes
-- Slug for URL lookups and parent_id for hierarchy queries
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

-- Articles table indexes
-- Foreign keys for joins
CREATE INDEX idx_articles_author_id ON articles(author_id);
CREATE INDEX idx_articles_category_id ON articles(category_id);

-- Frequently queried columns
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_published_at ON articles(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX idx_articles_language ON articles(language);

-- Composite indexes for common query patterns
-- Articles by status and published date (for listing published articles chronologically)
CREATE INDEX idx_articles_status_published_at ON articles(status, published_at DESC) WHERE status = 'published';

-- Articles by category and status (for category-specific listings)
CREATE INDEX idx_articles_category_status ON articles(category_id, status, published_at DESC);

-- News table indexes
-- Foreign key for category joins
CREATE INDEX idx_news_category_id ON news(category_id);

-- Frequently queried columns
CREATE INDEX idx_news_published_at ON news(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX idx_news_language ON news(language);
CREATE INDEX idx_news_processed ON news(processed);
CREATE INDEX idx_news_trending_score ON news(trending_score DESC) WHERE trending_score > 0;

-- Composite index for news listing by category and date
CREATE INDEX idx_news_category_published ON news(category_id, published_at DESC) WHERE published_at IS NOT NULL;

-- Role audit log table indexes
-- Foreign keys for user tracking
CREATE INDEX idx_role_audit_log_user_id ON role_audit_log(user_id);
CREATE INDEX idx_role_audit_log_changed_by ON role_audit_log(changed_by);

-- Timestamp for audit queries
CREATE INDEX idx_role_audit_log_created_at ON role_audit_log(created_at DESC);

-- Composite index for user audit history
CREATE INDEX idx_role_audit_log_user_created ON role_audit_log(user_id, created_at DESC);

-- Performance optimization indexes for RLS policies
-- These indexes help with the role-based security checks

-- Index for admin role checks (used frequently in RLS policies)
CREATE INDEX idx_profiles_admin_role ON profiles(id) WHERE role = 'admin';

-- Index for published content queries (used in public access policies)
CREATE INDEX idx_articles_public_access ON articles(id, status, published_at) WHERE status = 'published';

-- Verification queries to confirm indexes were created
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    -- Count all indexes created by this migration
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%';
    
    -- Log the result
    RAISE NOTICE 'Created % indexes for performance optimization', index_count;
    
    -- Verify specific critical indexes exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_email') THEN
        RAISE EXCEPTION 'Critical index idx_profiles_email was not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_articles_status_published_at') THEN
        RAISE EXCEPTION 'Critical composite index idx_articles_status_published_at was not created';
    END IF;
    
    RAISE NOTICE 'All critical indexes verified successfully';
END $$;