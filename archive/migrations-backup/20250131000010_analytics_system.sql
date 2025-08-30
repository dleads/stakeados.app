/*
  # Analytics and Metrics System

  1. New Tables
    - `content_analytics` - Track detailed content performance metrics
    - `user_reading_sessions` - Track reading behavior and sessions
    - `content_performance_snapshots` - Daily/weekly performance snapshots
    - `trending_content` - Track trending content over time
    - `author_analytics` - Author-specific performance metrics
    - `editorial_analytics` - Editorial team performance metrics

  2. Functions
    - Analytics calculation functions
    - Performance tracking functions
    - Trending algorithm functions

  3. Security
    - Enable RLS on all analytics tables
    - Add appropriate policies for analytics access
*/

-- Content analytics table for detailed performance tracking
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
  completion_rate numeric(5,2) DEFAULT 0, -- Percentage of content read
  bounce_rate numeric(5,2) DEFAULT 0,
  engagement_score numeric(8,2) DEFAULT 0,
  trending_score numeric(8,2) DEFAULT 0,
  referrer_data jsonb DEFAULT '{}', -- Track where traffic comes from
  device_data jsonb DEFAULT '{}', -- Track device/browser stats
  location_data jsonb DEFAULT '{}', -- Track geographic data
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(content_id, content_type, date)
);

-- User reading sessions for behavior analysis
CREATE TABLE IF NOT EXISTS user_reading_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content_id uuid NOT NULL,
  content_type text CHECK (content_type IN ('article', 'news')) NOT NULL,
  session_start timestamptz DEFAULT now(),
  session_end timestamptz,
  reading_time integer DEFAULT 0, -- in seconds
  scroll_depth numeric(5,2) DEFAULT 0, -- percentage scrolled
  interactions jsonb DEFAULT '{}', -- clicks, highlights, etc.
  device_info jsonb DEFAULT '{}',
  referrer text,
  exit_point text, -- where user left the content
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Content performance snapshots for historical tracking
CREATE TABLE IF NOT EXISTS content_performance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  content_type text CHECK (content_type IN ('article', 'news')) NOT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  period_type text CHECK (period_type IN ('daily', 'weekly', 'monthly')) NOT NULL,
  total_views integer DEFAULT 0,
  unique_views integer DEFAULT 0,
  total_engagement integer DEFAULT 0,
  average_rating numeric(3,2) DEFAULT 0,
  performance_rank integer,
  category_rank integer,
  author_rank integer,
  metrics jsonb DEFAULT '{}', -- Additional flexible metrics
  created_at timestamptz DEFAULT now(),
  UNIQUE(content_id, content_type, snapshot_date, period_type)
);

-- Trending content tracking
CREATE TABLE IF NOT EXISTS trending_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  content_type text CHECK (content_type IN ('article', 'news')) NOT NULL,
  trending_date date NOT NULL DEFAULT CURRENT_DATE,
  trending_score numeric(8,2) NOT NULL,
  velocity_score numeric(8,2) DEFAULT 0, -- Rate of engagement increase
  category text,
  tags text[],
  rank_position integer,
  previous_rank integer,
  rank_change integer DEFAULT 0,
  trending_duration integer DEFAULT 1, -- days trending
  peak_score numeric(8,2),
  created_at timestamptz DEFAULT now(),
  UNIQUE(content_id, content_type, trending_date)
);

-- Author analytics for performance tracking
CREATE TABLE IF NOT EXISTS author_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  period_type text CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')) NOT NULL,
  articles_published integer DEFAULT 0,
  total_views integer DEFAULT 0,
  total_engagement integer DEFAULT 0,
  average_rating numeric(3,2) DEFAULT 0,
  trending_articles integer DEFAULT 0,
  top_performing_article uuid,
  engagement_rate numeric(5,2) DEFAULT 0,
  follower_growth integer DEFAULT 0,
  points_earned integer DEFAULT 0,
  rank_position integer,
  performance_metrics jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(author_id, period_start, period_end, period_type)
);

