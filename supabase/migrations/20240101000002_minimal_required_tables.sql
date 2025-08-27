-- Minimal migration to add only the tables required for the build

-- Add missing columns to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS views integer DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS reading_time integer DEFAULT 0;

-- Create content_metrics table (required for analytics)
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

-- Create content_analytics table (required for analytics)
CREATE TABLE IF NOT EXISTS content_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  content_type text CHECK (content_type IN ('article', 'news')) NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  views integer DEFAULT 0,
  unique_views integer DEFAULT 0,
  likes integer DEFAULT 0,
  shares integer DEFAULT 0,
  bookmarks integer DEFAULT 0,
  comments integer DEFAULT 0,
  average_reading_time numeric(8,2) DEFAULT 0,
  completion_rate numeric(5,2) DEFAULT 0,
  bounce_rate numeric(5,2) DEFAULT 0,
  engagement_score numeric(8,2) DEFAULT 0,
  trending_score numeric(8,2) DEFAULT 0,
  referrer_data jsonb DEFAULT '{}',
  device_data jsonb DEFAULT '{}',
  location_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(content_id, content_type, date)
);

-- Enable RLS
ALTER TABLE content_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;

-- Basic policies for content_metrics
CREATE POLICY "Public can view content metrics"
  ON content_metrics
  FOR SELECT
  TO public
  USING (true);

-- Basic policies for content_analytics
CREATE POLICY "Admins can view all content analytics"
  ON content_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

-- Basic indexes
CREATE INDEX IF NOT EXISTS content_metrics_content_idx ON content_metrics(content_id, content_type, metric_type);
CREATE INDEX IF NOT EXISTS content_analytics_content_date_idx ON content_analytics(content_id, content_type, date DESC);
