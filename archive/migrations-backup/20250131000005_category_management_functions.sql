-- Category management functions and views

-- Function to get category statistics
CREATE OR REPLACE FUNCTION get_category_stats()
RETURNS TABLE (
  id uuid,
  name jsonb,
  article_count bigint,
  news_count bigint,
  total_views bigint,
  total_interactions bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.id,
    cc.name,
    COALESCE(article_stats.article_count, 0) as article_count,
    COALESCE(news_stats.news_count, 0) as news_count,
    COALESCE(article_stats.total_views, 0) as total_views,
    COALESCE(interaction_stats.total_interactions, 0) as total_interactions
  FROM content_categories cc
  LEFT JOIN (
    SELECT 
      ac.category_id,
      COUNT(*) as article_count,
      SUM(a.view_count) as total_views
    FROM article_categories ac
    JOIN articles a ON ac.article_id = a.id
    WHERE a.status = 'published'
    GROUP BY ac.category_id
  ) article_stats ON cc.id = article_stats.category_id
  LEFT JOIN (
    SELECT 
      nc.category_id,
      COUNT(*) as news_count
    FROM news_categories nc
    JOIN news_articles na ON nc.news_id = na.id
    GROUP BY nc.category_id
  ) news_stats ON cc.id = news_stats.category_id
  LEFT JOIN (
    SELECT 
      CASE 
        WHEN ci.content_type = 'article' THEN (
          SELECT ac.category_id 
          FROM article_categories ac 
          WHERE ac.article_id = ci.content_id::uuid 
          LIMIT 1
        )
        WHEN ci.content_type = 'news' THEN (
          SELECT nc.category_id 
          FROM news_categories nc 
          WHERE nc.news_id = ci.content_id::uuid 
          LIMIT 1
        )
      END as category_id,
      COUNT(*) as total_interactions
    FROM content_interactions ci
    WHERE ci.content_id IS NOT NULL
    GROUP BY category_id
  ) interaction_stats ON cc.id = interaction_stats.category_id
  WHERE cc.is_active = true
  ORDER BY cc.order_index;
END;
$$ LANGUAGE plpgsql;

-- Function to get popular categories based on content engagement
CREATE OR REPLACE FUNCTION get_popular_categories(limit_count integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  name jsonb,
  slug text,
  color text,
  icon text,
  popularity_score numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.id,
    cc.name,
    cc.slug,
    cc.color,
    cc.icon,
    (
      COALESCE(article_stats.total_views, 0) * 1.0 +
      COALESCE(interaction_stats.total_interactions, 0) * 2.0 +
      COALESCE(article_stats.article_count, 0) * 0.5 +
      COALESCE(news_stats.news_count, 0) * 0.3
    ) as popularity_score
  FROM content_categories cc
  LEFT JOIN (
    SELECT 
      ac.category_id,
      COUNT(*) as article_count,
      SUM(a.view_count) as total_views
    FROM article_categories ac
    JOIN articles a ON ac.article_id = a.id
    WHERE a.status = 'published'
    GROUP BY ac.category_id
  ) article_stats ON cc.id = article_stats.category_id
  LEFT JOIN (
    SELECT 
      nc.category_id,
      COUNT(*) as news_count
    FROM news_categories nc
    JOIN news_articles na ON nc.news_id = na.id
    GROUP BY nc.category_id
  ) news_stats ON cc.id = news_stats.category_id
  LEFT JOIN (
    SELECT 
      CASE 
        WHEN ci.content_type = 'article' THEN (
          SELECT ac.category_id 
          FROM article_categories ac 
          WHERE ac.article_id = ci.content_id::uuid 
          LIMIT 1
        )
        WHEN ci.content_type = 'news' THEN (
          SELECT nc.category_id 
          FROM news_categories nc 
          WHERE nc.news_id = ci.content_id::uuid 
          LIMIT 1
        )
      END as category_id,
      COUNT(*) as total_interactions
    FROM content_interactions ci
    WHERE ci.content_id IS NOT NULL
    GROUP BY category_id
  ) interaction_stats ON cc.id = interaction_stats.category_id
  WHERE cc.is_active = true
  ORDER BY popularity_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to validate category hierarchy (for future use)
CREATE OR REPLACE FUNCTION validate_category_hierarchy()
RETURNS trigger AS $$
BEGIN
  -- For now, we don't have hierarchy, but this function can be extended
  -- to validate parent-child relationships when hierarchy is implemented
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add admin policies for category management
CREATE POLICY "Admins can manage categories"
  ON content_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_category_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_categories(integer) TO authenticated;