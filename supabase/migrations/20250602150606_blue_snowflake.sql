/*
  # Create saved parts table

  1. New Tables
    - `saved_parts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `part_id` (uuid, references parts)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `saved_parts` table
    - Add policies for:
      - Users can read their own saved parts
      - Users can save/unsave parts
*/

CREATE TABLE IF NOT EXISTS saved_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  part_id uuid REFERENCES parts NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, part_id)
);

-- Enable Row Level Security
ALTER TABLE saved_parts ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own saved parts
CREATE POLICY "Users can read own saved parts"
  ON saved_parts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for users to save parts
CREATE POLICY "Users can save parts"
  ON saved_parts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to unsave parts
CREATE POLICY "Users can unsave parts"
  ON saved_parts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);