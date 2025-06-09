ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS dark_mode_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS diagnostic_suggestions_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en';