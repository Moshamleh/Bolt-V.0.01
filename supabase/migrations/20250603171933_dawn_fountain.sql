/*
  # Fix users table RLS policies

  1. Changes
    - Drop and recreate RLS policies for users table
    - Add clear policies for authenticated users
    - Ensure proper access control for user data

  2. Security
    - Users can only read and update their own data
    - Multiple policies consolidated into clear, single-purpose policies
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated to read own row" ON users;
DROP POLICY IF EXISTS "Allow authenticated to update own row" ON users;

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new SELECT policy for authenticated users
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Allow authenticated to read own row'
  ) THEN
    CREATE POLICY "Allow authenticated to read own row"
    ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);
  END IF;
END $$;

-- Create UPDATE policy for users to update their own profile
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Allow authenticated to update own row'
  ) THEN
    CREATE POLICY "Allow authenticated to update own row"
    ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
  END IF;
END $$;