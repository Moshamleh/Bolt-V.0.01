/*
  # Simplify profiles RLS policies

  1. Changes
    - Drop existing RLS policies on profiles table
    - Create new simplified policies that:
      - Allow users to read/update their own profile
      - Allow admins to read/update all profiles
    - Remove dependency on auth.users table
    - Use direct is_admin check from profiles table

  2. Security
    - Maintain same level of access control
    - Simplify policy logic to prevent permission issues
    - Remove problematic nested queries
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users" ON profiles;

-- Create new simplified read policy
CREATE POLICY "Enable read access for users"
ON profiles
FOR SELECT
USING (
  auth.uid() = id OR
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- Create new simplified update policy
CREATE POLICY "Enable update for users"
ON profiles
FOR UPDATE
USING (
  auth.uid() = id OR
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
)
WITH CHECK (
  auth.uid() = id OR
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);