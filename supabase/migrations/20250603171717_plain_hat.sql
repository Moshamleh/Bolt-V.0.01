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

-- Drop existing SELECT policies to avoid conflicts
DROP POLICY IF EXISTS "Allow SELECT for all logged-in users" ON users;
DROP POLICY IF EXISTS "Allow SELECT for own row" ON users;
DROP POLICY IF EXISTS "Allow logged-in user to read their user row" ON users;
DROP POLICY IF EXISTS "Allow own read" ON users;
DROP POLICY IF EXISTS "Allow users to read their own user row" ON users;
DROP POLICY IF EXISTS "Allow users to read their own user data" ON users;
DROP POLICY IF EXISTS "Authenticated can read their own row" ON users;
DROP POLICY IF EXISTS "Users can read their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can read their own user data" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new SELECT policy for authenticated users
CREATE POLICY "Allow authenticated to read own row"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create UPDATE policy for users to update their own profile
CREATE POLICY "Allow authenticated to update own row"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);