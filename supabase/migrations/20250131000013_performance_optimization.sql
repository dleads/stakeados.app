-- Performance optimization migration for content management system
-- This migration adds indexes, optimizes queries, and sets up monitoring

-- ============================================================================
-- INDEXES FOR ARTICLES
-- ============================================================================

-- Composite index for published articles with sorting
CREATE INDEX IF NOT EXISTS idx_articles_published_status_date 
ON articles(status, published_at DESC) 
WHERE status = 'published';

-- Index for article search by category and status
CREATE INDEX IF NOT EXISTS idx_articles_category_status 
ON articles(category) 
WHERE status = 'published';

-- Index for article search by tags
CREATE INDEX IF NOT EXISTS idx_articles_tags 
ON articles USING GIN(tags);

-- Index for article author and status
CREATE INDEX IF NOT EXISTS idx_articles_author_status 
ON articles(author_id, status, published_at DESC);

-- Index for article difficulty and category
CREATE INDEX IF NOT EXISTS idx_articles_difficulty_category 
ON articles(difficulty_level, category) 
WHERE status = 'published';

-- Full-text search indexes for articles
CREATE INDEX IF NOT EXISTS idx_articles_search_en 
ON articles USING GIN(to_tsvector('english', 
  COALESCE(title->>'en', '') || ' ' || 
  COALESCE(content->>'en', '') || ' ' || 
  COALESCE(meta_description->>'en', '')
));

CREATE INDEX IF NOT EXISTS idx_articles_search_es 
ON articles USING GIN(to_tsvector('spanish', 
  COALESCE(title->>'es', '') || ' ' || 
  COALESCE(content->>'es', '') || ' ' || 
  COALESCE(meta_description->>'es', '')
));

-- Index for article view count and engagement
CREATE INDEX IF NOT EXISTS idx_articles_engagement 
ON articles(view_count DESC, like_count DESC, published_at DESC) 
WHERE status = 'published';

-- ============================================================================
-- INDEXES FOR NEWS ARTICLES
-- ============================================================================

-- Index for news articles by publication date
CREATE INDEX IF NOT EXISTS idx_news_articles_published_date 
ON news_articles(published_at DESC);

-- Index for trending news
CREATE INDEX IF NOT EXISTS idx_news_articles_trending 
ON news_articles(trending_score DESC, published_at DESC);

-- Index for news relevance scoring
CREATE INDEX IF NOT EXISTS idx_news_articles_relevance 
ON news_articles(relevance_score DESC, published_at DESC);

-- Index for news source and date
CREATE INDEX IF NOT EXISTS idx_news_articles_source_date 
ON news_articles(source_name, published_at DESC);

-- Index for news categories
CREATE INDEX IF NOT EXISTS idx_news_articles_categories 
ON news_articles USING GIN(categories);

-- Full-text search for news
CREATE INDEX IF NOT EXISTS idx_news_articles_search_en 
ON news_articles USING GIN(to_tsvector('english', 
  COALESCE(title->>'en', '') || ' ' || 
  COALESCE(summary->>'en', '') || ' ' || 
  COALESCE(content->>'en', '')
));

CREATE INDEX IF NOT EXISTS idx_news_articles_search_es 
ON news_articles USING GIN(to_tsvector('spanish', 
  COALESCE(title->>'es', '') || ' ' || 
  COALESCE(summary->>'es', '') || ' ' || 
  COALESCE(content->>'es', '')
));

-- ============================================================================
-- INDEXES FOR CONTENT INTERACTIONS
-- ============================================================================

-- Index for user interactions by content type and date
CREATE INDEX IF NOT EXISTS idx_content_interactions_user_content 
ON content_interactions(user_id, content_type, created_at DESC);

-- Index for content popularity tracking
CREATE INDEX IF NOT EXISTS idx_content_interactions_content_type 
ON content_interactions(content_id, interaction_type, created_at DESC);

-- Index for trending content calculation
CREATE INDEX IF NOT EXISTS idx_content_interactions_trending 
ON content_interactions(content_type, interaction_type, created_at DESC);

-- ============================================================================
-- INDEXES FOR CATEGORIES AND TAGS
-- ============================================================================

