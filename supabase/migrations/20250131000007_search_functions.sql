-- Search and filtering functions

-- Create search history table
CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  query text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create saved searches table
CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  last_used timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Policies for search history
CREATE POLICY "Users can manage their own search history"
  ON search_history
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for saved searches
CREATE POLICY "Users can manage their own saved searches"
  ON saved_searches
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for search performance
CREATE INDEX IF NOT EXISTS idx_search_history_user_created ON search_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_used ON saved_searches(user_id, last_used DESC);

-- Full-text search function for content
CREATE OR REPLACE FUNCTION search_content(
  search_query text DEFAULT '',
  search_categories text[] DEFAULT '{}',
  search_tags text[] DEFAULT '{}',
  search_difficulty text DEFAULT NULL,
  search_author text DEFAULT NULL,
  search_content_type text DEFAULT 'all',
  search_date_from timestamptz DEFAULT NULL,
  search_date_to timestamptz DEFAULT NULL,
  search_locale text DEFAULT 'en',
  sort_by text DEFAULT 'relevance',
  sort_order text DEFAULT 'desc',
  result_limit integer DEFAULT 20,
  result_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title jsonb,
  content jsonb,
  summary jsonb,
  content_type text,
  author_id uuid,
  author_name text,
  categories text[],
  tags text[],
  difficulty_level text,
  featured_image_url text,
  published_at timestamptz,
  created_at timestamptz,
  view_count integer,
  like_count integer,
  relevance_score real
) AS $$
DECLARE
  search_vector tsvector;
BEGIN
  -- Create search vector if query provided
  IF search_query != '' THEN
    search_vector := plainto_tsquery(CASE WHEN search_locale = 'es' THEN 'spanish' ELSE 'english' END, search_query);
  END IF;

  -- Return combined results from articles and news
  RETURN QUERY
  WITH article_results AS (
    SELECT 
      a.id,
      a.title,
      a.content,
      '{}'::jsonb as summary,
      'article'::text as content_type,
      a.author_id,
      p.display_name as author_name,
      ARRAY[a.category] as categories,
      a.tags,
      a.difficulty_level,
      a.featured_image_url,
      a.published_at,
      a.created_at,
      a.view_count,
      a.like_count,
      CASE 
        WHEN search_query = '' THEN 0.5
        ELSE ts_rank(
          to_tsvector(
            CASE WHEN search_locale = 'es' THEN 'spanish' ELSE 'english' END,
            COALESCE(a.title->>search_locale, '') || ' ' || COALESCE(a.content->>search_locale, '')
          ),
          search_vector
        )
      END as relevance_score
    FROM articles a
    JOIN profiles p ON a.author_id = p.id
    WHERE a.status = 'published'
      AND (search_query = '' OR to_tsvector(
        CASE WHEN search_locale = 'es' THEN 'spanish' ELSE 'english' END,
        COALESCE(a.title->>search_locale, '') || ' ' || COALESCE(a.content->>search_locale, '')
      ) @@ search_vector)
      AND (array_length(search_categories, 1) IS NULL OR a.category = ANY(search_categories))
      AND (array_length(search_tags, 1) IS NULL OR a.tags && search_tags)
      AND (search_difficulty IS NULL OR a.difficulty_level = search_difficulty)
      AND (search_author IS NULL OR a.author_id = search_author::uuid)
      AND (search_date_from IS NULL OR a.published_at >= search_date_from)
      AND (search_date_to IS NULL OR a.published_at <= search_date_to)
      AND (search_content_type IN ('all', 'article'))
  ),
  news_results AS (
    SELECT 
      n.id,
      n.title,
      n.content,
      n.summary,
      'news'::text as content_type,
      NULL::uuid as author_id,
      n.source_name as author_name,
      n.categories,
      n.keywords as tags,
      NULL::text as difficulty_level,
      n.image_url as featured_image_url,
      n.published_at,
      n.created_at,
      0 as view_count,
      0 as like_count,
      CASE 
        WHEN search_query = '' THEN COALESCE(n.relevance_score::real, 0.5)
        ELSE ts_rank(
          to_tsvector(
            CASE WHEN search_locale = 'es' THEN 'spanish' ELSE 'english' END,
            COALESCE(n.title->>search_locale, '') || ' ' || COALESCE(n.summary->>search_locale, '')
          ),
          search_vector
        )
      END as relevance_score
    FROM news_articles n
    WHERE (search_query = '' OR to_tsvector(
      CASE WHEN search_locale = 'es' THEN 'spanish' ELSE 'english' END,
      COALESCE(n.title->>search_locale, '') || ' ' || COALESCE(n.summary->>search_locale, '')
    ) @@ search_vector)
      AND (array_length(search_categories, 1) IS NULL OR n.categories && search_categories)
      AND (array_length(search_tags, 1) IS NULL OR n.keywords && search_tags)
      AND (search_date_from IS NULL OR n.published_at >= search_date_from)
      AND (search_date_to IS NULL OR n.published_at <= search_date_to)
      AND (search_content_type IN ('all', 'news'))
  ),
  combined_results AS (
    SELECT * FROM article_results
    UNION ALL
    SELECT * FROM news_results
  )
  SELECT * FROM combined_results
  ORDER BY 
    CASE WHEN sort_by = 'relevance' AND sort_order = 'desc' THEN relevance_score END DESC,
    CASE WHEN sort_by = 'relevance' AND sort_order = 'asc' THEN relevance_score END ASC,
    CASE WHEN sort_by = 'date' AND sort_order = 'desc' THEN published_at END DESC,
    CASE WHEN sort_by = 'date' AND sort_order = 'asc' THEN published_at END ASC,
    published_at DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to count search results
