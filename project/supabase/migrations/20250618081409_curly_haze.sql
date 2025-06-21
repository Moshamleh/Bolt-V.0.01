-- Insert Weekly Warrior badge if it doesn't exist
INSERT INTO badges (name, description, rarity, icon_url)
SELECT 'Weekly Warrior', 'Awarded for consistent activity over a week', 'milestone', 'https://cdn-icons-png.flaticon.com/512/3176/3176397.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Weekly Warrior');

-- Insert Diagnostic Detective badge if it doesn't exist
INSERT INTO badges (name, description, rarity, icon_url)
SELECT 'Diagnostic Detective', 'Awarded for running multiple diagnostics in a week', 'milestone', 'https://cdn-icons-png.flaticon.com/512/2421/2421990.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Diagnostic Detective');

-- Insert Parts Pro badge if it doesn't exist
INSERT INTO badges (name, description, rarity, icon_url)
SELECT 'Parts Pro', 'Awarded for listing multiple parts in a week', 'milestone', 'https://cdn-icons-png.flaticon.com/512/3502/3502686.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Parts Pro');

-- Insert Club Champion badge if it doesn't exist
INSERT INTO badges (name, description, rarity, icon_url)
SELECT 'Club Champion', 'Awarded for active participation in clubs', 'milestone', 'https://cdn-icons-png.flaticon.com/512/681/681494.png'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Club Champion');

-- Create a function to award weekly badges based on activity
CREATE OR REPLACE FUNCTION award_weekly_badges()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    weekly_warrior_badge_id uuid;
    diagnostic_detective_badge_id uuid;
    parts_pro_badge_id uuid;
    club_champion_badge_id uuid;
    one_week_ago timestamp with time zone := (NOW() - INTERVAL '7 days');
    diagnoses_count integer;
    parts_count integer;
    club_messages_count integer;
BEGIN
    -- Get badge IDs
    SELECT id INTO weekly_warrior_badge_id FROM badges WHERE name = 'Weekly Warrior' LIMIT 1;
    SELECT id INTO diagnostic_detective_badge_id FROM badges WHERE name = 'Diagnostic Detective' LIMIT 1;
    SELECT id INTO parts_pro_badge_id FROM badges WHERE name = 'Parts Pro' LIMIT 1;
    SELECT id INTO club_champion_badge_id FROM badges WHERE name = 'Club Champion' LIMIT 1;
    
    -- Loop through all users
    FOR user_record IN SELECT id FROM auth.users LOOP
        -- Count diagnoses in the last week
        SELECT COUNT(*) INTO diagnoses_count 
        FROM diagnoses 
        WHERE user_id = user_record.id AND timestamp > one_week_ago;
        
        -- Count parts listed in the last week
        SELECT COUNT(*) INTO parts_count 
        FROM parts 
        WHERE seller_id = user_record.id AND created_at > one_week_ago;
        
        -- Count club messages in the last week
        SELECT COUNT(*) INTO club_messages_count 
        FROM club_messages 
        WHERE sender_id = user_record.id AND created_at > one_week_ago;
        
        -- Award Weekly Warrior badge if user has been active
        IF (diagnoses_count + parts_count + club_messages_count) >= 5 THEN
            INSERT INTO user_badges (user_id, badge_id, note)
            VALUES (user_record.id, weekly_warrior_badge_id, 'Awarded for consistent activity over a week')
            ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;
        
        -- Award Diagnostic Detective badge
        IF diagnoses_count >= 3 THEN
            INSERT INTO user_badges (user_id, badge_id, note)
            VALUES (user_record.id, diagnostic_detective_badge_id, 'Awarded for running multiple diagnostics in a week')
            ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;
        
        -- Award Parts Pro badge
        IF parts_count >= 2 THEN
            INSERT INTO user_badges (user_id, badge_id, note)
            VALUES (user_record.id, parts_pro_badge_id, 'Awarded for listing multiple parts in a week')
            ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;
        
        -- Award Club Champion badge
        IF club_messages_count >= 5 THEN
            INSERT INTO user_badges (user_id, badge_id, note)
            VALUES (user_record.id, club_champion_badge_id, 'Awarded for active participation in clubs')
            ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a cron job to run the badge awarding function weekly
-- Note: This requires pg_cron extension to be enabled
-- In a real implementation, you might want to use a separate scheduled job service
COMMENT ON FUNCTION award_weekly_badges() IS 'This function awards badges based on weekly activity. It should be scheduled to run once a week.';