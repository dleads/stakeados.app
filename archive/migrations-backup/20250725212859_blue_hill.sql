/*
  # Create NFT certificates table

  1. New Tables
    - `nft_certificates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `course_id` (uuid, references courses, optional)
      - `token_id` (bigint)
      - `contract_address` (text)
      - `transaction_hash` (text)
      - `minted_at` (timestamp)

  2. Security
    - Enable RLS on `nft_certificates` table
    - Add policy for users to view their own certificates
    - Add policy for public read access to certificate verification
*/

CREATE TABLE IF NOT EXISTS nft_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  token_id bigint NOT NULL,
  contract_address text NOT NULL,
  transaction_hash text NOT NULL UNIQUE,
  minted_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE nft_certificates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own certificates"
  ON nft_certificates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public certificate verification"
  ON nft_certificates
  FOR SELECT
  TO public
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS nft_certificates_user_id_idx ON nft_certificates(user_id);
CREATE INDEX IF NOT EXISTS nft_certificates_course_id_idx ON nft_certificates(course_id);
CREATE INDEX IF NOT EXISTS nft_certificates_contract_address_idx ON nft_certificates(contract_address);
CREATE INDEX IF NOT EXISTS nft_certificates_token_id_idx ON nft_certificates(token_id);
CREATE INDEX IF NOT EXISTS nft_certificates_transaction_hash_idx ON nft_certificates(transaction_hash);