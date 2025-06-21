/*
  # Fix RLS recursion with SECURITY DEFINER function

  1. Changes
    - Create SECURITY DEFINER function to check admin status
    - Update RLS policies to use the new function
    - Fix infinite recursion in profiles table policies
    - Update related table policies to use the new function

  2. Security
    - Function runs with elevated privileges to safely check admin status
    - Policies updated to use the new function instead of subqueries
    - Maintain existing access control logic without recursion
*/

-- Create SECURITY DEFINER function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_user TO authenticated;

-- Drop existing profiles policies
DROP POLICY IF EXISTS "Enable read access for users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users" ON profiles;

-- Create new profiles policies using the SECURITY DEFINER function
CREATE POLICY "Enable read access for users"
ON profiles
FOR SELECT
USING (
  auth.uid() = id OR
  public.is_admin_user()
);

CREATE POLICY "Enable update for users"
ON profiles
FOR UPDATE
USING (
  auth.uid() = id OR
  public.is_admin_user()
)
WITH CHECK (
  auth.uid() = id OR
  public.is_admin_user()
);

-- Update users table policies
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Allow authenticated to read own row" ON users;
DROP POLICY IF EXISTS "Allow authenticated to update own row" ON users;

CREATE POLICY "Users can read own row"
ON users
FOR SELECT
USING (
  auth.uid() = id OR
  public.is_admin_user()
);

CREATE POLICY "Users can update own row"
ON users
FOR UPDATE
USING (
  auth.uid() = id OR
  public.is_admin_user()
)
WITH CHECK (
  auth.uid() = id OR
  public.is_admin_user()
);

-- Update vehicles table policies
DROP POLICY IF EXISTS "Admins can read all vehicles" ON vehicles;

CREATE POLICY "Admins can read all vehicles"
ON vehicles
FOR SELECT
USING (public.is_admin_user());

-- Update diagnoses table policies
DROP POLICY IF EXISTS "Admins can read all diagnoses" ON diagnoses;

CREATE POLICY "Admins can read all diagnoses"
ON diagnoses
FOR SELECT
USING (public.is_admin_user());

-- Update ai_logs table policies
DROP POLICY IF EXISTS "Admins can read all ai_logs" ON ai_logs;

CREATE POLICY "Admins can read all ai_logs"
ON ai_logs
FOR SELECT
USING (public.is_admin_user());