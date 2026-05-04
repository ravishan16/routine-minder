-- Migration 006: Oura OAuth integration
-- Stores OAuth tokens per user and short-lived auth states for CSRF protection

CREATE TABLE IF NOT EXISTS oura_connections (
  user_id TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT,
  scope TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_oura_connections_updated_at
ON oura_connections(updated_at);

CREATE TABLE IF NOT EXISTS oura_oauth_states (
  state TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_oura_oauth_states_user
ON oura_oauth_states(user_id);

CREATE INDEX IF NOT EXISTS idx_oura_oauth_states_expires
ON oura_oauth_states(expires_at);
