/*
  # Content Metrics Collection System

  1. New Tables
    - `content_interactions` - Track all user interactions with content
    - `content_metrics` - Simplified metrics table for real-time updates
    - `metrics_aggregation_jobs` - Track background job status

  2. Functions
    - Real-time metrics update functions
    - Background aggregation functions
    - Data retention cleanup functions

  3. Security
    - Enable RLS on all metrics tables
    - Add appropriate policies for metrics access
*/

-- Content interactions table for tracking all user interactions
CREATE TABLE IF NOT EXISTS content_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content_id uuid NOT NULL,
  content_type text CHECK (content_type IN ('article', 'news')) NOT NULL,
  interaction_type text CHECK (interaction_type IN ('view', 'like', 'share', 'bookmark', 'comment', 'click', 'scroll')) NOT NULL,
  interaction_value numeric DEFAULT 1, -- For scroll depth, reading time, etc.
  metadata jsonb DEFAULT '{}', -- Additional interaction data
  session_id uuid, -- Link to reading session
  device_info jsonb DEFAULT '{}',
  referrer text,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Simplified content metrics table for real-time updates
CREATE TABLE IF NOT EXISTS content_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text CHECK (content_type IN ('article', 'news')) NOT NULL,
  content_id uuid NOT NULL,
  metric_type text CHECK (metric_type IN ('view', 'like', 'share', 'bookmark', 'comment', 'read_time', 'engagement_score')) NOT NULL,
  value integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  recorded_at timestamptz DEFAULT now(),
  date date DEFAULT CURRENT_DATE,
  UNIQUE(content_id, content_type, metric_type, date)
);

-- Background job tracking for metrics aggregation
CREATE TABLE IF NOT EXISTS metrics_aggregation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text CHECK (job_type IN ('daily_aggregation', 'weekly_aggregation', 'monthly_aggregation', 'cleanup')) NOT NULL,
  status text CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  processed_records integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all metrics tables
ALTER TABLE content_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_aggregation_jobs ENABLE ROW LEVEL SECURITY;

-- Policies for content_interactions
CREATE POLICY "Users can create their own interactions"
  ON content_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own interactions"
  ON content_interactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all interactions"
  ON content_interactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

-- Policies for content_metrics
CREATE POLICY "Public can view content metrics"
  ON content_metrics
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "System can insert/update metrics"
  ON content_metrics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system')
    )
  );

-- Policies for metrics_aggregation_jobs
CREATE POLICY "Admins can view aggregation jobs"
  ON metrics_aggregation_jobs
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
CREATE INDEX content_interactions_user_idx ON content_interactions(user_id, created_at DESC);
CREATE INDEX content_interactions_content_idx ON content_interactions(content_id, content_type, created_at DESC);
CREATE INDEX content_interactions_type_idx ON content_interactions(interaction_type, created_at DESC);
CREATE INDEX content_interactions_session_idx ON content_interactions(session_id);
CREATE INDEX content_interactions_date_idx ON content_interactions(created_at DESC);

CREATE INDEX content_metrics_content_idx ON content_metrics(content_id, content_type, metric_type);
CREATE INDEX content_metrics_type_date_idx ON content_metrics(metric_type, date DESC);
CREATE INDEX content_metrics_recorded_idx ON content_metrics(recorded_at DESC);

CREATE INDEX metrics_aggregation_jobs_status_idx ON metrics_aggregation_jobs(status, created_at DESC);
CREATE INDEX metrics_aggregation_jobs_type_idx ON metrics_aggregation_jobs(job_type, created_at DESC);

-- Function to update real-time metrics from interactions
CREATE OR REPLACE FUNCTION update_realtime_metrics()
RETURNS trigger AS $$
DECLARE
  metric_record content_metrics%ROWTYPE;
