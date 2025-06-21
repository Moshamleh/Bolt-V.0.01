/*
  # Add INSERT policy to profiles table

  1. New Policy
    - Add an INSERT policy to the profiles table allowing authenticated users to create their own profile
    - This fixes the RLS error when new users try to complete the initial setup

  2. Security
    - The policy ensures users can only create profiles with their own user ID
    - Maintains existing security while enabling the user onboarding flow
*/

-- Add INSERT policy to profiles table
CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);