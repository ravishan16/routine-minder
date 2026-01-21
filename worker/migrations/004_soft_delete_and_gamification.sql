-- Migration 004: Soft delete for routines and gamification support
-- This preserves completion history when routines are deleted

-- Add is_deleted column to routines for soft delete
ALTER TABLE routines ADD COLUMN is_deleted INTEGER DEFAULT 0;

-- Add best_streak to users for persistence
ALTER TABLE users ADD COLUMN best_streak INTEGER DEFAULT 0;

-- Add total_xp to users for gamification
ALTER TABLE users ADD COLUMN total_xp INTEGER DEFAULT 0;

-- Add level to users
ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1;

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_key TEXT NOT NULL,
  unlocked_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index for looking up user achievements
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);

-- Unique constraint to prevent duplicate achievements
CREATE UNIQUE INDEX IF NOT EXISTS idx_achievements_unique ON achievements(user_id, achievement_key);
