/*
  # Add vehicle details to parts table

  1. Changes
    - Add vehicle-related columns to parts table:
      - `make` (text): Vehicle manufacturer
      - `model` (text): Vehicle model
      - `year` (integer): Vehicle year
      - `trim` (text): Vehicle trim level

  2. Security
    - No changes to RLS policies needed
    - Existing table permissions remain unchanged
*/

DO $$ 
BEGIN
  -- Add make column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'parts' AND column_name = 'make'
  ) THEN
    ALTER TABLE parts ADD COLUMN make text;
  END IF;

  -- Add model column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'parts' AND column_name = 'model'
  ) THEN
    ALTER TABLE parts ADD COLUMN model text;
  END IF;

  -- Add year column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'parts' AND column_name = 'year'
  ) THEN
    ALTER TABLE parts ADD COLUMN year integer;
  END IF;

  -- Add trim column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'parts' AND column_name = 'trim'
  ) THEN
    ALTER TABLE parts ADD COLUMN trim text;
  END IF;
END $$;