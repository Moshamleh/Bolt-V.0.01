/*
  # Create reported_parts table with idempotent policies

  1. New Tables
    - `reported_parts`
      - `id` (uuid, primary key)
      - `part_id` (uuid, references parts)
      - `reporter_id` (uuid, references auth.users)
      - `reason` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `reported_parts` table
    - Add policies for:
      - Admins can read reports
      - Users can report parts
    - Use DO blocks to ensure policies are only created if they don't exist
*/

CREATE TABLE IF NOT EXISTS reported_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id uuid REFERENCES parts(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE reported_parts ENABLE ROW LEVEL SECURITY;

-- Create policies only if they don't exist
DO $$ 
BEGIN
  -- Check if admin read policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reported_parts' 
    AND policyname = 'Admins can read reports'
  ) THEN
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
  END IF;

  -- Check if user insert policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reported_parts' 
    AND policyname = 'Users can report parts'
  ) THEN
    CREATE POLICY "Users can report parts"
      ON reported_parts
      FOR INSERT
      TO public
      WITH CHECK (auth.uid() = reporter_id);
  END IF;
END $$;