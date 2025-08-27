-- Fix Category Issues - Execute this in Supabase SQL Editor
-- This will resolve the errors in the admin panel

-- 1. Create the missing get_category_stats function (simplified version)
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
      SUM(COALESCE(a.view_count, 0)) as total_views
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
EXCEPTION
  WHEN undefined_table THEN
    -- If related tables don't exist, return basic category info
    RETURN QUERY
    SELECT 
      cc.id,
      cc.name,
      0::bigint as article_count,
      0::bigint as news_count,
      0::bigint as total_views,
      0::bigint as total_interactions
    FROM content_categories cc
    WHERE cc.is_active = true
    ORDER BY cc.order_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_category_stats() TO authenticated;

-- 3. Verify the function was created
SELECT proname, prosrc FROM pg_proc WHERE proname = 'get_category_stats';

-- 4. Test the function
SELECT * FROM get_category_stats() LIMIT 5;
