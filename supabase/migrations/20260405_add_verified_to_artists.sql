-- Add verified badge to artists
ALTER TABLE artists ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT true;

-- All existing artists are verified by default (created by the platform)
UPDATE artists SET is_verified = true WHERE is_verified IS NULL;
