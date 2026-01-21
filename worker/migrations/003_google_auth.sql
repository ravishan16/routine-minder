-- Migration: Make google_id the primary lookup for cross-device sync
-- When a user signs in with Google on any device, they get their existing data

-- Add unique constraint on google_id (allows NULL for anonymous users, but unique when set)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

-- Add display_name and photo_url for Google profile info
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN photo_url TEXT;
