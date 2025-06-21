/*
  # Add XP and Level Columns to Users Table

  1. New Columns
    - `xp` (integer, default 0) - Tracks user experience points
    - `level` (integer, default 1) - Tracks user level
  
  2. Functions
    - `get_xp_for_level` - Calculates XP needed for a specific level
    - `check_level_up` - Checks if user has enough XP to level up
    - `award_level_badge` - Awards badges when users reach certain levels
  
  3. Triggers
    - `check_level_up_trigger` - Automatically updates level when XP increases
    - `award_level_badge_trigger` - Awards badges when level increases
*/

-- Add XP and Level columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='xp') THEN
    ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='level') THEN
    ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1;
  END IF;
END $$;

-- Create badges for different levels if they don't exist
INSERT INTO badges (name, description, rarity, icon_url)
SELECT 'Road Wrench', 'Reached level 2 in Bolt Auto', 'common', 'https://cdn-icons-png.flaticon.com/512/1995/1995470.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Road Wrench');

INSERT INTO badges (name, description, rarity, icon_url)
SELECT 'Engine Expert', 'Reached level 5 in Bolt Auto', 'milestone', 'https://cdn-icons-png.flaticon.com/512/2061/2061956.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Engine Expert');

INSERT INTO badges (name, description, rarity, icon_url)
SELECT 'Master Mechanic', 'Reached level 10 in Bolt Auto', 'rare', 'https://cdn-icons-png.flaticon.com/512/1995/1995450.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Master Mechanic');

-- Create function to award level badges
CREATE OR REPLACE FUNCTION award_level_badge()
RETURNS TRIGGER AS $$
DECLARE
  badge_id uuid;
  badge_name text;
BEGIN
  -- Determine which badge to award based on new level
  IF NEW.level = 2 THEN
    badge_name := 'Road Wrench';
  ELSIF NEW.level = 5 THEN
    badge_name := 'Engine Expert';
  ELSIF NEW.level = 10 THEN
    badge_name := 'Master Mechanic';
  ELSE
    -- No badge to award for this level
    RETURN NEW;
  END IF;

  -- Get the badge ID
  SELECT id INTO badge_id FROM badges WHERE name = badge_name;
  
  -- Award the badge if it exists and user doesn't already have it
  IF badge_id IS NOT NULL THEN
    INSERT INTO user_badges (user_id, badge_id, note)
    VALUES (NEW.id, badge_id, 'Awarded for reaching level ' || NEW.level)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to award badges on level up
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'award_level_badge_trigger'
  ) THEN
    CREATE TRIGGER award_level_badge_trigger
    AFTER UPDATE OF level ON users
    FOR EACH ROW
    WHEN (NEW.level > OLD.level)
    EXECUTE FUNCTION award_level_badge();
  END IF;
END $$;

-- Create function to calculate XP needed for a level
CREATE OR REPLACE FUNCTION get_xp_for_level(level_num integer)
RETURNS integer AS $$
BEGIN
  -- Simple formula: 100 * level^1.5
  RETURN FLOOR(100 * POWER(level_num, 1.5));
END;
$$ LANGUAGE plpgsql;

-- Create function to check and update level based on XP
CREATE OR REPLACE FUNCTION check_level_up()
RETURNS TRIGGER AS $$
DECLARE
  current_level integer;
  next_level integer;
  xp_needed integer;
BEGIN
  current_level := NEW.level;
  next_level := current_level + 1;
  xp_needed := get_xp_for_level(next_level);
  
  -- Check if user has enough XP to level up
  WHILE NEW.xp >= xp_needed LOOP
    NEW.level := next_level;
    current_level := next_level;
    next_level := current_level + 1;
    xp_needed := get_xp_for_level(next_level);
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check for level up when XP changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'check_level_up_trigger'
  ) THEN
    CREATE TRIGGER check_level_up_trigger
    BEFORE UPDATE OF xp ON users
    FOR EACH ROW
    WHEN (NEW.xp > OLD.xp)
    EXECUTE FUNCTION check_level_up();
  END IF;
END $$;