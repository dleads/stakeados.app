-- Monitoring and Alerting System Tables
-- Stores metrics, alerts, and system health data

-- Monitoring metrics table
CREATE TABLE IF NOT EXISTS monitoring_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  value DECIMAL NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  tags JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System alerts table
CREATE TABLE IF NOT EXISTS system_alerts (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  metric TEXT NOT NULL,
  value DECIMAL NOT NULL,
  threshold DECIMAL NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert rules configuration table
CREATE TABLE IF NOT EXISTS alert_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  metric TEXT NOT NULL,
  condition TEXT CHECK (condition IN ('gt', 'lt', 'eq', 'gte', 'lte')) NOT NULL,
  threshold DECIMAL NOT NULL,
  duration INTEGER NOT NULL, -- seconds
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
  channels JSONB DEFAULT '[]', -- array of notification channels
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System health snapshots table
CREATE TABLE IF NOT EXISTS system_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT CHECK (status IN ('healthy', 'degraded', 'unhealthy')) NOT NULL,
  active_alerts INTEGER DEFAULT 0,
  critical_alerts INTEGER DEFAULT 0,
  performance_score DECIMAL DEFAULT 100.0,
  uptime_percentage DECIMAL DEFAULT 100.0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics aggregation table
CREATE TABLE IF NOT EXISTS performance_metrics_hourly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hour_bucket TIMESTAMP WITH TIME ZONE NOT NULL,
  metric_name TEXT NOT NULL,
  avg_value DECIMAL,
  min_value DECIMAL,
  max_value DECIMAL,
  count_value INTEGER,
  sum_value DECIMAL,
  tags JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hour_bucket, metric_name, tags)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_name_timestamp 