-- Editorial analytics for team performance
CREATE TABLE IF NOT EXISTS editorial_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  editor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  period_type text CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly')) NOT NULL,
  articles_reviewed integer DEFAULT 0,
  articles_approved integer DEFAULT 0,
  articles_rejected integer DEFAULT 0,
  average_review_time numeric(8,2) DEFAULT 0, -- in hours
  quality_score numeric(5,2) DEFAULT 0,
  feedback_quality_rating numeric(3,2) DEFAULT 0,
  proposals_processed integer DEFAULT 0,
  content_moderated integer DEFAULT 0,
  performance_metrics jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(editor_id, period_start, period_end, period_type)
);

-- Enable RLS on all analytics tables
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE author_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for content_analytics (admins and content creators can view)
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

CREATE POLICY "Authors can view their own content analytics"
  ON content_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM articles 
      WHERE id = content_analytics.content_id::uuid 
      AND author_id = auth.uid()
      AND content_analytics.content_type = 'article'
    )
  );

-- Policies for user_reading_sessions
CREATE POLICY "Users can view their own reading sessions"
  ON user_reading_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reading sessions"
  ON user_reading_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading sessions"
  ON user_reading_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for content_performance_snapshots (read-only for most users)
CREATE POLICY "Public can view performance snapshots"
  ON content_performance_snapshots
  FOR SELECT
  TO public
  USING (true);

-- Policies for trending_content (public read)
CREATE POLICY "Public can view trending content"
  ON trending_content
  FOR SELECT
  TO public
  USING (true);

-- Policies for author_analytics
CREATE POLICY "Authors can view their own analytics"
  ON author_analytics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can view all author analytics"
  ON author_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

-- Policies for editorial_analytics
CREATE POLICY "Editors can view their own analytics"
  ON editorial_analytics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = editor_id);

CREATE POLICY "Admins can view all editorial analytics"
  ON editorial_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX content_analytics_content_date_idx ON content_analytics(content_id, content_type, date DESC);
CREATE INDEX content_analytics_date_idx ON content_analytics(date DESC);
CREATE INDEX content_analytics_engagement_idx ON content_analytics(engagement_score DESC);
CREATE INDEX content_analytics_trending_idx ON content_analytics(trending_score DESC);

CREATE INDEX user_reading_sessions_user_idx ON user_reading_sessions(user_id, created_at DESC);
CREATE INDEX user_reading_sessions_content_idx ON user_reading_sessions(content_id, content_type);
CREATE INDEX user_reading_sessions_date_idx ON user_reading_sessions(session_start DESC);

CREATE INDEX content_performance_snapshots_content_idx ON content_performance_snapshots(content_id, content_type, snapshot_date DESC);
CREATE INDEX content_performance_snapshots_period_idx ON content_performance_snapshots(period_type, snapshot_date DESC);

CREATE INDEX trending_content_date_score_idx ON trending_content(trending_date DESC, trending_score DESC);
CREATE INDEX trending_content_category_idx ON trending_content(category, trending_date DESC);
CREATE INDEX trending_content_rank_idx ON trending_content(rank_position, trending_date DESC);

CREATE INDEX author_analytics_author_period_idx ON author_analytics(author_id, period_start DESC);
CREATE INDEX author_analytics_performance_idx ON author_analytics(period_type, total_engagement DESC);

CREATE INDEX editorial_analytics_editor_period_idx ON editorial_analytics(editor_id, period_start DESC);
CREATE INDEX editorial_analytics_performance_idx ON editorial_analytics(period_type, quality_score DESC);

