/*
  # Fix Duplicate Challenges and Add Unique Constraint

  1. New Tables
    - No new tables created

  2. Security
    - No security changes

  3. Changes
    - Identify and remove duplicate challenges
    - Add unique constraint to challenges.name column
    - Fix any references to duplicate challenges
*/

-- First, identify duplicate challenge names
DO $$ 
DECLARE
  duplicate_record RECORD;
  keep_id UUID;
  duplicate_ids UUID[];
BEGIN
  -- Find all challenge names that have duplicates
  FOR duplicate_record IN 
    SELECT name, COUNT(*), array_agg(id) as ids
    FROM public.challenges
    GROUP BY name
    HAVING COUNT(*) > 1
  LOOP
    RAISE NOTICE 'Found duplicate challenge: % with % occurrences', 
      duplicate_record.name, duplicate_record.count;
    
    -- Keep the first ID and mark others for deletion
    keep_id := (duplicate_record.ids)[1];
    duplicate_ids := duplicate_record.ids[2:array_length(duplicate_record.ids, 1)];
    
    RAISE NOTICE 'Keeping ID: %, removing IDs: %', keep_id, duplicate_ids;
    
    -- Update any user_challenges referencing the duplicates to point to the one we're keeping
    UPDATE public.user_challenges
    SET challenge_id = keep_id
    WHERE challenge_id = ANY(duplicate_ids);
    
    -- Delete the duplicate challenges
    DELETE FROM public.challenges
    WHERE id = ANY(duplicate_ids);
    
    RAISE NOTICE 'Removed duplicates for challenge: %', duplicate_record.name;
  END LOOP;
END $$;

-- Now add a unique constraint to prevent future duplicates
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_challenge_name'
  ) THEN
    ALTER TABLE public.challenges
    ADD CONSTRAINT unique_challenge_name UNIQUE (name);
    
    RAISE NOTICE 'Added unique constraint on challenges.name';
  ELSE
    RAISE NOTICE 'Unique constraint already exists on challenges.name';
  END IF;
END $$;