ON monitoring_metrics(name, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_timestamp 
ON monitoring_metrics(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_tags 
ON monitoring_metrics USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved_timestamp 
ON system_alerts(resolved, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_system_alerts_severity_timestamp 
ON system_alerts(severity, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_system_alerts_rule_id 
ON system_alerts(rule_id);

CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled 
ON alert_rules(enabled) WHERE enabled = TRUE;

CREATE INDEX IF NOT EXISTS idx_performance_metrics_hourly_bucket 
ON performance_metrics_hourly(hour_bucket DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_hourly_name 
ON performance_metrics_hourly(metric_name, hour_bucket DESC);

-- Functions for metrics aggregation
CREATE OR REPLACE FUNCTION aggregate_metrics_hourly()
RETURNS VOID AS $$
BEGIN
  -- Aggregate metrics into hourly buckets
  INSERT INTO performance_metrics_hourly (
    hour_bucket,
    metric_name,
    avg_value,
    min_value,
    max_value,
    count_value,
    sum_value,
    tags
  )
  SELECT 
    date_trunc('hour', timestamp) as hour_bucket,
    name as metric_name,
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    COUNT(*) as count_value,
    SUM(value) as sum_value,
    tags
  FROM monitoring_metrics
  WHERE timestamp >= NOW() - INTERVAL '2 hours'
    AND timestamp < date_trunc('hour', NOW())
  GROUP BY date_trunc('hour', timestamp), name, tags
  ON CONFLICT (hour_bucket, metric_name, tags) 
  DO UPDATE SET
    avg_value = EXCLUDED.avg_value,
    min_value = EXCLUDED.min_value,
    max_value = EXCLUDED.max_value,
    count_value = EXCLUDED.count_value,
    sum_value = EXCLUDED.sum_value;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate system health score
CREATE OR REPLACE FUNCTION calculate_system_health_score()
RETURNS DECIMAL AS $$
DECLARE
  health_score DECIMAL := 100.0;
  critical_alerts INTEGER;
  high_alerts INTEGER;
  medium_alerts INTEGER;
  avg_response_time DECIMAL;
  error_rate DECIMAL;
BEGIN
  -- Count active alerts by severity
  SELECT 
    COUNT(*) FILTER (WHERE severity = 'critical'),
    COUNT(*) FILTER (WHERE severity = 'high'),
    COUNT(*) FILTER (WHERE severity = 'medium')
  INTO critical_alerts, high_alerts, medium_alerts
  FROM system_alerts
  WHERE resolved = FALSE;

  -- Deduct points for alerts
  health_score := health_score - (critical_alerts * 30) - (high_alerts * 15) - (medium_alerts * 5);

  -- Get recent performance metrics
  SELECT AVG(value) INTO avg_response_time
  FROM monitoring_metrics
  WHERE name = 'api_response_time_ms'
    AND timestamp >= NOW() - INTERVAL '1 hour';

  SELECT AVG(value) INTO error_rate
  FROM monitoring_metrics
  WHERE name = 'api_error_count'
    AND timestamp >= NOW() - INTERVAL '1 hour';

  -- Deduct points for poor performance
  IF avg_response_time > 1000 THEN
    health_score := health_score - 10;
  END IF;

  IF error_rate > 0.05 THEN -- 5% error rate
    health_score := health_score - 15;
  END IF;

  -- Ensure score doesn't go below 0
  health_score := GREATEST(health_score, 0);

  RETURN health_score;
END;
$$ LANGUAGE plpgsql;

-- Function to create system health snapshot
CREATE OR REPLACE FUNCTION create_health_snapshot()
RETURNS VOID AS $$
DECLARE
  active_alerts_count INTEGER;
  critical_alerts_count INTEGER;
  health_score DECIMAL;
  system_status TEXT;
BEGIN
  -- Count alerts
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE severity = 'critical')
  INTO active_alerts_count, critical_alerts_count
  FROM system_alerts
  WHERE resolved = FALSE;

  -- Calculate health score
  health_score := calculate_system_health_score();

  -- Determine system status
  IF critical_alerts_count > 0 OR health_score < 50 THEN
    system_status := 'unhealthy';
  ELSIF active_alerts_count > 5 OR health_score < 80 THEN
    system_status := 'degraded';
  ELSE
    system_status := 'healthy';
  END IF;

  -- Insert snapshot
  INSERT INTO system_health_snapshots (
    status,
    active_alerts,
    critical_alerts,
    performance_score,
    metadata
  ) VALUES (
    system_status,
    active_alerts_count,
    critical_alerts_count,
    health_score,
    jsonb_build_object(
      'timestamp', NOW(),
      'calculated_by', 'system'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old metrics
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS VOID AS $$
BEGIN
  -- Delete metrics older than 30 days
  DELETE FROM monitoring_metrics
  WHERE created_at < NOW() - INTERVAL '30 days';

  -- Delete resolved alerts older than 7 days
  DELETE FROM system_alerts
  WHERE resolved = TRUE 
    AND resolved_at < NOW() - INTERVAL '7 days';

  -- Delete health snapshots older than 90 days
  DELETE FROM system_health_snapshots
  WHERE created_at < NOW() - INTERVAL '90 days';

  -- Delete hourly aggregations older than 1 year
  DELETE FROM performance_metrics_hourly
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Insert default alert rules
INSERT INTO alert_rules (id, name, metric, condition, threshold, duration, severity, channels) VALUES
('ai-processing-failure-rate', 'AI Processing Failure Rate', 'ai_processing_failure_rate', 'gt', 0.1, 300, 'high', '["slack", "email"]'),
('news-aggregation-lag', 'News Aggregation Lag', 'news_aggregation_lag_minutes', 'gt', 30, 600, 'medium', '["slack"]'),
('content-processing-queue-size', 'Content Processing Queue Size', 'content_processing_queue_size', 'gt', 100, 300, 'medium', '["slack"]'),
('database-connection-errors', 'Database Connection Errors', 'database_connection_errors', 'gt', 5, 60, 'critical', '["slack", "email", "sms"]'),
('api-response-time', 'API Response Time', 'api_response_time_ms', 'gt', 2000, 300, 'medium', '["slack"]'),
('content-moderation-queue', 'Content Moderation Queue', 'moderation_queue_size', 'gt', 50, 1800, 'low', '["email"]')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE monitoring_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics_hourly ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monitoring tables (admin only)
CREATE POLICY "Admin can manage monitoring metrics" ON monitoring_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage system alerts" ON system_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage alert rules" ON alert_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can view health snapshots" ON system_health_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can view performance metrics" ON performance_metrics_hourly
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create scheduled jobs (if pg_cron is available)
-- These would typically be set up by a database administrator

-- Schedule hourly metrics aggregation
-- SELECT cron.schedule('aggregate-metrics-hourly', '0 * * * *', 'SELECT aggregate_metrics_hourly();');

-- Schedule health snapshots every 5 minutes
-- SELECT cron.schedule('create-health-snapshot', '*/5 * * * *', 'SELECT create_health_snapshot();');

-- Schedule daily cleanup
-- SELECT cron.schedule('cleanup-old-metrics', '0 2 * * *', 'SELECT cleanup_old_metrics();');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON monitoring_metrics TO authenticated;
GRANT ALL ON system_alerts TO authenticated;
GRANT ALL ON alert_rules TO authenticated;
GRANT SELECT ON system_health_snapshots TO authenticated;
GRANT SELECT ON performance_metrics_hourly TO authenticated;