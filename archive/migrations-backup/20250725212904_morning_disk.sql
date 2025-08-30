/*
  # Create news articles table

  1. New Tables
    - `news_articles`
      - `id` (uuid, primary key)
      - `title` (jsonb for multilingual support)
      - `summary` (jsonb for multilingual support)
      - `content` (jsonb for multilingual support)
      - `source_url` (text)
      - `source_name` (text)
      - `categories` (text array)
      - `keywords` (text array)
      - `relevance_score` (numeric, optional)
      - `ai_processed_at` (timestamp, optional)
      - `published_at` (timestamp)

  2. Security
    - Enable RLS on `news_articles` table
    - Add policy for public read access to all news articles
*/

CREATE TABLE IF NOT EXISTS news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title jsonb NOT NULL DEFAULT '{}',
  summary jsonb NOT NULL DEFAULT '{}',
  content jsonb NOT NULL DEFAULT '{}',
  source_url text NOT NULL UNIQUE,
  source_name text NOT NULL,
  categories text[] DEFAULT '{}',
  keywords text[] DEFAULT '{}',
  relevance_score numeric(3,2),
  ai_processed_at timestamptz,
  published_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "News articles are viewable by everyone"
  ON news_articles
  FOR SELECT
  TO public
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS news_articles_published_at_idx ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS news_articles_source_name_idx ON news_articles(source_name);
CREATE INDEX IF NOT EXISTS news_articles_categories_idx ON news_articles USING GIN(categories);
CREATE INDEX IF NOT EXISTS news_articles_keywords_idx ON news_articles USING GIN(keywords);
CREATE INDEX IF NOT EXISTS news_articles_relevance_score_idx ON news_articles(relevance_score DESC);
CREATE INDEX IF NOT EXISTS news_articles_ai_processed_at_idx ON news_articles(ai_processed_at);