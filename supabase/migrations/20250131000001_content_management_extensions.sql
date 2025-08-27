/*
  # Content Management System Extensions

  1. New Tables
    - `article_proposals` - For community article proposals
    - `content_categories` - Predefined categories for articles and news
    - `content_tags` - Tag management system
    - `article_categories` - Many-to-many relationship for article categories
    - `article_tags` - Many-to-many relationship for article tags
    - `news_categories` - Many-to-many relationship for news categories
    - `content_interactions` - Track user interactions with content
    - `user_subscriptions` - User subscriptions to categories, tags, authors

  2. Extensions to existing tables
    - Add missing fields to articles table
    - Add missing fields to news_articles table

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for each table
*/

-- Article proposals table
CREATE TABLE IF NOT EXISTS article_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL,
  outline text NOT NULL,
  author_experience text NOT NULL,
  previous_work text[] DEFAULT '{}',
  suggested_level text CHECK (suggested_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  suggested_category text,
  estimated_read_time integer,
  status text CHECK (status IN ('pending', 'approved', 'rejected', 'changes_requested')) DEFAULT 'pending',
  feedback text,
  proposer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Content categories table
CREATE TABLE IF NOT EXISTS content_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name jsonb NOT NULL DEFAULT '{}', -- {en: "DeFi", es: "DeFi"}
  slug text UNIQUE NOT NULL,
  description jsonb DEFAULT '{}',
  color text DEFAULT '#00FF88',
  icon text,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Content tags table
CREATE TABLE IF NOT EXISTS content_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Article categories junction table
CREATE TABLE IF NOT EXISTS article_categories (
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES content_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, category_id)
);

-- Article tags junction table
CREATE TABLE IF NOT EXISTS article_tags (
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES content_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- News categories junction table
CREATE TABLE IF NOT EXISTS news_categories (
  news_id uuid REFERENCES news_articles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES content_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (news_id, category_id)
);

-- Content interactions table
CREATE TABLE IF NOT EXISTS content_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content_id uuid NOT NULL,
  content_type text CHECK (content_type IN ('article', 'news')) NOT NULL,
  interaction_type text CHECK (interaction_type IN ('view', 'like', 'share', 'bookmark')) NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content_id, interaction_type)
);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_type text CHECK (subscription_type IN ('category', 'tag', 'author')) NOT NULL,
  subscription_target text NOT NULL, -- category_id, tag_name, or author_id
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, subscription_type, subscription_target)
);

-- Extend articles table with missing fields
ALTER TABLE articles ADD COLUMN IF NOT EXISTS reading_time integer;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS like_count integer DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced'));
ALTER TABLE articles ADD COLUMN IF NOT EXISTS featured_image_url text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS meta_description jsonb DEFAULT '{}';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS related_courses uuid[];
ALTER TABLE articles ADD COLUMN IF NOT EXISTS ai_summary jsonb DEFAULT '{}';

-- Extend news_articles table with missing fields
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS author_name text;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS read_time integer;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS engagement_score numeric(5,2) DEFAULT 0;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS trending_score numeric(5,2) DEFAULT 0;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS related_articles uuid[];
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS user_interactions jsonb DEFAULT '{}';

-- Enable RLS on all new tables
ALTER TABLE article_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for article_proposals
CREATE POLICY "Users can view their own proposals"
  ON article_proposals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = proposer_id);

CREATE POLICY "Users can create proposals"
  ON article_proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = proposer_id);

CREATE POLICY "Users can update their own pending proposals"
  ON article_proposals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = proposer_id AND status = 'pending');

-- Policies for content_categories
CREATE POLICY "Categories are viewable by everyone"
  ON content_categories
  FOR SELECT
  TO public
  USING (is_active = true);

-- Policies for content_tags
CREATE POLICY "Tags are viewable by everyone"
  ON content_tags
  FOR SELECT
  TO public
  USING (true);

-- Policies for junction tables (public read for published content)
CREATE POLICY "Article categories are viewable by everyone"
  ON article_categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Article tags are viewable by everyone"
  ON article_tags
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "News categories are viewable by everyone"
  ON news_categories
  FOR SELECT
  TO public
  USING (true);

-- Policies for content_interactions
CREATE POLICY "Users can view their own interactions"
  ON content_interactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create interactions"
  ON content_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions"
  ON content_interactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for user_subscriptions
CREATE POLICY "Users can manage their own subscriptions"
  ON user_subscriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS article_proposals_status_idx ON article_proposals(status);
