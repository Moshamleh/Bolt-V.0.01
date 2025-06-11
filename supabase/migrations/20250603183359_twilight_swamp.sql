/*
  # Fix diagnoses and vehicles table relationship

  1. Changes
    - Change vehicle_id column type from text to uuid
    - Add foreign key constraint to vehicles table
    - Add ON DELETE CASCADE to automatically remove diagnoses when vehicle is deleted

  2. Security
    - No changes to RLS policies needed
    - Existing table permissions remain unchanged

  3. Notes
    - Uses DO block to safely handle type conversion
    - Adds foreign key constraint only if it doesn't exist
    - Ensures data consistency between tables
*/

DO $$ 
BEGIN
  -- First, alter the column type from text to uuid
  -- This assumes all existing vehicle_id values are valid UUIDs
  ALTER TABLE diagnoses 
    ALTER COLUMN vehicle_id TYPE uuid USING vehicle_id::uuid;

  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'diagnoses_vehicle_id_fkey'
  ) THEN
    ALTER TABLE diagnoses
      ADD CONSTRAINT diagnoses_vehicle_id_fkey
      FOREIGN KEY (vehicle_id)
      REFERENCES vehicles(id)
      ON DELETE CASCADE;
  END IF;
END $$;