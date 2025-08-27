-- Fix only the specific category issues without conflicts
-- This migration only addresses the missing function and RLS policies for categories

-- 1. Create the missing get_category_stats function (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_category_stats') THEN
    CREATE FUNCTION get_category_stats()
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
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  END IF;
END $$;

-- 2. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_category_stats() TO authenticated;

-- 3. Drop only the conflicting policies for content_categories
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON content_categories;
DROP POLICY IF EXISTS "Admins and editors can view all categories" ON content_categories;
DROP POLICY IF EXISTS "Admins and editors can insert categories" ON content_categories;
DROP POLICY IF EXISTS "Admins and editors can update categories" ON content_categories;
DROP POLICY IF EXISTS "Admins and editors can delete categories" ON content_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON content_categories;

-- 4. Create new policies for content_categories only
CREATE POLICY "Categories are viewable by everyone"
  ON content_categories
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can view all categories"
  ON content_categories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert categories"
  ON content_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update categories"
  ON content_categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete categories"
  ON content_categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 5. Ensure RLS is enabled for content_categories
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;
GRANT ALL ON content_categories TO authenticated;
