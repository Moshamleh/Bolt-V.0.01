/*
  # Add is_trusted column to users table

  1. Changes
     - Adds a new boolean column `is_trusted` to the `users` table with a default value of false
*/

-- Add is_trusted column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_trusted') THEN
    ALTER TABLE users ADD COLUMN is_trusted BOOLEAN DEFAULT false;
  END IF;
END $$;