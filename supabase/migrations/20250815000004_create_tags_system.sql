-- Create tags system for content management

-- 1. Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#6B7280',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create article_tags junction table
CREATE TABLE IF NOT EXISTS article_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, tag_id)
);

-- 3. Create news_tags junction table
CREATE TABLE IF NOT EXISTS news_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    news_id UUID REFERENCES news(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(news_id, tag_id)
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_article_tags_article_id ON article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_article_tags_tag_id ON article_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_news_tags_news_id ON news_tags(news_id);
CREATE INDEX IF NOT EXISTS idx_news_tags_tag_id ON news_tags(tag_id);

-- 5. Create function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tags 
        SET usage_count = usage_count + 1,
            updated_at = NOW()
        WHERE id = NEW.tag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tags 
        SET usage_count = GREATEST(usage_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.tag_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Create triggers to automatically update usage counts
CREATE TRIGGER trigger_update_tag_usage_article_tags
    AFTER INSERT OR DELETE ON article_tags
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

CREATE TRIGGER trigger_update_tag_usage_news_tags
    AFTER INSERT OR DELETE ON news_tags
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- 7. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for tags updated_at
CREATE TRIGGER trigger_tags_updated_at
    BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Enable RLS on all tables
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_tags ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies for tags (admin can manage, users can read)
CREATE POLICY "Admin can manage tags" ON tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can read tags" ON tags
    FOR SELECT USING (true);

-- 11. Create RLS policies for article_tags
CREATE POLICY "Admin can manage article tags" ON article_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can read article tags" ON article_tags
    FOR SELECT USING (true);

-- 12. Create RLS policies for news_tags
CREATE POLICY "Admin can manage news tags" ON news_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can read news tags" ON news_tags
    FOR SELECT USING (true);

-- 13. Insert some default tags
INSERT INTO tags (name, slug, description, color) VALUES
    ('Tecnología', 'tecnologia', 'Artículos sobre tecnología y innovación', '#3B82F6'),
    ('Blockchain', 'blockchain', 'Contenido relacionado con blockchain y criptomonedas', '#8B5CF6'),
    ('DeFi', 'defi', 'Finanzas descentralizadas', '#10B981'),
    ('NFT', 'nft', 'Tokens no fungibles', '#F59E0B'),
    ('Web3', 'web3', 'Tecnologías Web3 y descentralización', '#EF4444'),
    ('Educación', 'educacion', 'Contenido educativo y tutoriales', '#06B6D4'),
    ('Análisis', 'analisis', 'Análisis de mercado y tendencias', '#84CC16'),
    ('Noticias', 'noticias', 'Noticias generales del sector', '#6B7280')
ON CONFLICT (name) DO NOTHING;