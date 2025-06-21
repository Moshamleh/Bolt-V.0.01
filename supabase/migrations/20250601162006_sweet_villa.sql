ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS push_notifications_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS email_updates_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS ai_repair_tips_enabled boolean DEFAULT true;