-- Triggers for updated_at
CREATE TRIGGER content_analytics_updated_at
  BEFORE UPDATE ON content_analytics
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  views integer,
  likes integer,
  shares integer,
  bookmarks integer,
  comments integer,
  avg_reading_time numeric,
  completion_rate numeric
) RETURNS numeric AS $$
BEGIN
  -- Weighted engagement score calculation
  RETURN (
    (views * 1.0) +
    (likes * 5.0) +
    (shares * 10.0) +
    (bookmarks * 8.0) +
    (comments * 15.0) +
    (avg_reading_time * 0.1) +
    (completion_rate * 2.0)
  );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate trending score
CREATE OR REPLACE FUNCTION calculate_trending_score(
  recent_views integer,
  recent_engagement integer,
  velocity numeric,
  recency_hours integer
) RETURNS numeric AS $$
DECLARE
  time_decay numeric;
  base_score numeric;
BEGIN
  -- Time decay factor (content gets less trending over time)
  time_decay := GREATEST(0.1, 1.0 - (recency_hours::numeric / 168.0)); -- 168 hours = 1 week
  
  -- Base score from engagement
  base_score := (recent_views * 1.0) + (recent_engagement * 5.0);
  
  -- Apply velocity multiplier and time decay
  RETURN base_score * (1.0 + velocity) * time_decay;
END;
$$ LANGUAGE plpgsql;

-- Function to update content analytics from interactions
CREATE OR REPLACE FUNCTION update_content_analytics()
RETURNS trigger AS $$
DECLARE
  analytics_record content_analytics%ROWTYPE;
BEGIN
  -- Get or create analytics record for today
  SELECT * INTO analytics_record
  FROM content_analytics
  WHERE content_id = NEW.content_id::uuid
    AND content_type = NEW.content_type
    AND date = CURRENT_DATE;
  
  IF NOT FOUND THEN
    INSERT INTO content_analytics (content_id, content_type, date)
    VALUES (NEW.content_id::uuid, NEW.content_type, CURRENT_DATE);
    
    SELECT * INTO analytics_record
    FROM content_analytics
    WHERE content_id = NEW.content_id::uuid
      AND content_type = NEW.content_type
      AND date = CURRENT_DATE;
  END IF;
  
  -- Update counters based on interaction type
  IF NEW.interaction_type = 'view' THEN
    UPDATE content_analytics
    SET views = views + 1,
        updated_at = now()
    WHERE id = analytics_record.id;
  ELSIF NEW.interaction_type = 'like' THEN
    UPDATE content_analytics
    SET likes = likes + 1,
        updated_at = now()
    WHERE id = analytics_record.id;
  ELSIF NEW.interaction_type = 'share' THEN
    UPDATE content_analytics
    SET shares = shares + 1,
        updated_at = now()
    WHERE id = analytics_record.id;
  ELSIF NEW.interaction_type = 'bookmark' THEN
    UPDATE content_analytics
    SET bookmarks = bookmarks + 1,
        updated_at = now()
    WHERE id = analytics_record.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update analytics from content interactions
CREATE TRIGGER content_interactions_update_analytics
  AFTER INSERT ON content_interactions
  FOR EACH ROW EXECUTE FUNCTION update_content_analytics();

-- Function to update analytics from reading sessions
CREATE OR REPLACE FUNCTION update_analytics_from_session()
RETURNS trigger AS $$
BEGIN
  -- Only process completed sessions
  IF NEW.session_end IS NOT NULL AND OLD.session_end IS NULL THEN
    -- Update content analytics with reading time and completion data
    UPDATE content_analytics
    SET average_reading_time = (
          SELECT AVG(reading_time)
          FROM user_reading_sessions
          WHERE content_id = NEW.content_id
            AND content_type = NEW.content_type
            AND session_end IS NOT NULL
        ),
        completion_rate = (
          SELECT AVG(CASE WHEN completed THEN 100.0 ELSE scroll_depth END)
          FROM user_reading_sessions
          WHERE content_id = NEW.content_id
            AND content_type = NEW.content_type
            AND session_end IS NOT NULL
        ),
        updated_at = now()
    WHERE content_id = NEW.content_id::uuid
      AND content_type = NEW.content_type
      AND date = CURRENT_DATE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update analytics from reading sessions
