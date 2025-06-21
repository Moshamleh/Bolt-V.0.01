/*
  # Create offers table for marketplace negotiations

  1. New Tables
    - `offers`
      - `id` (uuid, primary key)
      - `part_id` (uuid, references parts)
      - `sender_id` (uuid, references users)
      - `receiver_id` (uuid, references users)
      - `amount` (numeric)
      - `status` (text)
      - `message` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `parent_offer_id` (uuid, references offers)
  
  2. Security
    - Enable RLS on `offers` table
    - Add policies for authenticated users to:
      - View their own offers (as sender or receiver)
      - Create offers
      - Update their own offers
*/

-- Create the offers table
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  parent_offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL, -- For counter-offers

  -- Add a CHECK constraint for allowed status values
  CONSTRAINT chk_offer_status CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'withdrawn'))
);

-- Add RLS to the offers table
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to SELECT their own offers (as sender or receiver)
DROP POLICY IF EXISTS "Users can view their own offers" ON public.offers;
CREATE POLICY "Users can view their own offers" ON public.offers
  FOR SELECT
  TO authenticated
  USING (
    (auth.uid() = sender_id) OR (auth.uid() = receiver_id)
  );

-- Policy for authenticated users to INSERT new offers
DROP POLICY IF EXISTS "Users can create offers" ON public.offers;
CREATE POLICY "Users can create offers" ON public.offers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Policy for authenticated users to UPDATE their own offers (as sender or receiver)
-- This policy allows updates by either sender or receiver. Application logic should enforce valid state transitions.
DROP POLICY IF EXISTS "Users can update their offers" ON public.offers;
CREATE POLICY "Users can update their offers" ON public.offers
  FOR UPDATE
  TO authenticated
  USING (
    (auth.uid() = sender_id) OR (auth.uid() = receiver_id)
  );

-- Function to update the 'updated_at' column automatically on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to call the update_updated_at_column function before update
DROP TRIGGER IF EXISTS set_offers_updated_at ON public.offers;
CREATE TRIGGER set_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();