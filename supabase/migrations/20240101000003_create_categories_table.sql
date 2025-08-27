-- Create categories table for content organization
-- This table supports hierarchical categories with parent-child relationships

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT,
    icon TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);

-- Create trigger for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER categories_updated_at_trigger
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION update_categories_updated_at();

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Anyone can read categories (public content)
CREATE POLICY "Anyone can read categories" ON public.categories
    FOR SELECT USING (true);

-- Only admins can insert categories
CREATE POLICY "Admins can insert categories" ON public.categories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can update categories
CREATE POLICY "Admins can update categories" ON public.categories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can delete categories
CREATE POLICY "Admins can delete categories" ON public.categories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Insert default categories as specified in requirements
INSERT INTO public.categories (name, slug, description, color, sort_order) VALUES
    ('DeFi', 'defi', 'Decentralized Finance protocols and applications', '#00D4AA', 1),
    ('NFTs', 'nfts', 'Non-Fungible Tokens and digital collectibles', '#FF6B6B', 2),
    ('Base', 'base', 'Base blockchain ecosystem and development', '#0052FF', 3),
    ('Trading', 'trading', 'Cryptocurrency trading strategies and analysis', '#FFD93D', 4),
    ('Technology', 'technology', 'Blockchain technology and development', '#6BCF7F', 5),
    ('Regulation', 'regulation', 'Cryptocurrency regulations and compliance', '#A8E6CF', 6)
ON CONFLICT (slug) DO NOTHING;

-- Verification queries
DO $$
BEGIN
    -- Verify table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Categories table was not created successfully';
    END IF;
    
    -- Verify indexes exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_categories_slug') THEN
        RAISE EXCEPTION 'Categories slug index was not created successfully';
    END IF;
    
    -- Verify RLS is enabled
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'categories' AND rowsecurity = true) THEN
        RAISE EXCEPTION 'Row Level Security was not enabled on categories table';
    END IF;
    
    -- Verify default data was inserted
    IF (SELECT COUNT(*) FROM public.categories) < 6 THEN
        RAISE EXCEPTION 'Default categories were not inserted successfully';
    END IF;
    
    RAISE NOTICE 'Categories table created successfully with % default categories', (SELECT COUNT(*) FROM public.categories);
END $$;