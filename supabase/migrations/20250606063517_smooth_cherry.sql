-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can read approved mechanics" ON mechanics;
DROP POLICY IF EXISTS "Users can create mechanic requests" ON mechanics;
DROP POLICY IF EXISTS "Admins can manage all mechanics" ON mechanics;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS mechanics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  location text,
  experience text,
  specialties text[],
  is_certified boolean DEFAULT false,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp without time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE mechanics ENABLE ROW LEVEL SECURITY;

-- Public can read approved mechanics
CREATE POLICY "Public can read approved mechanics"
  ON mechanics
  FOR SELECT
  TO public
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
  USING (is_admin_user());