CREATE TRIGGER reading_sessions_update_analytics
  AFTER UPDATE ON user_reading_sessions
  FOR EACH ROW EXECUTE FUNCTION update_analytics_from_session();

-- Function to generate daily performance snapshots
CREATE OR REPLACE FUNCTION generate_daily_snapshots()
RETURNS void AS $$
BEGIN
  INSERT INTO content_performance_snapshots (
    content_id,
    content_type,
    snapshot_date,
    period_type,
    total_views,
    unique_views,
    total_engagement,
    performance_rank
  )
  SELECT 
    ca.content_id,
    ca.content_type,
    CURRENT_DATE - INTERVAL '1 day',
    'daily',
    ca.views,
    ca.unique_views,
    ca.likes + ca.shares + ca.bookmarks + ca.comments,
    ROW_NUMBER() OVER (
      PARTITION BY ca.content_type 
      ORDER BY ca.engagement_score DESC
    )
  FROM content_analytics ca
  WHERE ca.date = CURRENT_DATE - INTERVAL '1 day'
  ON CONFLICT (content_id, content_type, snapshot_date, period_type) 
  DO UPDATE SET
    total_views = EXCLUDED.total_views,
    unique_views = EXCLUDED.unique_views,
    total_engagement = EXCLUDED.total_engagement,
    performance_rank = EXCLUDED.performance_rank;
END;
$$ LANGUAGE plpgsql;

-- Function to update trending content
CREATE OR REPLACE FUNCTION update_trending_content()
RETURNS void AS $$
BEGIN
  -- Calculate trending scores for the last 24 hours
  INSERT INTO trending_content (
    content_id,
    content_type,
    trending_date,
    trending_score,
    velocity_score,
    category,
    rank_position
  )
  SELECT 
    ca.content_id,
    ca.content_type,
    CURRENT_DATE,
    calculate_trending_score(
      ca.views,
      ca.likes + ca.shares + ca.bookmarks,
      COALESCE(
        (ca.views - COALESCE(prev_ca.views, 0))::numeric / NULLIF(prev_ca.views, 0),
        0
      ),
      EXTRACT(EPOCH FROM (now() - ca.created_at)) / 3600
    ),
    COALESCE(
      (ca.views - COALESCE(prev_ca.views, 0))::numeric / NULLIF(prev_ca.views, 0),
      0
    ),
    CASE 
      WHEN ca.content_type = 'article' THEN (
        SELECT cc.slug
        FROM articles a
        JOIN article_categories ac ON a.id = ac.article_id
        JOIN content_categories cc ON ac.category_id = cc.id
        WHERE a.id = ca.content_id
        LIMIT 1
      )
      ELSE 'news'
    END,
    ROW_NUMBER() OVER (
      PARTITION BY ca.content_type 
      ORDER BY calculate_trending_score(
        ca.views,
        ca.likes + ca.shares + ca.bookmarks,
        COALESCE(
          (ca.views - COALESCE(prev_ca.views, 0))::numeric / NULLIF(prev_ca.views, 0),
          0
        ),
        EXTRACT(EPOCH FROM (now() - ca.created_at)) / 3600
      ) DESC
    )
  FROM content_analytics ca
  LEFT JOIN content_analytics prev_ca ON (
    prev_ca.content_id = ca.content_id 
    AND prev_ca.content_type = ca.content_type 
    AND prev_ca.date = ca.date - INTERVAL '1 day'
  )
  WHERE ca.date = CURRENT_DATE
    AND ca.views > 0
  ON CONFLICT (content_id, content_type, trending_date)
  DO UPDATE SET
    trending_score = EXCLUDED.trending_score,
    velocity_score = EXCLUDED.velocity_score,
    rank_position = EXCLUDED.rank_position;
END;
$$ LANGUAGE plpgsql;