CREATE OR REPLACE FUNCTION count_search_results(
  search_query text DEFAULT '',
  search_categories text[] DEFAULT '{}',
  search_tags text[] DEFAULT '{}',
  search_difficulty text DEFAULT NULL,
  search_author text DEFAULT NULL,
  search_content_type text DEFAULT 'all',
  search_date_from timestamptz DEFAULT NULL,
  search_date_to timestamptz DEFAULT NULL,
  search_locale text DEFAULT 'en'
)
RETURNS TABLE (
  total_count bigint,
  article_count bigint,
  news_count bigint
) AS $$
DECLARE
  search_vector tsvector;
BEGIN
  -- Create search vector if query provided
  IF search_query != '' THEN
    search_vector := plainto_tsquery(CASE WHEN search_locale = 'es' THEN 'spanish' ELSE 'english' END, search_query);
  END IF;

  RETURN QUERY
  WITH article_count AS (
    SELECT COUNT(*) as count
    FROM articles a
    WHERE a.status = 'published'
      AND (search_query = '' OR to_tsvector(
        CASE WHEN search_locale = 'es' THEN 'spanish' ELSE 'english' END,
        COALESCE(a.title->>search_locale, '') || ' ' || COALESCE(a.content->>search_locale, '')
      ) @@ search_vector)
      AND (array_length(search_categories, 1) IS NULL OR a.category = ANY(search_categories))
      AND (array_length(search_tags, 1) IS NULL OR a.tags && search_tags)
      AND (search_difficulty IS NULL OR a.difficulty_level = search_difficulty)
      AND (search_author IS NULL OR a.author_id = search_author::uuid)
      AND (search_date_from IS NULL OR a.published_at >= search_date_from)
      AND (search_date_to IS NULL OR a.published_at <= search_date_to)
      AND (search_content_type IN ('all', 'article'))
  ),
  news_count AS (
    SELECT COUNT(*) as count
    FROM news_articles n
    WHERE (search_query = '' OR to_tsvector(
      CASE WHEN search_locale = 'es' THEN 'spanish' ELSE 'english' END,
      COALESCE(n.title->>search_locale, '') || ' ' || COALESCE(n.summary->>search_locale, '')
    ) @@ search_vector)
      AND (array_length(search_categories, 1) IS NULL OR n.categories && search_categories)
      AND (array_length(search_tags, 1) IS NULL OR n.keywords && search_tags)
      AND (search_date_from IS NULL OR n.published_at >= search_date_from)
      AND (search_date_to IS NULL OR n.published_at <= search_date_to)
      AND (search_content_type IN ('all', 'news'))
  )
  SELECT 
    ac.count + nc.count as total_count,
    ac.count as article_count,
    nc.count as news_count
  FROM article_count ac, news_count nc;
END;
$$ LANGUAGE plpgsql;

