/*
  # Create award_xp PostgreSQL function

  1. New Functions
    - `get_xp_for_level` - Calculates the XP required for a specific level
    - `award_xp` - Awards XP to a user, handles level-up logic, and logs the XP change

  2. Changes
    - Updates the `update_challenge_progress` function to use the new `award_xp` function
    - Ensures consistent XP calculation between client and server

  This migration centralizes XP awarding logic in the database, making it robust and consistent
  across all parts of the application.
*/

-- Create a function to calculate XP required for a specific level
CREATE OR REPLACE FUNCTION get_xp_for_level(level_num INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- This should match the formula in src/lib/xpSystem.ts
  RETURN FLOOR(100 * POWER(level_num, 1.5));
END;
$$ LANGUAGE plpgsql;

-- Create a function to award XP to a user
CREATE OR REPLACE FUNCTION award_xp(
  user_id UUID,
  amount INTEGER,
  reason TEXT DEFAULT NULL
)
RETURNS RECORD AS $$
DECLARE
  current_xp INTEGER;
  current_level INTEGER;
  new_xp INTEGER;
  new_level INTEGER;
  xp_for_next_level INTEGER;
  level_up_occurred BOOLEAN := FALSE;
  result RECORD;
BEGIN
  -- Get current XP and level
  SELECT xp, level INTO current_xp, current_level
  FROM users
  WHERE id = user_id;
  
  IF current_xp IS NULL THEN
    current_xp := 0;
  END IF;
  
  IF current_level IS NULL THEN
    current_level := 1;
  END IF;
  
  -- Calculate new XP
  new_xp := current_xp + amount;
  new_level := current_level;
  
  -- Check if user leveled up
  LOOP
    xp_for_next_level := get_xp_for_level(new_level + 1);
    
    -- If user has enough XP for the next level, level up
    IF new_xp >= xp_for_next_level THEN
      new_level := new_level + 1;
      level_up_occurred := TRUE;
    ELSE
      EXIT; -- Exit the loop if no more level ups
    END IF;
  END LOOP;
  
  -- Update user's XP and level
  UPDATE users
  SET 
    xp = new_xp,
    level = new_level
  WHERE id = user_id;
  
  -- Log the XP change
  IF reason IS NOT NULL THEN
    INSERT INTO xp_logs (
      user_id,
      amount,
      reason,
      previous_xp,
      new_xp,
      previous_level,
      new_level
    ) VALUES (
      user_id,
      amount,
      reason,
      current_xp,
      new_xp,
      current_level,
      new_level
    );
  END IF;
  
  -- Return the updated values
  SELECT new_xp, new_level, level_up_occurred INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update the update_challenge_progress function to use the new award_xp function
CREATE OR REPLACE FUNCTION update_challenge_progress()
RETURNS TRIGGER AS $$
DECLARE
  xp_result RECORD;
BEGIN
  -- Check if the challenge is completed
  IF NEW.current_progress >= (SELECT target_value FROM challenges WHERE id = NEW.challenge_id) AND NOT NEW.completed THEN
    -- Mark as completed
    NEW.completed := TRUE;
    NEW.completed_at := now();
    
    -- Award XP
    SELECT * INTO xp_result FROM award_xp(
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