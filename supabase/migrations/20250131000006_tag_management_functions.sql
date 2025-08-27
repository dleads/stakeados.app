-- Tag management functions and views

-- Function to get popular tags with usage statistics
CREATE OR REPLACE FUNCTION get_popular_tags(limit_count integer DEFAULT 20)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  usage_count integer,
  created_at timestamptz,
  recent_usage bigint,
  trending_score numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.id,
    ct.name,
    ct.slug,
    ct.usage_count,
    ct.created_at,
    COALESCE(recent_stats.recent_usage, 0) as recent_usage,
    CASE 
      WHEN EXTRACT(EPOCH FROM (NOW() - ct.created_at)) / 86400 > 0 
      THEN ct.usage_count::numeric / (EXTRACT(EPOCH FROM (NOW() - ct.created_at)) / 86400)
      ELSE ct.usage_count::numeric
    END as trending_score
  FROM content_tags ct
  LEFT JOIN (
    SELECT 
      at.tag_id,
      COUNT(*) as recent_usage
    FROM article_tags at
    JOIN articles a ON at.article_id = a.id
    WHERE a.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY at.tag_id
  ) recent_stats ON ct.id = recent_stats.tag_id
  WHERE ct.usage_count > 0
  ORDER BY ct.usage_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get trending tags (high recent usage relative to total usage)
