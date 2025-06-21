/*
  # Create AI metrics function

  1. New Functions
    - `get_ai_metrics_by_vehicle` - Returns AI feedback metrics grouped by vehicle
  
  2. Purpose
    - Provides aggregated data about AI diagnostic performance by vehicle make/model/year
    - Used by the admin dashboard to display AI performance metrics
*/

-- Function to get AI metrics by vehicle
CREATE OR REPLACE FUNCTION get_ai_metrics_by_vehicle()
RETURNS TABLE (
  make TEXT,
  model TEXT,
  year INTEGER,
  helpfulCount BIGINT,
  unhelpfulCount BIGINT
) LANGUAGE SQL AS $$
  SELECT 
    v.make,
    v.model,
    v.year,
    COUNT(CASE WHEN al.was_helpful = true THEN 1 END) AS helpfulCount,
    COUNT(CASE WHEN al.was_helpful = false THEN 1 END) AS unhelpfulCount
  FROM 
    ai_logs al
    JOIN diagnoses d ON al.diagnosis_id = d.id
    JOIN vehicles v ON d.vehicle_id = v.id
  WHERE 
    v.make IS NOT NULL AND v.model IS NOT NULL AND v.year IS NOT NULL
  GROUP BY 
    v.make, v.model, v.year
  HAVING 
    COUNT(al.id) > 0
  ORDER BY 
    COUNT(al.id) DESC;
$$;