BEGIN
  -- Update or insert metric record
  INSERT INTO content_metrics (
    content_id,
    content_type,
    metric_type,
    value,
    metadata,
    date
  )
  VALUES (
    NEW.content_id,
    NEW.content_type,
    NEW.interaction_type,
    CASE 
      WHEN NEW.interaction_type = 'scroll' THEN NEW.interaction_value::integer
      ELSE 1
    END,
    NEW.metadata,
    CURRENT_DATE
  )
  ON CONFLICT (content_id, content_type, metric_type, date)
  DO UPDATE SET
    value = content_metrics.value + CASE 
      WHEN NEW.interaction_type = 'scroll' THEN NEW.interaction_value::integer
      ELSE 1
    END,
    metadata = content_metrics.metadata || NEW.metadata,
    recorded_at = now();

  -- Update engagement score metric
  IF NEW.interaction_type IN ('like', 'share', 'bookmark', 'comment') THEN
    INSERT INTO content_metrics (
      content_id,
      content_type,
      metric_type,
      value,
      date
    )
    VALUES (
      NEW.content_id,
      NEW.content_type,
      'engagement_score',
      CASE 
        WHEN NEW.interaction_type = 'like' THEN 1
        WHEN NEW.interaction_type = 'share' THEN 3
        WHEN NEW.interaction_type = 'bookmark' THEN 2
        WHEN NEW.interaction_type = 'comment' THEN 5
        ELSE 1
      END,
      CURRENT_DATE
    )
    ON CONFLICT (content_id, content_type, metric_type, date)
    DO UPDATE SET
      value = content_metrics.value + CASE 
        WHEN NEW.interaction_type = 'like' THEN 1
        WHEN NEW.interaction_type = 'share' THEN 3
        WHEN NEW.interaction_type = 'bookmark' THEN 2
        WHEN NEW.interaction_type = 'comment' THEN 5
        ELSE 1
      END,
      recorded_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update real-time metrics
CREATE TRIGGER content_interactions_update_metrics
  AFTER INSERT ON content_interactions
  FOR EACH ROW EXECUTE FUNCTION update_realtime_metrics();

