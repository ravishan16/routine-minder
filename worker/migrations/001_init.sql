-- Routine Minder D1 Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_device ON users(device_id);

-- Routines table
CREATE TABLE IF NOT EXISTS routines (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  time_categories TEXT NOT NULL, -- JSON array: ["AM", "NOON", "PM"]
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_routines_user ON routines(user_id);

-- Completions table
CREATE TABLE IF NOT EXISTS completions (
  id TEXT PRIMARY KEY,
  routine_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  time_category TEXT NOT NULL, -- AM, NOON, or PM
  completed_at TEXT NOT NULL,
  FOREIGN KEY (routine_id) REFERENCES routines(id)
);

CREATE INDEX IF NOT EXISTS idx_completions_routine ON completions(routine_id);
CREATE INDEX IF NOT EXISTS idx_completions_date ON completions(date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_completions_unique ON completions(routine_id, date, time_category);
