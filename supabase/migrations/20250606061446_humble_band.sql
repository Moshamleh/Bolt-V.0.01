/*
  # Create mechanics table and related schemas

  1. New Tables
    - `mechanics`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `full_name` (text)
      - `phone` (text)
      - `is_certified` (boolean)
      - `specialties` (text[])
      - `status` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on mechanics table
    - Add policies for:
      - Public can read approved mechanics
      - Users can create mechanic requests
      - Admins can manage all mechanics
*/

CREATE TABLE IF NOT EXISTS mechanics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  is_certified boolean DEFAULT false,
  specialties text[] DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE mechanics ENABLE ROW LEVEL SECURITY;

-- Public can read approved mechanics
CREATE POLICY "Public can read approved mechanics"
  ON mechanics
  FOR SELECT
  USING (status = 'approved');

-- Users can create mechanic requests
CREATE POLICY "Users can create mechanic requests"
  ON mechanics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all mechanics
CREATE POLICY "Admins can manage all mechanics"
  ON mechanics
  FOR ALL
  TO authenticated
  USING (public.is_admin_user());