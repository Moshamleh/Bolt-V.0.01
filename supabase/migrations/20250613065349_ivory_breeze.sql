/*
  # Create service records table

  1. New Tables
    - `service_records`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `vehicle_id` (uuid, references vehicles)
      - `service_date` (date)
      - `service_type` (text)
      - `description` (text)
      - `mileage` (integer)
      - `cost` (numeric)
      - `service_provider` (text)
      - `notes` (text)
      - `invoice_url` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `service_records` table
    - Add policies for:
      - Users can read their own service records
      - Users can create their own service records
      - Users can update their own service records
      - Users can delete their own service records
      - Admins can read all service records
*/

CREATE TABLE IF NOT EXISTS service_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  service_date date NOT NULL,
  service_type text NOT NULL,
  description text NOT NULL,
  mileage integer NOT NULL,
  cost numeric(10,2) NOT NULL,
  service_provider text,
  notes text,
  invoice_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own service records
CREATE POLICY "Users can read own service records"
  ON service_records
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for users to create their own service records
CREATE POLICY "Users can create own service records"
  ON service_records
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own service records
CREATE POLICY "Users can update own service records"
  ON service_records
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to delete their own service records
CREATE POLICY "Users can delete own service records"
  ON service_records
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for admins to read all service records
CREATE POLICY "Admins can read all service records"
  ON service_records
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

-- Add index for faster queries
CREATE INDEX idx_service_records_vehicle_id ON service_records(vehicle_id);
CREATE INDEX idx_service_records_user_id ON service_records(user_id);
CREATE INDEX idx_service_records_service_date ON service_records(service_date);