-- Insert default categories for the Stakeados platform
-- This migration adds the core categories needed for content organization

-- Insert default categories with appropriate colors and internationalized names/descriptions
INSERT INTO categories (name, slug, description, color) VALUES
  ('{"en": "DeFi", "es": "DeFi"}'::jsonb, 'defi', '{"en": "Decentralized Finance protocols, yield farming, and DeFi strategies", "es": "Protocolos de finanzas descentralizadas, yield farming y estrategias DeFi"}'::jsonb, '#00D4AA'),
  ('{"en": "NFTs", "es": "NFTs"}'::jsonb, 'nfts', '{"en": "Non-Fungible Tokens, digital collectibles, and NFT marketplaces", "es": "Tokens no fungibles, coleccionables digitales y mercados NFT"}'::jsonb, '#FF6B6B'),
  ('{"en": "Base", "es": "Base"}'::jsonb, 'base', '{"en": "Base blockchain ecosystem, development, and applications", "es": "Ecosistema blockchain Base, desarrollo y aplicaciones"}'::jsonb, '#0052FF'),
  ('{"en": "Trading", "es": "Trading"}'::jsonb, 'trading', '{"en": "Cryptocurrency trading strategies, market analysis, and tools", "es": "Estrategias de trading de criptomonedas, análisis de mercado y herramientas"}'::jsonb, '#FFD93D'),
  ('{"en": "Technology", "es": "Tecnología"}'::jsonb, 'technology', '{"en": "Blockchain technology, smart contracts, and development", "es": "Tecnología blockchain, contratos inteligentes y desarrollo"}'::jsonb, '#6BCF7F'),
  ('{"en": "Regulation", "es": "Regulación"}'::jsonb, 'regulation', '{"en": "Cryptocurrency regulations, compliance, and legal updates", "es": "Regulaciones de criptomonedas, cumplimiento y actualizaciones legales"}'::jsonb, '#A8A8A8')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  updated_at = NOW();

-- Verify the categories were inserted correctly
DO $$
DECLARE
    category_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO category_count FROM categories;
    
    IF category_count < 6 THEN
        RAISE EXCEPTION 'Expected at least 6 categories, but found %', category_count;
    END IF;
    
    RAISE NOTICE 'Successfully inserted % categories', category_count;
END $$;