/*
  # Add disclaimer_accepted column to user_logins table

  1. Changes
    - Add `disclaimer_accepted` boolean column to user_logins table
    - Set default value to false for new logins
    - This tracks whether users have accepted the AI disclaimer

  2. Security
    - No changes to RLS policies needed
    - Existing table permissions remain unchanged
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_logins' 
    AND column_name = 'disclaimer_accepted'
  ) THEN
    ALTER TABLE user_logins 
    ADD COLUMN disclaimer_accepted boolean DEFAULT false;
  END IF;
END $$;