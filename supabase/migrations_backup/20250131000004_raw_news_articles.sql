/*
  # Raw News Articles Storage

  1. New Tables
    - `raw_news_articles` - Temporary storage for articles before AI processing
    - `news_aggregation_jobs` - Track aggregation job status

  2. Security
    - Enable RLS on all new tables
    - Add appropriate policies for each table
*/

-- Raw news articles table (temporary storage before AI processing)
CREATE TABLE IF NOT EXISTS raw_news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  summary text,
  url text UNIQUE NOT NULL,
  published_at timestamptz NOT NULL,
  author text,
  image_url text,
  source_id uuid REFERENCES news_sources(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}',
  quality_score numeric(5,2),
  quality_issues text[],
  is_processed boolean DEFAULT false,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- News aggregation jobs table
CREATE TABLE IF NOT EXISTS news_aggregation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text CHECK (job_type IN ('fetch', 'process', 'cleanup')) NOT NULL DEFAULT 'fetch',
  status text CHECK (status IN ('pending', 'running', 'completed', 'failed')) NOT NULL DEFAULT 'pending',
  source_id uuid REFERENCES news_sources(id) ON DELETE CASCADE,
  started_at timestamptz,
  completed_at timestamptz,
  articles_fetched integer DEFAULT 0,
  articles_processed integer DEFAULT 0,
  articles_published integer DEFAULT 0,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE raw_news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_aggregation_jobs ENABLE ROW LEVEL SECURITY;

-- Policies for raw_news_articles
CREATE POLICY "Admins can manage raw news articles"
  ON raw_news_articles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

-- Policies for news_aggregation_jobs
CREATE POLICY "Admins can view aggregation jobs"
  ON news_aggregation_jobs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS raw_news_articles_url_idx ON raw_news_articles(url);
CREATE INDEX IF NOT EXISTS raw_news_articles_source_id_idx ON raw_news_articles(source_id);
CREATE INDEX IF NOT EXISTS raw_news_articles_published_at_idx ON raw_news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS raw_news_articles_is_processed_idx ON raw_news_articles(is_processed, created_at);
CREATE INDEX IF NOT EXISTS raw_news_articles_quality_score_idx ON raw_news_articles(quality_score DESC);

CREATE INDEX IF NOT EXISTS news_aggregation_jobs_status_idx ON news_aggregation_jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS news_aggregation_jobs_source_id_idx ON news_aggregation_jobs(source_id);
CREATE INDEX IF NOT EXISTS news_aggregation_jobs_job_type_idx ON news_aggregation_jobs(job_type, status);

-- Function to get unprocessed articles for AI processing
CREATE OR REPLACE FUNCTION get_unprocessed_articles(limit_count integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  summary text,
  url text,
  published_at timestamptz,
  author text,
  image_url text,
  source_id uuid,
  source_name text,
  source_categories text[],
  metadata jsonb,
  quality_score numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ra.id,
    ra.title,
    ra.content,
    ra.summary,
    ra.url,
    ra.published_at,
    ra.author,
    ra.image_url,
    ra.source_id,
    ns.name as source_name,
    ns.categories as source_categories,
    ra.metadata,
    ra.quality_score
  FROM raw_news_articles ra
  JOIN news_sources ns ON ra.source_id = ns.id
  WHERE ra.is_processed = false
  AND ra.quality_score >= 50 -- Only process articles with decent quality
  ORDER BY ra.quality_score DESC, ra.published_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to mark articles as processed
CREATE OR REPLACE FUNCTION mark_articles_processed(article_ids uuid[])
RETURNS void AS $$
BEGIN
  UPDATE raw_news_articles 
  SET 
    is_processed = true,
    processed_at = now()
  WHERE id = ANY(article_ids);
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old processed articles (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_raw_articles()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM raw_news_articles 
  WHERE is_processed = true 
  AND processed_at < (now() - interval '7 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get aggregation job statistics
CREATE OR REPLACE FUNCTION get_aggregation_stats(days_back integer DEFAULT 7)
RETURNS TABLE (
  total_jobs integer,
  completed_jobs integer,
  failed_jobs integer,
  total_articles_fetched bigint,
  total_articles_processed bigint,
  avg_processing_time interval
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::integer as total_jobs,
    COUNT(*) FILTER (WHERE status = 'completed')::integer as completed_jobs,
    COUNT(*) FILTER (WHERE status = 'failed')::integer as failed_jobs,
    COALESCE(SUM(articles_fetched), 0) as total_articles_fetched,
    COALESCE(SUM(articles_processed), 0) as total_articles_processed,
    AVG(completed_at - started_at) FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL) as avg_processing_time
  FROM news_aggregation_jobs
  WHERE created_at >= (now() - (days_back || ' days')::interval);
END;
$$ LANGUAGE plpgsql;