/*
  # Add admin RLS policy for users table

  1. Changes
    - Add RLS policy for admin access to users table
    - Allow admins to read all user data
    - Maintain existing user-specific policies
    
  2. Security
    - Policy checks admin status in profiles table
    - Only authenticated users with admin privileges can access all user data
*/

-- Create admin read policy
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Admins can read all users'
  ) THEN
    CREATE POLICY "Admins can read all users"
    ON users
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.is_admin = true
      )
    );
  END IF;
END $$;