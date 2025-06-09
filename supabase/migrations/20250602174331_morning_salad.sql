/*
  # Fix profiles RLS policies

  1. Changes
    - Remove recursive admin policies from profiles table
    - Simplify RLS policies to prevent infinite recursion
    - Keep basic user access controls
    
  2. Security
    - Maintain RLS enabled on profiles table
    - Add simplified policies for user access
    - Add direct admin access policy without recursion
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new, simplified policies
CREATE POLICY "Enable read access for users" ON profiles
  FOR SELECT
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%@mechanicai.com'
    )
  );

CREATE POLICY "Enable update for users" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%@mechanicai.com'
    )
  );