-- Index for category hierarchy
CREATE INDEX IF NOT EXISTS idx_content_categories_parent 
ON content_categories(parent_id, display_order) 
WHERE parent_id IS NOT NULL;

-- Index for tag usage count
CREATE INDEX IF NOT EXISTS idx_content_tags_usage 
ON content_tags(usage_count DESC, name);

-- Index for article-category relationships
CREATE INDEX IF NOT EXISTS idx_article_categories_article 
ON article_categories(article_id);

CREATE INDEX IF NOT EXISTS idx_article_categories_category 
ON article_categories(category_id);

-- Index for article-tag relationships
CREATE INDEX IF NOT EXISTS idx_article_tags_article 
ON article_tags(article_id);

CREATE INDEX IF NOT EXISTS idx_article_tags_tag 
ON article_tags(tag_id);

-- ============================================================================
-- INDEXES FOR USER SUBSCRIPTIONS
-- ============================================================================

-- Index for user subscriptions by type
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_type 
ON user_subscriptions(user_id, subscription_type);

-- Index for subscription targets
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_target 
ON user_subscriptions(subscription_type, subscription_target);

-- ============================================================================
-- OPTIMIZED FUNCTIONS FOR CONTENT RETRIEVAL
-- ============================================================================

-- Function to get trending articles
CREATE OR REPLACE FUNCTION get_trending_articles(
  p_limit INTEGER DEFAULT 10,
  p_days INTEGER DEFAULT 7,
  p_locale TEXT DEFAULT 'en'
)
RETURNS TABLE (
  id UUID,
  title JSONB,
  summary JSONB,
  slug TEXT,
  featured_image_url TEXT,
  author_name TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER,
  like_count INTEGER,
  engagement_score DECIMAL
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.summary,
    a.slug,
    a.featured_image_url,
    p.name as author_name,
    a.published_at,
    a.view_count,
    a.like_count,
    (
      COALESCE(a.view_count, 0) * 1.0 + 
      COALESCE(a.like_count, 0) * 5.0 +
      COALESCE(interaction_counts.recent_interactions, 0) * 3.0
    ) / EXTRACT(EPOCH FROM (NOW() - a.published_at)) * 86400 as engagement_score
  FROM articles a
  JOIN profiles p ON a.author_id = p.id
  LEFT JOIN (
    SELECT 
      content_id,
      COUNT(*) as recent_interactions
    FROM content_interactions 
    WHERE content_type = 'article' 
      AND created_at > NOW() - INTERVAL '1 day' * p_days
    GROUP BY content_id
  ) interaction_counts ON a.id = interaction_counts.content_id
  WHERE a.status = 'published'
    AND a.published_at > NOW() - INTERVAL '1 day' * p_days
  ORDER BY engagement_score DESC
  LIMIT p_limit;
END;
$$;

-- Function to get personalized news feed
CREATE OR REPLACE FUNCTION get_personalized_news_feed(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title JSONB,
  summary JSONB,
  image_url TEXT,
  source_name TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  relevance_score DECIMAL,
  categories TEXT[]
) 
LANGUAGE plpgsql
AS $$
DECLARE
  user_interests TEXT[];
BEGIN
  -- Get user interests from subscriptions
  SELECT ARRAY_AGG(subscription_target) INTO user_interests
  FROM user_subscriptions 
  WHERE user_id = p_user_id 
    AND subscription_type = 'category';

  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.summary,
    n.image_url,
    ns.name as source_name,
    n.published_at,
    CASE 
      WHEN user_interests IS NOT NULL AND n.categories && user_interests 
      THEN n.relevance_score * 1.5
      ELSE n.relevance_score
    END as relevance_score,
    n.categories
  FROM news_articles n
  JOIN news_sources ns ON n.source_id = ns.id
  WHERE n.status = 'published'
    AND n.published_at > NOW() - INTERVAL '7 days'
  ORDER BY relevance_score DESC, n.published_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function for advanced content search
CREATE OR REPLACE FUNCTION search_content(
  p_query TEXT,
  p_content_type TEXT DEFAULT 'all', -- 'articles', 'news', 'all'
  p_categories TEXT[] DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_locale TEXT DEFAULT 'en',
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  content_type TEXT,
  title JSONB,
  summary JSONB,
  slug TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  relevance_rank REAL
) 
LANGUAGE plpgsql
AS $$
DECLARE
  search_vector tsvector;
  search_query tsquery;
BEGIN
  -- Prepare search query
  search_query := plainto_tsquery(
    CASE WHEN p_locale = 'es' THEN 'spanish' ELSE 'english' END,
    p_query
  );

  -- Search articles if requested
  IF p_content_type IN ('articles', 'all') THEN
    RETURN QUERY
    SELECT 
      a.id,
      'article'::TEXT as content_type,
      a.title,
      a.summary,
      a.slug,
      a.published_at,
      ts_rank(
        to_tsvector(
          CASE WHEN p_locale = 'es' THEN 'spanish' ELSE 'english' END,
          COALESCE(a.title->>p_locale, '') || ' ' || 
          COALESCE(a.content->>p_locale, '') || ' ' ||
          COALESCE(a.meta_description->>p_locale, '')
        ),
        search_query
      ) as relevance_rank
    FROM articles a
    WHERE a.status = 'published'
      AND (p_categories IS NULL OR a.category = ANY(p_categories))
      AND (p_tags IS NULL OR a.tags && p_tags)
      AND to_tsvector(
        CASE WHEN p_locale = 'es' THEN 'spanish' ELSE 'english' END,
        COALESCE(a.title->>p_locale, '') || ' ' || 
        COALESCE(a.content->>p_locale, '') || ' ' ||
        COALESCE(a.meta_description->>p_locale, '')
      ) @@ search_query;
  END IF;

  -- Search news if requested
  IF p_content_type IN ('news', 'all') THEN
    RETURN QUERY
    SELECT 
      n.id,
      'news'::TEXT as content_type,
      n.title,
      n.summary,
      NULL::TEXT as slug,
      n.published_at,
      ts_rank(
        to_tsvector(
          CASE WHEN p_locale = 'es' THEN 'spanish' ELSE 'english' END,
          COALESCE(n.title->>p_locale, '') || ' ' || 
          COALESCE(n.summary->>p_locale, '') || ' ' ||
          COALESCE(n.content->>p_locale, '')
        ),
        search_query
      ) as relevance_rank
    FROM news_articles n
    WHERE n.status = 'published'
      AND (p_categories IS NULL OR n.categories && p_categories)
      AND to_tsvector(
        CASE WHEN p_locale = 'es' THEN 'spanish' ELSE 'english' END,
        COALESCE(n.title->>p_locale, '') || ' ' || 
        COALESCE(n.summary->>p_locale, '') || ' ' ||
        COALESCE(n.content->>p_locale, '')
      ) @@ search_query;
  END IF;

  -- Order by relevance and apply pagination
  RETURN QUERY
  SELECT * FROM (
    SELECT * FROM search_content_results
    ORDER BY relevance_rank DESC
    LIMIT p_limit
    OFFSET p_offset
  ) final_results;
END;
$$;

-- ============================================================================
-- QUERY PERFORMANCE MONITORING
-- ============================================================================

-- Enable query statistics collection
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Function to get slow queries
CREATE OR REPLACE FUNCTION get_slow_queries(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  query TEXT,
  calls BIGINT,
  total_time DOUBLE PRECISION,
  mean_time DOUBLE PRECISION,
  rows BIGINT
) 
LANGUAGE sql
AS $$
  SELECT 
    query,
    calls,
    total_exec_time as total_time,
    mean_exec_time as mean_time,
    rows
  FROM pg_stat_statements 
  WHERE query NOT LIKE '%pg_stat_statements%'
  ORDER BY mean_exec_time DESC 
  LIMIT p_limit;
$$;

-- Function to analyze table statistics
CREATE OR REPLACE FUNCTION analyze_table_stats()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  table_size TEXT,
  index_size TEXT,
  total_size TEXT
) 
LANGUAGE sql
AS $$
  SELECT 
    schemaname||'.'||tablename as table_name,
    n_tup_ins + n_tup_upd + n_tup_del as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) + pg_indexes_size(schemaname||'.'||tablename)) as total_size
  FROM pg_stat_user_tables 
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
$$;

