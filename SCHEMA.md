# SCHEMA.md - Routine Minder D1 Database Reference

This file documents the current state of the Cloudflare D1 database (SQLite) for Routine Minder.

## Tables

### `users`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique user ID (UUID) |
| `device_id` | TEXT | UNIQUE, NOT NULL | ID for anonymous device mapping |
| `google_id` | TEXT | UNIQUE | For account linking/sync |
| `email` | TEXT | | Google account email |
| `display_name`| TEXT | | User's preferred name |
| `photo_url` | TEXT | | Profile picture URL |
| `best_streak` | INTEGER| DEFAULT 0 | Persistence for gamification |
| `total_xp` | INTEGER| DEFAULT 0 | Total XP earned |
| `level` | INTEGER| DEFAULT 1 | Current level |
| `created_at` | TEXT | NOT NULL | ISO-8601 timestamp |

### `routines`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique routine ID |
| `user_id` | TEXT | FOREIGN KEY | References `users.id` |
| `name` | TEXT | NOT NULL | Routine name |
| `icon` | TEXT | DEFAULT '✅' | Emoji or icon identifier |
| `time_categories` | TEXT | NOT NULL | JSON array: `["AM", "NOON", "PM"]` |
| `is_active` | INTEGER| DEFAULT 1 | Toggles daily visibility |
| `is_deleted` | INTEGER| DEFAULT 0 | Soft-delete flag |
| `sort_order` | INTEGER| DEFAULT 0 | Custom user ordering |
| `created_at` | TEXT | NOT NULL | ISO-8601 timestamp |

### `completions`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique completion ID |
| `routine_id` | TEXT | FOREIGN KEY | References `routines.id` |
| `date` | TEXT | NOT NULL | YYYY-MM-DD format |
| `time_category`| TEXT | NOT NULL | `AM`, `NOON`, or `PM` |
| `completed_at`| TEXT | NOT NULL | ISO-8601 timestamp |

### `achievements`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique achievement ID |
| `user_id` | TEXT | FOREIGN KEY | References `users.id` |
| `achievement_type` | TEXT | NOT NULL | Category of achievement |
| `achievement_key` | TEXT | UNIQUE | Specific identifier for the badge |
| `unlocked_at` | TEXT | NOT NULL | ISO-8601 timestamp |

## Indexes & Constraints
- **`idx_routines_unique_name`**: Unique index on `(user_id, name)` where `is_deleted = 0`. Prevents duplicate routine names for the same user.
- **`idx_completions_unique`**: Unique index on `(routine_id, date, time_category)`. Prevents duplicate completion records for the same routine/date/time.
- **`idx_users_google_id`**: Unique index on `google_id` (non-null values) for cross-device authentication.