-- Function to get search facets
CREATE OR REPLACE FUNCTION get_search_facets(
  search_query text DEFAULT '',
  search_categories text[] DEFAULT '{}',
  search_tags text[] DEFAULT '{}',
  search_difficulty text DEFAULT NULL,
  search_author text DEFAULT NULL,
  search_content_type text DEFAULT 'all',
  search_date_from timestamptz DEFAULT NULL,
  search_date_to timestamptz DEFAULT NULL,
  search_locale text DEFAULT 'en'
)
RETURNS TABLE (
  facet_type text,
  facet_value text,
  facet_count bigint
) AS $$
DECLARE
  search_vector tsvector;
BEGIN
  -- Create search vector if query provided
  IF search_query != '' THEN
    search_vector := plainto_tsquery(CASE WHEN search_locale = 'es' THEN 'spanish' ELSE 'english' END, search_query);
  END IF;

  RETURN QUERY
  -- Category facets
  SELECT 
    'category'::text as facet_type,
    a.category as facet_value,
    COUNT(*) as facet_count
  FROM articles a
  WHERE a.status = 'published'
    AND (search_query = '' OR to_tsvector(
      CASE WHEN search_locale = 'es' THEN 'spanish' ELSE 'english' END,
      COALESCE(a.title->>search_locale, '') || ' ' || COALESCE(a.content->>search_locale, '')
    ) @@ search_vector)
    AND (array_length(search_categories, 1) IS NULL OR a.category = ANY(search_categories))
    AND (array_length(search_tags, 1) IS NULL OR a.tags && search_tags)
    AND (search_difficulty IS NULL OR a.difficulty_level = search_difficulty)
    AND (search_author IS NULL OR a.author_id = search_author::uuid)
    AND (search_date_from IS NULL OR a.published_at >= search_date_from)
    AND (search_date_to IS NULL OR a.published_at <= search_date_to)
    AND (search_content_type IN ('all', 'article'))
    AND a.category != ''
  GROUP BY a.category
  HAVING COUNT(*) > 0
  
  UNION ALL
  
  -- Tag facets
  SELECT 
    'tag'::text as facet_type,
    unnest(a.tags) as facet_value,
    COUNT(*) as facet_count
  FROM articles a
  WHERE a.status = 'published'
    AND (search_query = '' OR to_tsvector(
      CASE WHEN search_locale = 'es' THEN 'spanish' ELSE 'english' END,
      COALESCE(a.title->>search_locale, '') || ' ' || COALESCE(a.content->>search_locale, '')
    ) @@ search_vector)
    AND (array_length(search_categories, 1) IS NULL OR a.category = ANY(search_categories))
    AND (array_length(search_tags, 1) IS NULL OR a.tags && search_tags)
    AND (search_difficulty IS NULL OR a.difficulty_level = search_difficulty)
    AND (search_author IS NULL OR a.author_id = search_author::uuid)
    AND (search_date_from IS NULL OR a.published_at >= search_date_from)
    AND (search_date_to IS NULL OR a.published_at <= search_date_to)
    AND (search_content_type IN ('all', 'article'))
    AND array_length(a.tags, 1) > 0
  GROUP BY unnest(a.tags)
  HAVING COUNT(*) > 0
  
  UNION ALL
  
  -- Difficulty level facets
  SELECT 
    'difficulty'::text as facet_type,
    a.difficulty_level as facet_value,
    COUNT(*) as facet_count
  FROM articles a
  WHERE a.status = 'published'
    AND (search_query = '' OR to_tsvector(
      CASE WHEN search_locale = 'es' THEN 'spanish' ELSE 'english' END,
      COALESCE(a.title->>search_locale, '') || ' ' || COALESCE(a.content->>search_locale, '')
    ) @@ search_vector)
    AND (array_length(search_categories, 1) IS NULL OR a.category = ANY(search_categories))
    AND (array_length(search_tags, 1) IS NULL OR a.tags && search_tags)
    AND (search_difficulty IS NULL OR a.difficulty_level = search_difficulty)
    AND (search_author IS NULL OR a.author_id = search_author::uuid)
    AND (search_date_from IS NULL OR a.published_at >= search_date_from)
    AND (search_date_to IS NULL OR a.published_at <= search_date_to)
    AND (search_content_type IN ('all', 'article'))
    AND a.difficulty_level IS NOT NULL
  GROUP BY a.difficulty_level
  HAVING COUNT(*) > 0;
END;
$$ LANGUAGE plpgsql;