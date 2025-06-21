/*
  # Clean up user_challenges duplicates and improve error handling

  1. New Tables
    - No new tables created

  2. Changes
    - Identify and remove duplicate entries in user_challenges table
    - Ensure unique constraint on user_id and challenge_id is enforced
    - Add error handling for challenge lookup by name

  3. Security
    - No security changes
*/

-- First, identify and clean up duplicate user_challenges entries
DO $$ 
DECLARE
  duplicate_record RECORD;
  keep_id UUID;
  duplicate_ids UUID[];
BEGIN
  -- Find all user_id, challenge_id pairs that have duplicates
  FOR duplicate_record IN 
    SELECT user_id, challenge_id, COUNT(*), array_agg(id) as ids
    FROM public.user_challenges
    GROUP BY user_id, challenge_id
    HAVING COUNT(*) > 1
  LOOP
    RAISE NOTICE 'Found duplicate user_challenge: user_id=%, challenge_id=% with % occurrences', 
      duplicate_record.user_id, duplicate_record.challenge_id, duplicate_record.count;
    
    -- Keep the entry with the highest current_progress
    SELECT id INTO keep_id
    FROM public.user_challenges
    WHERE user_id = duplicate_record.user_id AND challenge_id = duplicate_record.challenge_id
    ORDER BY current_progress DESC, last_updated DESC
    LIMIT 1;
    
    -- Get IDs to delete (all except the one we're keeping)
    SELECT array_agg(id) INTO duplicate_ids
    FROM public.user_challenges
    WHERE user_id = duplicate_record.user_id 
      AND challenge_id = duplicate_record.challenge_id
      AND id != keep_id;
    
    RAISE NOTICE 'Keeping ID: %, removing IDs: %', keep_id, duplicate_ids;
    
    -- Delete the duplicates
    DELETE FROM public.user_challenges
    WHERE id = ANY(duplicate_ids);
    
    RAISE NOTICE 'Removed duplicates for user_id=%, challenge_id=%', 
      duplicate_record.user_id, duplicate_record.challenge_id;
  END LOOP;
END $$;

-- Ensure the unique constraint exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_challenges_user_id_challenge_id_key'
  ) THEN
    ALTER TABLE public.user_challenges
    ADD CONSTRAINT user_challenges_user_id_challenge_id_key UNIQUE (user_id, challenge_id);
    
    RAISE NOTICE 'Added unique constraint on user_challenges (user_id, challenge_id)';
  ELSE
    RAISE NOTICE 'Unique constraint already exists on user_challenges (user_id, challenge_id)';
  END IF;
END $$;

-- Create a function to safely get challenge ID by name
CREATE OR REPLACE FUNCTION get_challenge_id_by_name(challenge_name TEXT)
RETURNS UUID AS $$
DECLARE
  challenge_id UUID;
BEGIN
  SELECT id INTO challenge_id
  FROM challenges
  WHERE name = challenge_name;
  
  IF challenge_id IS NULL THEN
    RAISE EXCEPTION 'Challenge not found: %', challenge_name;
  END IF;
  
  RETURN challenge_id;
END;
$$ LANGUAGE plpgsql;