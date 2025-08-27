-- Create news table for aggregated content
-- This migration creates the news table according to the design specification

-- Create news table
CREATE TABLE IF NOT EXISTS public.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    source_url TEXT,
    source_name TEXT,
    published_at TIMESTAMPTZ,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    language TEXT DEFAULT 'es' CHECK (language IN ('es', 'en')),
    processed BOOLEAN DEFAULT FALSE,
    trending_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance as specified in requirements
CREATE INDEX IF NOT EXISTS idx_news_published_at ON public.news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category_id ON public.news(category_id);
CREATE INDEX IF NOT EXISTS idx_news_language ON public.news(language);
CREATE INDEX IF NOT EXISTS idx_news_processed ON public.news(processed);
CREATE INDEX IF NOT EXISTS idx_news_trending_score ON public.news(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_news_source_name ON public.news(source_name);

-- Create trigger for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_news_updated_at()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER news_updated_at_trigger
    BEFORE UPDATE ON public.news
    FOR EACH ROW
    EXECUTE FUNCTION update_news_updated_at();

-- Enable Row Level Security
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Create RLS policies as specified in design
-- Anyone can read news (public content)
CREATE POLICY "Anyone can read news" ON public.news
    FOR SELECT USING (true);

-- Admins can manage all news
CREATE POLICY "Admins can insert news" ON public.news
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update news" ON public.news
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete news" ON public.news
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Verification queries
DO $
BEGIN
    -- Verify table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'news' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'News table was not created successfully';
    END IF;
    
    -- Verify indexes exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_news_published_at') THEN
        RAISE EXCEPTION 'News published_at index was not created successfully';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_news_category_id') THEN
        RAISE EXCEPTION 'News category_id index was not created successfully';
    END IF;
    
    -- Verify RLS is enabled
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'news' AND rowsecurity = true) THEN
        RAISE EXCEPTION 'Row Level Security was not enabled on news table';
    END IF;
    
    -- Verify foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'news' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'category_id'
    ) THEN
        RAISE EXCEPTION 'Foreign key constraint on category_id was not created successfully';
    END IF;
    
    RAISE NOTICE 'News table created successfully with all indexes and policies';
END $;