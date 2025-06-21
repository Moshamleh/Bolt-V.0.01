/*
  # Fix column definition list error in update_challenge_progress function

  1. Changes
     - Update the update_challenge_progress function to properly handle the RECORD type returned by award_xp
     - Declare individual variables for the returned values instead of using a single RECORD variable
     - Explicitly specify the column names when calling the award_xp function

  This migration fixes the error "a column definition list is required for functions returning record"
  by properly handling the RECORD type returned by the award_xp function.
*/

-- Update the update_challenge_progress function to properly handle the RECORD type
CREATE OR REPLACE FUNCTION update_challenge_progress()
RETURNS TRIGGER AS $$
DECLARE
  xp_result_new_xp INTEGER;
  xp_result_new_level INTEGER;
  xp_result_level_up_occurred BOOLEAN;
BEGIN
  -- Check if the challenge is completed
  IF NEW.current_progress >= (SELECT target_value FROM challenges WHERE id = NEW.challenge_id) AND NOT NEW.completed THEN
    -- Mark as completed
    NEW.completed := TRUE;
    NEW.completed_at := now();
    
    -- Award XP - explicitly specify the column names for the RECORD type
    SELECT new_xp, new_level, level_up_occurred INTO 
      xp_result_new_xp, xp_result_new_level, xp_result_level_up_occurred
    FROM award_xp(
      NEW.user_id, 
      (SELECT xp_reward FROM challenges WHERE id = NEW.challenge_id), 
      'Completed challenge: ' || (SELECT name FROM challenges WHERE id = NEW.challenge_id)
    );
    
    -- Award badge if applicable
    IF EXISTS (SELECT 1 FROM challenges WHERE id = NEW.challenge_id AND badge_reward_id IS NOT NULL) THEN
      -- Check if user already has this badge
      IF NOT EXISTS (
        SELECT 1 FROM user_badges 
        WHERE user_id = NEW.user_id AND badge_id = (SELECT badge_reward_id FROM challenges WHERE id = NEW.challenge_id)
      ) THEN
        -- Award the badge
        INSERT INTO user_badges (user_id, badge_id, note)
        VALUES (
          NEW.user_id, 
          (SELECT badge_reward_id FROM challenges WHERE id = NEW.challenge_id), 
          'Awarded for completing challenge: ' || (SELECT name FROM challenges WHERE id = NEW.challenge_id)
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;