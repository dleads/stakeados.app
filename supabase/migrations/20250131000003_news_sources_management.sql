/*
  # News Sources Management System

  1. New Tables
    - `news_sources` - For managing RSS/API news sources
    - `news_source_categories` - Categories for news sources
    - `news_source_health` - Health monitoring for sources

  2. Security
    - Enable RLS on all new tables
    - Add appropriate policies for each table
*/

-- News sources table
CREATE TABLE IF NOT EXISTS news_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  url text NOT NULL,
  source_type text CHECK (source_type IN ('rss', 'api', 'scraper')) NOT NULL DEFAULT 'rss',
  api_key text, -- For API sources
  api_endpoint text, -- For API sources
  headers jsonb DEFAULT '{}', -- Custom headers for requests
  categories text[] DEFAULT '{}', -- Categories this source covers
  language text DEFAULT 'en',
  fetch_interval integer DEFAULT 3600, -- Fetch interval in seconds (default 1 hour)
  is_active boolean DEFAULT true,
  priority integer DEFAULT 1, -- Priority for processing (1-10, higher = more priority)
  quality_score numeric(3,2) DEFAULT 5.0, -- Quality score (1-10)
  last_fetched_at timestamptz,
  last_successful_fetch_at timestamptz,
  consecutive_failures integer DEFAULT 0,
  max_failures integer DEFAULT 5, -- Max consecutive failures before deactivation
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(url, source_type)
);

-- News source categories for organization
CREATE TABLE IF NOT EXISTS news_source_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  color text DEFAULT '#00FF88',
  icon text,
  created_at timestamptz DEFAULT now()
);

-- Junction table for news sources and categories
CREATE TABLE IF NOT EXISTS news_source_category_mapping (
  source_id uuid REFERENCES news_sources(id) ON DELETE CASCADE,
  category_id uuid REFERENCES news_source_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (source_id, category_id)
);

-- Health monitoring for news sources
CREATE TABLE IF NOT EXISTS news_source_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES news_sources(id) ON DELETE CASCADE,
  check_timestamp timestamptz DEFAULT now(),
  status text CHECK (status IN ('healthy', 'warning', 'error', 'timeout')) NOT NULL,
  response_time integer, -- Response time in milliseconds
  articles_fetched integer DEFAULT 0,
  error_message text,
  http_status_code integer,
  metadata jsonb DEFAULT '{}'
);

-- Enable RLS on all new tables
ALTER TABLE news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_source_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_source_category_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_source_health ENABLE ROW LEVEL SECURITY;

-- Policies for news_sources
CREATE POLICY "Admins can manage news sources"
  ON news_sources
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Everyone can view active news sources"
  ON news_sources
  FOR SELECT
  TO public
  USING (is_active = true);

-- Policies for news_source_categories
CREATE POLICY "Admins can manage source categories"
  ON news_source_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Everyone can view source categories"
  ON news_source_categories
  FOR SELECT
  TO public
  USING (true);

-- Policies for news_source_category_mapping
CREATE POLICY "Admins can manage source category mappings"
  ON news_source_category_mapping
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Everyone can view source category mappings"
  ON news_source_category_mapping
  FOR SELECT
  TO public
  USING (true);

-- Policies for news_source_health
CREATE POLICY "Admins can view source health"
  ON news_source_health
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
CREATE INDEX IF NOT EXISTS news_sources_active_idx ON news_sources(is_active, priority DESC);
CREATE INDEX IF NOT EXISTS news_sources_fetch_interval_idx ON news_sources(fetch_interval, last_fetched_at);
CREATE INDEX IF NOT EXISTS news_sources_type_idx ON news_sources(source_type);
CREATE INDEX IF NOT EXISTS news_sources_language_idx ON news_sources(language);

CREATE INDEX IF NOT EXISTS news_source_health_source_timestamp_idx ON news_source_health(source_id, check_timestamp DESC);
CREATE INDEX IF NOT EXISTS news_source_health_status_idx ON news_source_health(status, check_timestamp DESC);

