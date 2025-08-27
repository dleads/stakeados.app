-- Migration: Create comprehensive search and filtering system
-- This migration adds full-text search capabilities and search analytics

-- Create search analytics table
CREATE TABLE IF NOT EXISTS search_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    search_query TEXT NOT NULL,
    search_type TEXT CHECK (search_type IN ('articles', 'news', 'categories', 'tags', 'global')),
    filters_applied JSONB,
    results_count INTEGER,
    clicked_result_id UUID,
    search_duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create saved searches table
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    name TEXT NOT NULL,
    search_query TEXT,
    search_type TEXT CHECK (search_type IN ('articles', 'news', 'categories', 'tags', 'global')),
    filters JSONB,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add full-text search columns to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Add full-text search columns to news table  
ALTER TABLE news ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update article search vector
CREATE OR REPLACE FUNCTION update_article_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.summary, '')), 'B') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.content, '')), 'C') ||
        setweight(to_tsvector('spanish', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update news search vector
CREATE OR REPLACE FUNCTION update_news_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.summary, '')), 'B') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.content, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic search vector updates
DROP TRIGGER IF EXISTS articles_search_vector_update ON articles;
CREATE TRIGGER articles_search_vector_update
    BEFORE INSERT OR UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_article_search_vector();

DROP TRIGGER IF EXISTS news_search_vector_update ON news;
CREATE TRIGGER news_search_vector_update
    BEFORE INSERT OR UPDATE ON news
    FOR EACH ROW EXECUTE FUNCTION update_news_search_vector();

-- Create indexes for full-text search
CREATE INDEX IF NOT EXISTS articles_search_vector_idx ON articles USING gin(search_vector);
CREATE INDEX IF NOT EXISTS news_search_vector_idx ON news USING gin(search_vector);

-- Create indexes for search analytics
CREATE INDEX IF NOT EXISTS search_analytics_user_id_idx ON search_analytics(user_id);
CREATE INDEX IF NOT EXISTS search_analytics_created_at_idx ON search_analytics(created_at);
CREATE INDEX IF NOT EXISTS search_analytics_search_type_idx ON search_analytics(search_type);

-- Create indexes for saved searches
CREATE INDEX IF NOT EXISTS saved_searches_user_id_idx ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS saved_searches_is_default_idx ON saved_searches(is_default);

-- Update existing articles and news with search vectors
UPDATE articles SET search_vector = 
    setweight(to_tsvector('spanish', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(summary, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(content, '')), 'C') ||
    setweight(to_tsvector('spanish', COALESCE(array_to_string(tags, ' '), '')), 'D')
WHERE search_vector IS NULL;

UPDATE news SET search_vector = 
    setweight(to_tsvector('spanish', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(summary, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(content, '')), 'C')
WHERE search_vector IS NULL;

-- Create comprehensive search function
CREATE OR REPLACE FUNCTION search_content(
    search_query TEXT,
    content_types TEXT[] DEFAULT ARRAY['articles', 'news'],
    filters JSONB DEFAULT '{}',
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content_type TEXT,
    summary TEXT,
    author_name TEXT,
    category_name TEXT,
    published_at TIMESTAMPTZ,
    rank REAL,
    highlight TEXT
) AS $$
DECLARE
    query_tsquery tsquery;
    category_filter UUID;
    author_filter UUID;
    status_filter TEXT;
    date_from TIMESTAMPTZ;
    date_to TIMESTAMPTZ;
BEGIN
    -- Parse search query
    query_tsquery := plainto_tsquery('spanish', search_query);
    
    -- Extract filters
    category_filter := (filters->>'category_id')::UUID;
    author_filter := (filters->>'author_id')::UUID;
    status_filter := filters->>'status';
    date_from := (filters->>'date_from')::TIMESTAMPTZ;
    date_to := (filters->>'date_to')::TIMESTAMPTZ;
    
    -- Search articles
    IF 'articles' = ANY(content_types) THEN
        RETURN QUERY
        SELECT 
            a.id,
            a.title,
            'article'::TEXT as content_type,
            a.summary,
            p.full_name as author_name,
            c.name as category_name,
            a.published_at,
            ts_rank(a.search_vector, query_tsquery) as rank,
            ts_headline('spanish', a.content, query_tsquery, 'MaxWords=20, MinWords=5') as highlight
        FROM articles a
        LEFT JOIN profiles p ON a.author_id = p.id
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE 
            (search_query = '' OR a.search_vector @@ query_tsquery)
            AND (category_filter IS NULL OR a.category_id = category_filter)
            AND (author_filter IS NULL OR a.author_id = author_filter)
            AND (status_filter IS NULL OR a.status = status_filter)
            AND (date_from IS NULL OR a.created_at >= date_from)
            AND (date_to IS NULL OR a.created_at <= date_to)
        ORDER BY 
            CASE WHEN search_query = '' THEN a.created_at ELSE ts_rank(a.search_vector, query_tsquery) END DESC;
    END IF;
    
    -- Search news
    IF 'news' = ANY(content_types) THEN
        RETURN QUERY
        SELECT 
            n.id,
            n.title,
            'news'::TEXT as content_type,
            n.summary,
            n.source_name as author_name,
            c.name as category_name,
            n.published_at,
            ts_rank(n.search_vector, query_tsquery) as rank,
            ts_headline('spanish', n.content, query_tsquery, 'MaxWords=20, MinWords=5') as highlight
        FROM news n
        LEFT JOIN categories c ON n.category_id = c.id
        WHERE 
            (search_query = '' OR n.search_vector @@ query_tsquery)
            AND (category_filter IS NULL OR n.category_id = category_filter)
            AND (date_from IS NULL OR n.created_at >= date_from)
            AND (date_to IS NULL OR n.created_at <= date_to)
        ORDER BY 
            CASE WHEN search_query = '' THEN n.created_at ELSE ts_rank(n.search_vector, query_tsquery) END DESC;
    END IF;
    
    -- Apply global limit and offset
    RETURN QUERY
    SELECT * FROM (
        SELECT DISTINCT ON (id) * FROM search_content.search_content
        ORDER BY rank DESC, published_at DESC
        LIMIT limit_count OFFSET offset_count
    ) final_results;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON search_analytics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON saved_searches TO authenticated;
GRANT USAGE ON SEQUENCE search_analytics_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE saved_searches_id_seq TO authenticated;

-- Enable RLS
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own search analytics" ON search_analytics
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own saved searches" ON saved_searches
    FOR ALL USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all search analytics" ON search_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );