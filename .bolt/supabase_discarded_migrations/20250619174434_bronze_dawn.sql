/*
  # Fix Parts and Profiles Relationship

  1. Database Changes
    - Add foreign key constraint from parts.seller_id to profiles.id
    - Update user_logins RLS policy to allow inserts
    - Ensure profiles table has proper foreign key to auth.users

  2. Security
    - Fix RLS policy for user_logins table
    - Maintain existing security constraints
*/

-- First, ensure all parts have corresponding profiles
-- Create profiles for any users who don't have them
INSERT INTO profiles (id, full_name, email)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  au.email
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Add foreign key constraint from parts to profiles
-- First check if the constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'parts_seller_profiles_fkey' 
    AND table_name = 'parts'
  ) THEN
    ALTER TABLE parts 
    ADD CONSTRAINT parts_seller_profiles_fkey 
    FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Fix the user_logins RLS policy to allow inserts
DROP POLICY IF EXISTS "Users can access only their own login data" ON user_logins;

-- Create new policies for user_logins
CREATE POLICY "Users can insert their own login data"
  ON user_logins
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own login data"
  ON user_logins
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own login data"
  ON user_logins
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure the profiles table has the correct foreign key to auth.users
-- This should already exist based on the schema, but let's make sure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;