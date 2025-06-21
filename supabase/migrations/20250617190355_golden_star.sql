/*
  # Add unique constraint to badges name column

  1. Changes
    - Add a unique constraint to the name column in the badges table
    - This enables the ON CONFLICT (name) clause to work correctly
    - Required for badge insertion operations

  2. Security
    - No changes to RLS policies needed
    - Existing table permissions remain unchanged
*/

-- Add unique constraint to badges name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'badges_name_key' 
    AND conrelid = 'badges'::regclass
  ) THEN
    ALTER TABLE badges ADD CONSTRAINT badges_name_key UNIQUE (name);
  END IF;
END $$;