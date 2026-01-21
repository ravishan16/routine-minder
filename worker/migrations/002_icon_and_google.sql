-- Add icon field to routines table
ALTER TABLE routines ADD COLUMN icon TEXT DEFAULT '✅';

-- Add google_id to users table for Google Sign-In
-- Note: email column already exists in 001_init.sql
ALTER TABLE users ADD COLUMN google_id TEXT;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
