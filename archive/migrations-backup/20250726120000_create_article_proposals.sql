CREATE TABLE article_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposer_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  outline TEXT NOT NULL,
  author_experience TEXT NOT NULL,
  previous_work TEXT[],
  suggested_level TEXT CHECK (suggested_level IN ('beginner', 'intermediate', 'advanced')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending' NOT NULL,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE articles
ADD COLUMN proposal_id UUID REFERENCES article_proposals(id) ON DELETE SET NULL;
