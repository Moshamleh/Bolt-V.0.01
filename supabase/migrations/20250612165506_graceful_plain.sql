/*
  # Create badges table

  1. New Tables
    - `badges`
      - `id` (uuid, primary key, default uuid_generate_v4())
      - `name` (text, required)
      - `description` (text, optional)
      - `icon_url` (text, optional)
      - `rarity` (text, required with check constraint)
      - `created_at` (timestamp with time zone, default now())

  2. Security
    - Enable RLS on `badges` table
    - Add policy for public read access
    - Add policies for service_role insert/update access

  3. Constraints
    - Rarity field restricted to: 'common', 'milestone', 'rare', 'exclusive'
*/

-- Create the badges table
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  icon_url text,
  rarity text NOT NULL CHECK (rarity IN ('common', 'milestone', 'rare', 'exclusive')),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- Policy for public read access
CREATE POLICY "Public can read badges"
  ON badges
  FOR SELECT
  TO public
  USING (true);

-- Policy for service_role to insert badges
CREATE POLICY "Service role can insert badges"
  ON badges
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy for service_role to update badges
CREATE POLICY "Service role can update badges"
  ON badges
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);