-- Function to aggregate daily metrics
CREATE OR REPLACE FUNCTION aggregate_daily_metrics(target_date date DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void AS $$
DECLARE
  job_id uuid;
  processed_count integer := 0;
BEGIN
  -- Create job record
  INSERT INTO metrics_aggregation_jobs (job_type, status, started_at)
  VALUES ('daily_aggregation', 'running', now())
  RETURNING id INTO job_id;

  BEGIN
    -- Aggregate interaction metrics into content_analytics
    INSERT INTO content_analytics (
      content_id,
      content_type,
      date,
      views,
      likes,
      shares,
      bookmarks,
      comments,
      engagement_score,
      created_at,
      updated_at
    )
    SELECT 
      cm.content_id,
      cm.content_type,
      target_date,
      COALESCE(MAX(CASE WHEN cm.metric_type = 'view' THEN cm.value END), 0) as views,
      COALESCE(MAX(CASE WHEN cm.metric_type = 'like' THEN cm.value END), 0) as likes,
      COALESCE(MAX(CASE WHEN cm.metric_type = 'share' THEN cm.value END), 0) as shares,
      COALESCE(MAX(CASE WHEN cm.metric_type = 'bookmark' THEN cm.value END), 0) as bookmarks,
      COALESCE(MAX(CASE WHEN cm.metric_type = 'comment' THEN cm.value END), 0) as comments,
      COALESCE(MAX(CASE WHEN cm.metric_type = 'engagement_score' THEN cm.value END), 0) as engagement_score,
      now(),
      now()
    FROM content_metrics cm
    WHERE cm.date = target_date
    GROUP BY cm.content_id, cm.content_type
    ON CONFLICT (content_id, content_type, date)
    DO UPDATE SET
      views = EXCLUDED.views,
      likes = EXCLUDED.likes,
      shares = EXCLUDED.shares,
      bookmarks = EXCLUDED.bookmarks,
      comments = EXCLUDED.comments,
      engagement_score = EXCLUDED.engagement_score,
      updated_at = now();

    GET DIAGNOSTICS processed_count = ROW_COUNT;

    -- Update job status
    UPDATE metrics_aggregation_jobs
    SET status = 'completed',
        completed_at = now(),
        processed_records = processed_count
    WHERE id = job_id;

  EXCEPTION WHEN OTHERS THEN
    -- Update job status on error
    UPDATE metrics_aggregation_jobs
    SET status = 'failed',
        completed_at = now(),
        error_message = SQLERRM
    WHERE id = job_id;
    
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old metrics data
CREATE OR REPLACE FUNCTION cleanup_old_metrics(retention_days integer DEFAULT 90)
RETURNS void AS $$
DECLARE
  job_id uuid;
  deleted_count integer := 0;
BEGIN
  -- Create job record
  INSERT INTO metrics_aggregation_jobs (job_type, status, started_at)
  VALUES ('cleanup', 'running', now())
  RETURNING id INTO job_id;

  BEGIN
    -- Delete old content_interactions (keep detailed data for retention_days)
    DELETE FROM content_interactions
    WHERE created_at < CURRENT_DATE - INTERVAL '1 day' * retention_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Delete old content_metrics (keep daily aggregates for longer)
    DELETE FROM content_metrics
    WHERE recorded_at < CURRENT_DATE - INTERVAL '1 day' * (retention_days * 2);

    -- Delete old job records (keep for 30 days)
    DELETE FROM metrics_aggregation_jobs
    WHERE created_at < CURRENT_DATE - INTERVAL '30 days'
      AND status IN ('completed', 'failed');

    -- Update job status
    UPDATE metrics_aggregation_jobs
    SET status = 'completed',
        completed_at = now(),
        processed_records = deleted_count
    WHERE id = job_id;

  EXCEPTION WHEN OTHERS THEN
    -- Update job status on error
    UPDATE metrics_aggregation_jobs
    SET status = 'failed',
        completed_at = now(),
        error_message = SQLERRM
    WHERE id = job_id;
    
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to get real-time metrics for content
CREATE OR REPLACE FUNCTION get_content_metrics(
  p_content_id uuid,
  p_content_type text,
  p_date_from date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_date_to date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  metric_type text,
  total_value bigint,
  daily_values jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.metric_type,
    SUM(cm.value)::bigint as total_value,
    jsonb_object_agg(cm.date::text, cm.value ORDER BY cm.date) as daily_values
  FROM content_metrics cm
  WHERE cm.content_id = p_content_id
    AND cm.content_type = p_content_type
    AND cm.date BETWEEN p_date_from AND p_date_to
  GROUP BY cm.metric_type
  ORDER BY cm.metric_type;
END;
$$ LANGUAGE plpgsql;

-- Function to get trending content based on real-time metrics
CREATE OR REPLACE FUNCTION get_trending_content(
  p_content_type text DEFAULT NULL,
  p_limit integer DEFAULT 10,
  p_hours integer DEFAULT 24
)
RETURNS TABLE (
  content_id uuid,
  content_type text,
  trending_score numeric,
  recent_views bigint,
  recent_engagement bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.content_id,
    cm.content_type,
    -- Calculate trending score based on recent activity
    (
      COALESCE(views.value, 0) * 1.0 +
      COALESCE(engagement.value, 0) * 5.0
    ) * (1.0 - (EXTRACT(EPOCH FROM (now() - cm.recorded_at)) / 3600.0 / p_hours)) as trending_score,
    COALESCE(views.value, 0)::bigint as recent_views,
    COALESCE(engagement.value, 0)::bigint as recent_engagement
  FROM (
    SELECT DISTINCT content_id, content_type, MAX(recorded_at) as recorded_at
    FROM content_metrics
    WHERE recorded_at >= now() - INTERVAL '1 hour' * p_hours
      AND (p_content_type IS NULL OR content_type = p_content_type)
    GROUP BY content_id, content_type
  ) cm
  LEFT JOIN (
    SELECT content_id, content_type, SUM(value) as value
    FROM content_metrics
    WHERE metric_type = 'view'
      AND recorded_at >= now() - INTERVAL '1 hour' * p_hours
    GROUP BY content_id, content_type
  ) views ON cm.content_id = views.content_id AND cm.content_type = views.content_type
  LEFT JOIN (
    SELECT content_id, content_type, SUM(value) as value
    FROM content_metrics
    WHERE metric_type = 'engagement_score'
      AND recorded_at >= now() - INTERVAL '1 hour' * p_hours
    GROUP BY content_id, content_type
  ) engagement ON cm.content_id = engagement.content_id AND cm.content_type = engagement.content_type
  WHERE (
    COALESCE(views.value, 0) * 1.0 +
    COALESCE(engagement.value, 0) * 5.0
  ) > 0
  ORDER BY trending_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;