-- ============================================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================================================

-- Materialized view for article statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS article_stats AS
SELECT 
  a.id,
  a.title,
  a.author_id,
  a.published_at,
  a.view_count,
  a.like_count,
  COUNT(ci.id) as total_interactions,
  COUNT(CASE WHEN ci.interaction_type = 'like' THEN 1 END) as likes,
  COUNT(CASE WHEN ci.interaction_type = 'share' THEN 1 END) as shares,
  COUNT(CASE WHEN ci.interaction_type = 'bookmark' THEN 1 END) as bookmarks,
  AVG(CASE WHEN ci.interaction_type = 'view' THEN 1.0 ELSE 0 END) as engagement_rate
FROM articles a
LEFT JOIN content_interactions ci ON a.id = ci.content_id AND ci.content_type = 'article'
WHERE a.status = 'published'
GROUP BY a.id, a.title, a.author_id, a.published_at, a.view_count, a.like_count;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_article_stats_id ON article_stats(id);

-- Materialized view for trending content
CREATE MATERIALIZED VIEW IF NOT EXISTS trending_content AS
SELECT 
  content_id,
  content_type,
  COUNT(*) as interaction_count,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(created_at) as last_interaction,
  (COUNT(*) * 1.0 + COUNT(DISTINCT user_id) * 2.0) / 
    EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) * 3600 as trending_score
