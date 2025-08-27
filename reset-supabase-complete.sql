-- Complete Supabase Reset - Professional Setup
-- Execute this in Supabase SQL Editor
-- WARNING: This will delete all data and recreate everything

-- 1. Drop all existing tables (if they exist)
DROP TABLE IF EXISTS content_categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS news_articles CASCADE;
DROP TABLE IF EXISTS article_categories CASCADE;
DROP TABLE IF EXISTS news_categories CASCADE;
DROP TABLE IF EXISTS content_interactions CASCADE;
DROP TABLE IF EXISTS content_tags CASCADE;
DROP TABLE IF EXISTS news_sources CASCADE;
DROP TABLE IF EXISTS news_source_categories CASCADE;
DROP TABLE IF EXISTS role_audit_log CASCADE;
DROP TABLE IF EXISTS role_permissions_cache CASCADE;

-- 2. Drop all functions
DROP FUNCTION IF EXISTS get_category_stats() CASCADE;
DROP FUNCTION IF EXISTS update_user_role(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_role_permissions(uuid) CASCADE;
DROP FUNCTION IF EXISTS audit_role_change(uuid, text, text, text) CASCADE;

-- 3. Create profiles table with proper structure
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'genesis', 'citizen', 'student')),
  display_name text,
  avatar_url text,
  genesis_nft_verified boolean DEFAULT false,
  citizenship_points integer DEFAULT 0,
  wallet_address text,
  wallet_type text CHECK (wallet_type IN ('ethereum', 'polygon', 'binance', 'solana')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Create content_categories table
CREATE TABLE content_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name jsonb NOT NULL DEFAULT '{}',
  slug text UNIQUE NOT NULL,
  description jsonb DEFAULT '{}',
  color text DEFAULT '#00FF88',
  icon text,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Create articles table
CREATE TABLE articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title jsonb NOT NULL,
  content jsonb NOT NULL,
  excerpt jsonb,
  slug text UNIQUE NOT NULL,
  author_id uuid REFERENCES profiles(id),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz,
  view_count integer DEFAULT 0,
  featured boolean DEFAULT false,
  seo_title jsonb,
  seo_description jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Create news_articles table
CREATE TABLE news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  excerpt text,
  url text,
  source_id uuid,
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 7. Create junction tables
CREATE TABLE article_categories (
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES content_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, category_id)
);

CREATE TABLE news_categories (
  news_id uuid REFERENCES news_articles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES content_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (news_id, category_id)
);

-- 8. Create content_interactions table
CREATE TABLE content_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('article', 'news')),
  interaction_type text NOT NULL CHECK (interaction_type IN ('view', 'like', 'share', 'comment')),
  created_at timestamptz DEFAULT now()
);

-- 9. Create indexes for performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_content_categories_slug ON content_categories(slug);
CREATE INDEX idx_content_categories_active ON content_categories(is_active);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_article_categories_article ON article_categories(article_id);
CREATE INDEX idx_article_categories_category ON article_categories(category_id);
CREATE INDEX idx_content_interactions_user ON content_interactions(user_id);
CREATE INDEX idx_content_interactions_content ON content_interactions(content_id, content_type);

-- 10. Create the get_category_stats function
CREATE OR REPLACE FUNCTION get_category_stats()
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

-- 11. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_interactions ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 13. Create RLS policies for content_categories
CREATE POLICY "Public can view active categories"
  ON content_categories FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all categories"
  ON content_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON content_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 14. Create RLS policies for articles
CREATE POLICY "Public can view published articles"
  ON articles FOR SELECT
  TO public
  USING (status = 'published');

CREATE POLICY "Authors can manage their articles"
  ON articles FOR ALL
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Admins can manage all articles"
  ON articles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 15. Create RLS policies for content_interactions
CREATE POLICY "Users can manage their own interactions"
  ON content_interactions FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- 16. Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON content_categories TO authenticated;
GRANT ALL ON articles TO authenticated;
GRANT ALL ON news_articles TO authenticated;
GRANT ALL ON article_categories TO authenticated;
GRANT ALL ON news_categories TO authenticated;
GRANT ALL ON content_interactions TO authenticated;
GRANT EXECUTE ON FUNCTION get_category_stats() TO authenticated;

-- 17. Insert sample data
INSERT INTO content_categories (name, slug, description, color, order_index) VALUES
  ('{"en": "DeFi", "es": "DeFi"}', 'defi', '{"en": "Decentralized Finance", "es": "Finanzas Descentralizadas"}', '#00FF88', 1),
  ('{"en": "Trading", "es": "Trading"}', 'trading', '{"en": "Trading and Markets", "es": "Trading y Mercados"}', '#FF6B6B', 2),
  ('{"en": "Market Analysis", "es": "Análisis de Mercado"}', 'market-analysis', '{"en": "Market Analysis and Insights", "es": "Análisis e Información de Mercado"}', '#4ECDC4', 3);

-- 18. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_categories_updated_at BEFORE UPDATE ON content_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 19. Verify setup
SELECT 'Setup completed successfully' as status;
