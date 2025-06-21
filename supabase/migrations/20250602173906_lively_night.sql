/*
  # Fix profiles RLS policies

  1. Changes
    - Remove recursive policies from profiles table
    - Add simplified RLS policies that avoid circular dependencies
    - Maintain admin access without recursion
    - Ensure users can still manage their own profiles

  2. Security
    - Enable RLS on profiles table
    - Add non-recursive policies for:
      - Users reading their own profile
      - Users updating their own profile
      - Admins reading all profiles
      - Admins updating all profiles
*/

-- Drop existing policies to recreate them without recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create new non-recursive policies
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Admins can update all profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
  (SELECT is_admin FROM profiles WHERE id = auth.uid())
);