FROM content_interactions 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY content_id, content_type
HAVING COUNT(*) > 1
ORDER BY trending_score DESC;

-- Create index on trending content view
CREATE INDEX IF NOT EXISTS idx_trending_content_score ON trending_content(trending_score DESC);

-- ============================================================================
-- REFRESH FUNCTIONS FOR MATERIALIZED VIEWS
-- ============================================================================

-- Function to refresh article stats
CREATE OR REPLACE FUNCTION refresh_article_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY article_stats;
END;
$$;

-- Function to refresh trending content
CREATE OR REPLACE FUNCTION refresh_trending_content()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_content;
END;
$$;

-- ============================================================================
-- SCHEDULED JOBS FOR MAINTENANCE
-- ============================================================================

-- Note: These would typically be set up with pg_cron extension
-- For now, we'll create the functions that can be called manually or via cron

-- Function to update article view counts from interactions
CREATE OR REPLACE FUNCTION update_article_view_counts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE articles 
  SET view_count = COALESCE(interaction_counts.view_count, 0)
  FROM (
    SELECT 
      content_id,
      COUNT(*) as view_count
    FROM content_interactions 
    WHERE content_type = 'article' 
      AND interaction_type = 'view'
    GROUP BY content_id
  ) interaction_counts
  WHERE articles.id = interaction_counts.content_id;
END;
$$;

-- Function to cleanup old cache entries (if using database for caching)
CREATE OR REPLACE FUNCTION cleanup_old_cache_entries()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- This would clean up any database-based cache tables
  -- For Redis cache, this is handled by TTL
  NULL;
END;
$$;

-- ============================================================================
-- PERFORMANCE MONITORING VIEWS
-- ============================================================================

-- View for monitoring index usage
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan,
  CASE 
    WHEN idx_scan = 0 THEN 'Unused'
    WHEN idx_scan < 10 THEN 'Low Usage'
    WHEN idx_scan < 100 THEN 'Medium Usage'
    ELSE 'High Usage'
  END as usage_level
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- View for monitoring table access patterns
CREATE OR REPLACE VIEW table_access_stats AS
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  CASE 
    WHEN seq_scan > idx_scan THEN 'Sequential Scan Heavy'
    WHEN idx_scan > seq_scan * 10 THEN 'Index Scan Optimized'
    ELSE 'Balanced'
  END as access_pattern
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan + idx_scan DESC;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_trending_articles TO authenticated;
GRANT EXECUTE ON FUNCTION get_personalized_news_feed TO authenticated;
GRANT EXECUTE ON FUNCTION search_content TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_article_stats TO service_role;
GRANT EXECUTE ON FUNCTION refresh_trending_content TO service_role;
GRANT EXECUTE ON FUNCTION update_article_view_counts TO service_role;

-- Grant select permissions on materialized views
GRANT SELECT ON article_stats TO authenticated;
GRANT SELECT ON trending_content TO authenticated;
GRANT SELECT ON index_usage_stats TO authenticated;
GRANT SELECT ON table_access_stats TO authenticated;