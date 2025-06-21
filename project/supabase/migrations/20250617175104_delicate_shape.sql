/*
  # Add part number fields to parts table

  1. Changes
    - Add `part_number` column to parts table
    - Add `oem_number` column to parts table
    - Add index for efficient part number searches

  2. Security
    - No changes to RLS policies needed
    - Existing table permissions remain unchanged
*/

DO $$ 
BEGIN
  -- Add part_number column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'parts' AND column_name = 'part_number'
  ) THEN
    ALTER TABLE parts ADD COLUMN part_number text;
  END IF;

  -- Add oem_number column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'parts' AND column_name = 'oem_number'
  ) THEN
    ALTER TABLE parts ADD COLUMN oem_number text;
  END IF;
END $$;

-- Add index for efficient part number searches
CREATE INDEX IF NOT EXISTS idx_parts_part_number ON parts(part_number);
CREATE INDEX IF NOT EXISTS idx_parts_oem_number ON parts(oem_number);