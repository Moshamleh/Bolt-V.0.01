DO $$ 
BEGIN
  -- Add vin column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'vin'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN vin text;
  END IF;

  -- Add other_vehicle_description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'other_vehicle_description'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN other_vehicle_description text;
  END IF;
END $$;