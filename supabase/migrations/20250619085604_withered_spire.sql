/*
  # Create boost_orders table

  1. New Tables
    - `boost_orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `part_id` (uuid, references parts)
      - `status` (text, default 'pending')
      - `expires_at` (timestamp with time zone)
      - `created_at` (timestamp with time zone)
  2. Security
    - Enable RLS on `boost_orders` table
    - Add policies for authenticated users to read/create/update their own boost orders
    - Add policies for service_role to manage all boost orders
  3. Functions
    - Add function to remove expired boosts
    - Add trigger to check for expired boosts
*/

-- Create boost_orders table
CREATE TABLE IF NOT EXISTS boost_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  part_id uuid REFERENCES public.parts(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE boost_orders ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read their own boost orders
CREATE POLICY "Users can read own boost orders"
  ON boost_orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow authenticated users to create boost orders
CREATE POLICY "Users can create boost orders"
  ON boost_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow authenticated users to update their own boost orders (e.g., status change)
CREATE POLICY "Users can update own boost orders"
  ON boost_orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow service_role to update boost orders (e.g., for webhook processing)
CREATE POLICY "Service role can update boost orders"
  ON boost_orders
  FOR UPDATE
  TO service_role
  USING (true);

-- Policy to allow service_role to insert boost orders
CREATE POLICY "Service role can insert boost orders"
  ON boost_orders
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy to allow service_role to read boost orders
CREATE POLICY "Service role can read boost orders"
  ON boost_orders
  FOR SELECT
  TO service_role
  USING (true);

-- Function to automatically remove boost after expiry
CREATE OR REPLACE FUNCTION remove_expired_boosts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at < now() THEN
    UPDATE public.parts
    SET is_boosted = FALSE
    WHERE id = NEW.part_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call remove_expired_boosts function on boost_orders update
CREATE TRIGGER check_boost_expiry
AFTER UPDATE OF expires_at ON boost_orders
FOR EACH ROW
EXECUTE FUNCTION remove_expired_boosts();