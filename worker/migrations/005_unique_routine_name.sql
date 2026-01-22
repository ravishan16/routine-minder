-- Migration 005: Add unique constraint on routine name per user
-- Prevents duplicate routines with same name for the same user

-- First, clean up any existing duplicates (keep the one with earliest created_at)
DELETE FROM routines
WHERE id NOT IN (
  SELECT MIN(id) FROM routines
  WHERE is_deleted = 0 OR is_deleted IS NULL
  GROUP BY user_id, name
)
AND name IN (
  SELECT name FROM routines
  WHERE is_deleted = 0 OR is_deleted IS NULL
  GROUP BY user_id, name
  HAVING COUNT(*) > 1
);

-- Add unique constraint for active routines (user_id + name + not deleted)
-- Note: SQLite doesn't support partial unique indexes well, so we create a 
-- unique index on the combination including is_deleted=0
CREATE UNIQUE INDEX IF NOT EXISTS idx_routines_unique_name 
ON routines(user_id, name) 
WHERE is_deleted = 0 OR is_deleted IS NULL;