CREATE OR REPLACE FUNCTION get_trending_tags(limit_count integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  usage_count integer,
  created_at timestamptz,
  recent_usage bigint,
  trending_score numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.id,
    ct.name,
    ct.slug,
    ct.usage_count,
    ct.created_at,
    COALESCE(recent_stats.recent_usage, 0) as recent_usage,
    CASE 
      WHEN ct.usage_count > 0 AND EXTRACT(EPOCH FROM (NOW() - ct.created_at)) / 86400 > 0
      THEN (COALESCE(recent_stats.recent_usage, 0)::numeric * 30) / 
           GREATEST(ct.usage_count::numeric, 1) / 
           GREATEST(EXTRACT(EPOCH FROM (NOW() - ct.created_at)) / 86400, 1)
      ELSE 0
    END as trending_score
  FROM content_tags ct
  LEFT JOIN (
    SELECT 
      at.tag_id,
      COUNT(*) as recent_usage
    FROM article_tags at
    JOIN articles a ON at.article_id = a.id
    WHERE a.created_at >= NOW() - INTERVAL '7 days'
    GROUP BY at.tag_id
  ) recent_stats ON ct.id = recent_stats.tag_id
  WHERE ct.usage_count > 0
  ORDER BY trending_score DESC, recent_usage DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get related tags (tags that appear together frequently)
CREATE OR REPLACE FUNCTION get_related_tags(tag_id uuid, limit_count integer DEFAULT 5)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  usage_count integer,
  created_at timestamptz,
  co_occurrence_count bigint,
  relatedness_score numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.id,
    ct.name,
    ct.slug,
    ct.usage_count,
    ct.created_at,
    related_stats.co_occurrence_count,
    related_stats.relatedness_score
  FROM content_tags ct
  JOIN (
    SELECT 
      at2.tag_id as related_tag_id,
      COUNT(*) as co_occurrence_count,
      COUNT(*)::numeric / GREATEST(ct_base.usage_count::numeric, 1) as relatedness_score
    FROM article_tags at1
    JOIN article_tags at2 ON at1.article_id = at2.article_id
    JOIN content_tags ct_base ON ct_base.id = tag_id
    WHERE at1.tag_id = tag_id 
      AND at2.tag_id != tag_id
    GROUP BY at2.tag_id, ct_base.usage_count
    ORDER BY co_occurrence_count DESC
  ) related_stats ON ct.id = related_stats.related_tag_id
  ORDER BY related_stats.relatedness_score DESC, related_stats.co_occurrence_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to suggest tags based on content similarity
CREATE OR REPLACE FUNCTION suggest_tags_from_content(
  content_text text,
  title_text text DEFAULT '',
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  usage_count integer,
  similarity_score numeric
) AS $$
BEGIN
  -- This is a simplified version. In production, you might want to use
  -- more sophisticated text similarity algorithms or integrate with AI services
  RETURN QUERY
  SELECT 
    ct.id,
    ct.name,
    ct.slug,
    ct.usage_count,
    CASE 
      WHEN LOWER(content_text) LIKE '%' || ct.name || '%' OR LOWER(title_text) LIKE '%' || ct.name || '%'
      THEN 1.0
      WHEN similarity(LOWER(content_text || ' ' || title_text), ct.name) > 0.1
      THEN similarity(LOWER(content_text || ' ' || title_text), ct.name)::numeric
      ELSE 0.0
    END as similarity_score
  FROM content_tags ct
  WHERE ct.usage_count > 0
    AND (
      LOWER(content_text) LIKE '%' || ct.name || '%' 
      OR LOWER(title_text) LIKE '%' || ct.name || '%'
      OR similarity(LOWER(content_text || ' ' || title_text), ct.name) > 0.1
    )
  ORDER BY similarity_score DESC, ct.usage_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up unused tags
CREATE OR REPLACE FUNCTION cleanup_unused_tags()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete tags with zero usage that are older than 30 days
  DELETE FROM content_tags 
  WHERE usage_count = 0 
    AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to merge duplicate tags
CREATE OR REPLACE FUNCTION merge_duplicate_tags()
RETURNS integer AS $$
DECLARE
  merged_count integer := 0;
  tag_record record;
  target_tag_id uuid;
BEGIN
  -- Find duplicate tags (same name, different IDs)
  FOR tag_record IN 
    SELECT name, array_agg(id ORDER BY created_at) as tag_ids, array_agg(usage_count ORDER BY created_at DESC) as usage_counts
    FROM content_tags 
    GROUP BY name 
    HAVING COUNT(*) > 1
  LOOP
    -- Use the tag with highest usage as target, or oldest if usage is same
    target_tag_id := tag_record.tag_ids[1];
    
    -- Update all article_tags to point to the target tag
    UPDATE article_tags 
    SET tag_id = target_tag_id 
    WHERE tag_id = ANY(tag_record.tag_ids[2:]);
    
    -- Delete duplicate tags
    DELETE FROM content_tags 
    WHERE id = ANY(tag_record.tag_ids[2:]);
    
    -- Update usage count for target tag
    UPDATE content_tags 
    SET usage_count = (
      SELECT COUNT(*) 
      FROM article_tags 
      WHERE tag_id = target_tag_id
    )
    WHERE id = target_tag_id;
    
    merged_count := merged_count + array_length(tag_record.tag_ids, 1) - 1;
  END LOOP;
  
  RETURN merged_count;
END;
$$ LANGUAGE plpgsql;

-- Enable similarity extension for text similarity functions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_tags_name_trgm ON content_tags USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_content_tags_usage_created ON content_tags(usage_count DESC, created_at DESC);

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_popular_tags(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_tags(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_related_tags(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION suggest_tags_from_content(text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_unused_tags() TO authenticated;
GRANT EXECUTE ON FUNCTION merge_duplicate_tags() TO authenticated;

-- Add admin policies for tag management
CREATE POLICY "Admins can manage tags"
  ON content_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

-- Allow authenticated users to create tags (for auto-creation during content creation)
CREATE POLICY "Authenticated users can create tags"
  ON content_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger to automatically update tag slugs
CREATE OR REPLACE FUNCTION update_tag_slug()
RETURNS trigger AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := regexp_replace(
      regexp_replace(lower(NEW.name), '[^a-z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tag_slug_trigger
  BEFORE INSERT OR UPDATE ON content_tags
  FOR EACH ROW EXECUTE FUNCTION update_tag_slug();