CREATE INDEX IF NOT EXISTS article_proposals_proposer_id_idx ON article_proposals(proposer_id);
CREATE INDEX IF NOT EXISTS article_proposals_created_at_idx ON article_proposals(created_at DESC);

CREATE INDEX IF NOT EXISTS content_categories_slug_idx ON content_categories(slug);
CREATE INDEX IF NOT EXISTS content_categories_active_idx ON content_categories(is_active, order_index);

CREATE INDEX IF NOT EXISTS content_tags_name_idx ON content_tags(name);
CREATE INDEX IF NOT EXISTS content_tags_usage_count_idx ON content_tags(usage_count DESC);

CREATE INDEX IF NOT EXISTS content_interactions_user_content_idx ON content_interactions(user_id, content_type, created_at DESC);
CREATE INDEX IF NOT EXISTS content_interactions_content_type_idx ON content_interactions(content_id, content_type, interaction_type);

CREATE INDEX IF NOT EXISTS user_subscriptions_user_type_idx ON user_subscriptions(user_id, subscription_type);

-- Additional indexes for extended fields
CREATE INDEX IF NOT EXISTS articles_difficulty_level_idx ON articles(difficulty_level);
CREATE INDEX IF NOT EXISTS articles_view_count_idx ON articles(view_count DESC);
CREATE INDEX IF NOT EXISTS articles_like_count_idx ON articles(like_count DESC);

CREATE INDEX IF NOT EXISTS news_articles_trending_score_idx ON news_articles(trending_score DESC);
CREATE INDEX IF NOT EXISTS news_articles_engagement_score_idx ON news_articles(engagement_score DESC);

-- Triggers for updated_at
CREATE TRIGGER article_proposals_updated_at
  BEFORE UPDATE ON article_proposals
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE content_tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE content_tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for tag usage count
CREATE TRIGGER article_tags_usage_count
  AFTER INSERT OR DELETE ON article_tags
  FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Function to update article view count
CREATE OR REPLACE FUNCTION increment_article_view_count()
RETURNS trigger AS $$
BEGIN
  IF NEW.interaction_type = 'view' THEN
    UPDATE articles SET view_count = view_count + 1 WHERE id = NEW.content_id::uuid AND NEW.content_type = 'article';
  ELSIF NEW.interaction_type = 'like' THEN
    UPDATE articles SET like_count = like_count + 1 WHERE id = NEW.content_id::uuid AND NEW.content_type = 'article';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for content interactions
CREATE TRIGGER content_interactions_update_counts
  AFTER INSERT ON content_interactions
  FOR EACH ROW EXECUTE FUNCTION increment_article_view_count();

-- Insert default categories
INSERT INTO content_categories (name, slug, description, color, icon, order_index) VALUES
  ('{"en": "DeFi", "es": "DeFi"}', 'defi', '{"en": "Decentralized Finance", "es": "Finanzas Descentralizadas"}', '#00FF88', 'coins', 1),
  ('{"en": "NFTs", "es": "NFTs"}', 'nfts', '{"en": "Non-Fungible Tokens", "es": "Tokens No Fungibles"}', '#FF6B6B', 'image', 2),
  ('{"en": "Base Network", "es": "Red Base"}', 'base', '{"en": "Base blockchain network", "es": "Red blockchain Base"}', '#0052FF', 'layers', 3),
  ('{"en": "Trading", "es": "Trading"}', 'trading', '{"en": "Cryptocurrency trading", "es": "Trading de criptomonedas"}', '#FFD93D', 'trending-up', 4),
  ('{"en": "Technology", "es": "Tecnología"}', 'technology', '{"en": "Blockchain technology", "es": "Tecnología blockchain"}', '#6BCF7F', 'cpu', 5),
  ('{"en": "Regulation", "es": "Regulación"}', 'regulation', '{"en": "Crypto regulation and compliance", "es": "Regulación y cumplimiento crypto"}', '#FF8C42', 'shield', 6),
  ('{"en": "Market Analysis", "es": "Análisis de Mercado"}', 'market-analysis', '{"en": "Market trends and analysis", "es": "Tendencias y análisis de mercado"}', '#4ECDC4', 'bar-chart', 7),
  ('{"en": "Education", "es": "Educación"}', 'education', '{"en": "Learning and tutorials", "es": "Aprendizaje y tutoriales"}', '#45B7D1', 'book-open', 8)
ON CONFLICT (slug) DO NOTHING;