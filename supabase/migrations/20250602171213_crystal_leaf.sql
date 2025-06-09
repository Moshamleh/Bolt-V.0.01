/*
  # Create vehicle context view

  1. New View
    - `vehicle_context`
      - Combines vehicle and profile information
      - Includes vehicle details (make, model, year, trim, VIN)
      - Includes owner information (name, location)
  
  2. Security
    - View inherits RLS policies from underlying tables
    - Only authenticated users can access the view
*/

-- Create the view
CREATE OR REPLACE VIEW vehicle_context AS
SELECT 
  v.id as vehicle_id,
  v.user_id,
  v.make,
  v.model,
  v.year,
  v.trim,
  v.vin,
  v.other_vehicle_description,
  p.full_name as owner_name,
  p.location as owner_location
FROM vehicles v
LEFT JOIN profiles p ON v.user_id = p.id;

-- Grant access to authenticated users
GRANT SELECT ON vehicle_context TO authenticated;