-- Triggers for updated_at
CREATE TRIGGER news_sources_updated_at
  BEFORE UPDATE ON news_sources
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Function to update source health and handle failures
CREATE OR REPLACE FUNCTION update_news_source_health()
RETURNS trigger AS $$
BEGIN
  -- Update last_fetched_at
  UPDATE news_sources 
  SET last_fetched_at = now()
  WHERE id = NEW.source_id;
  
  -- Handle successful fetch
  IF NEW.status = 'healthy' THEN
    UPDATE news_sources 
    SET 
      last_successful_fetch_at = now(),
      consecutive_failures = 0
    WHERE id = NEW.source_id;
  
  -- Handle failed fetch
  ELSIF NEW.status IN ('error', 'timeout') THEN
    UPDATE news_sources 
    SET consecutive_failures = consecutive_failures + 1
    WHERE id = NEW.source_id;
    
    -- Deactivate source if too many consecutive failures
    UPDATE news_sources 
    SET is_active = false
    WHERE id = NEW.source_id 
    AND consecutive_failures >= max_failures;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for health updates
CREATE TRIGGER news_source_health_update
  AFTER INSERT ON news_source_health
  FOR EACH ROW EXECUTE FUNCTION update_news_source_health();

-- Function to get sources ready for fetching
CREATE OR REPLACE FUNCTION get_sources_ready_for_fetch()
RETURNS TABLE (
  id uuid,
  name text,
  url text,
  source_type text,
  api_key text,
  api_endpoint text,
  headers jsonb,
  fetch_interval integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.url,
    s.source_type,
    s.api_key,
    s.api_endpoint,
    s.headers,
    s.fetch_interval
  FROM news_sources s
  WHERE s.is_active = true
  AND (
    s.last_fetched_at IS NULL 
    OR s.last_fetched_at < (now() - (s.fetch_interval || ' seconds')::interval)
  )
  ORDER BY s.priority DESC, s.last_fetched_at ASC NULLS FIRST;
END;
$$ LANGUAGE plpgsql;

-- Insert default news source categories
INSERT INTO news_source_categories (name, description, color, icon) VALUES
  ('Crypto News', 'General cryptocurrency news sources', '#00FF88', 'newspaper'),
  ('DeFi', 'Decentralized Finance news sources', '#FF6B6B', 'coins'),
  ('NFT', 'Non-Fungible Token news sources', '#FFD93D', 'image'),
  ('Base Network', 'Base blockchain specific news', '#0052FF', 'layers'),
  ('Market Analysis', 'Trading and market analysis sources', '#4ECDC4', 'trending-up'),
  ('Technology', 'Blockchain technology news', '#6BCF7F', 'cpu'),
  ('Regulation', 'Regulatory and compliance news', '#FF8C42', 'shield')
ON CONFLICT (name) DO NOTHING;

-- Insert some default news sources
INSERT INTO news_sources (name, description, url, source_type, categories, language, fetch_interval, priority, quality_score) VALUES
  ('CoinDesk', 'Leading cryptocurrency news source', 'https://www.coindesk.com/arc/outboundfeeds/rss/', 'rss', ARRAY['Crypto News', 'Market Analysis'], 'en', 1800, 9, 9.0),
  ('Cointelegraph', 'Cryptocurrency and blockchain news', 'https://cointelegraph.com/rss', 'rss', ARRAY['Crypto News', 'Technology'], 'en', 1800, 8, 8.5),
  ('The Block', 'Institutional crypto news', 'https://www.theblock.co/rss.xml', 'rss', ARRAY['Crypto News', 'DeFi'], 'en', 2400, 8, 8.8),
  ('DeFi Pulse', 'DeFi focused news and analysis', 'https://defipulse.com/blog/feed/', 'rss', ARRAY['DeFi'], 'en', 3600, 7, 8.0),
  ('Base Blog', 'Official Base network updates', 'https://base.mirror.xyz/feed', 'rss', ARRAY['Base Network'], 'en', 7200, 10, 9.5)
ON CONFLICT (url, source_type) DO NOTHING;