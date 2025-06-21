/*
  # Create KYC requests table

  1. New Tables
    - `kyc_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `full_name` (text)
      - `gov_id_url` (text)
      - `proof_of_address_url` (text)
      - `business_name` (text, nullable)
      - `status` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `kyc_requests` table
    - Add policies for:
      - Users can insert their own KYC requests
      - Users can view their own KYC requests
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own KYC" ON kyc_requests;
DROP POLICY IF EXISTS "Users can view their own KYC" ON kyc_requests;

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS kyc_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  gov_id_url text NOT NULL,
  proof_of_address_url text NOT NULL,
  business_name text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE kyc_requests ENABLE ROW LEVEL SECURITY;

-- Create policy for users to insert their own KYC
CREATE POLICY "Users can insert their own KYC"
  ON kyc_requests
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to view their own KYC
CREATE POLICY "Users can view their own KYC"
  ON kyc_requests
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);