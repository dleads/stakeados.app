-- Create article_history table for tracking changes and versions
CREATE TABLE IF NOT EXISTS article_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES profiles(id),
    change_type TEXT CHECK (change_type IN ('created', 'updated', 'status_changed', 'published', 'archived', 'scheduled', 'schedule_updated', 'schedule_cancelled')),
    old_values JSONB,
    new_values JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE article_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for article_history
CREATE POLICY "Editors can view article history"
  ON article_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

CREATE POLICY "System can create article history entries"
  ON article_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    changed_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- Indexes for performance
CREATE INDEX article_history_article_id_idx ON article_history(article_id, created_at DESC);
CREATE INDEX article_history_changed_by_idx ON article_history(changed_by, created_at DESC);
CREATE INDEX article_history_change_type_idx ON article_history(change_type, created_at DESC);

-- Enhance article_schedules table with additional columns if they don't exist
ALTER TABLE article_schedules 
ADD COLUMN IF NOT EXISTS recurring_pattern TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Create content_metrics table for analytics data
CREATE TABLE IF NOT EXISTS content_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT CHECK (content_type IN ('article', 'news')) NOT NULL,
    content_id UUID NOT NULL,
    metric_type TEXT NOT NULL, -- 'view', 'like', 'share', 'read_time', 'engagement'
    value INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    date_bucket DATE GENERATED ALWAYS AS (DATE(recorded_at)) STORED
);

-- Enable RLS for content_metrics
ALTER TABLE content_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_metrics
CREATE POLICY "Anyone can view content metrics"
  ON content_metrics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create metrics entries"
  ON content_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Indexes for content_metrics
CREATE INDEX content_metrics_content_idx ON content_metrics(content_id, content_type, recorded_at DESC);
CREATE INDEX content_metrics_type_idx ON content_metrics(metric_type, recorded_at DESC);
CREATE INDEX content_metrics_date_bucket_idx ON content_metrics(date_bucket, content_type);

-- Function to automatically create article history entries on article changes
CREATE OR REPLACE FUNCTION track_article_changes()
RETURNS trigger AS $$
BEGIN
  -- Track article updates
  IF TG_OP = 'UPDATE' THEN
    -- Determine change type based on what changed
    DECLARE
      change_type_val TEXT := 'updated';
    BEGIN
      IF OLD.status IS DISTINCT FROM NEW.status THEN
        change_type_val := 'status_changed';
        IF NEW.status = 'published' AND OLD.status != 'published' THEN
          change_type_val := 'published';
        ELSIF NEW.status = 'archived' THEN
          change_type_val := 'archived';
        END IF;
      END IF;

      INSERT INTO article_history (
        article_id, 
        changed_by, 
        change_type, 
        old_values, 
        new_values,
        notes
      ) VALUES (
        NEW.id,
        auth.uid(),
        change_type_val,
        to_jsonb(OLD),
        to_jsonb(NEW),
        CASE 
          WHEN change_type_val = 'status_changed' THEN 
            'Status changed from ' || COALESCE(OLD.status, 'none') || ' to ' || NEW.status
          ELSE 'Article updated'
        END
      );
    END;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO article_history (
      article_id, 
      changed_by, 
      change_type, 
      old_values, 
      new_values,
      notes
    ) VALUES (
      NEW.id,
      auth.uid(),
      'created',
      NULL,
      to_jsonb(NEW),
      'Article created'
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the trigger to articles table
DROP TRIGGER IF EXISTS articles_history_tracking ON articles;
CREATE TRIGGER articles_history_tracking
  AFTER INSERT OR UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION track_article_changes();

-- Function to clean up old history entries (keep last 1000 per article)
CREATE OR REPLACE FUNCTION cleanup_article_history()
RETURNS void AS $$
DECLARE
  article_record RECORD;
BEGIN
  FOR article_record IN 
    SELECT DISTINCT article_id FROM article_history
  LOOP
    DELETE FROM article_history 
    WHERE article_id = article_record.article_id 
    AND id NOT IN (
      SELECT id FROM article_history 
      WHERE article_id = article_record.article_id 
      ORDER BY created_at DESC 
      LIMIT 1000
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get article statistics for admin dashboard
CREATE OR REPLACE FUNCTION get_article_admin_stats()
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_articles', COUNT(*),
    'published', COUNT(*) FILTER (WHERE status = 'published'),
    'draft', COUNT(*) FILTER (WHERE status = 'draft'),
    'review', COUNT(*) FILTER (WHERE status = 'review'),
    'archived', COUNT(*) FILTER (WHERE status = 'archived'),
    'scheduled', (
      SELECT COUNT(*) FROM article_schedules 
      WHERE status = 'scheduled' AND scheduled_at > NOW()
    ),
    'this_week', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'),
    'this_month', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')
  ) INTO stats
  FROM articles;

  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;