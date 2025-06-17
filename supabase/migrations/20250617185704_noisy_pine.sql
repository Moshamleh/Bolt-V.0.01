/*
  # Add topic column to clubs table

  1. Changes
    - Add `topic` column to `clubs` table
    - Column is required (NOT NULL) with no default value
    - Column type is text to store topic categories like "Performance", "Classic", etc.

  2. Security
    - No RLS changes needed as clubs table doesn't have RLS enabled
*/

-- Add topic column to clubs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clubs' AND column_name = 'topic'
  ) THEN
    ALTER TABLE clubs ADD COLUMN topic text;
  END IF;
END $$;