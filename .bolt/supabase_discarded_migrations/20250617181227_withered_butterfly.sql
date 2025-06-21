/*
  # Create reported_parts table

  1. New Tables
    - `reported_parts`
      - `id` (uuid, primary key)
      - `part_id` (uuid, references parts)
      - `reporter_id` (uuid, references auth.users)
      - `reason` (text)
      - `message` (text, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `reported_parts` table
    - Add policies for:
      - Admins can read reports
      - Users can report parts
*/

CREATE TABLE IF NOT EXISTS reported_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id uuid REFERENCES parts(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  message text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE reported_parts ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to read reports
CREATE POLICY "Admins can read reports"
  ON reported_parts
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create policy for users to report parts
CREATE POLICY "Users can report parts"
  ON reported_parts
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = reporter_id);