# Routine Minder - Daily Habit Tracker

A mobile-first daily habit tracker application that helps users maintain and monitor recurring daily routines across different times of day.

## Overview

Routine Minder is a clean, minimalist habit tracking app inspired by Habitica and Streaks. It allows users to:
- Track daily routines with time-based categories (AM, Noon, PM, All Day)
- View completion progress with streaks and milestones
- Navigate between dates to view/update past entries
- Share progress and achievements

## Project Architecture

### Frontend (client/)
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS with shadcn/ui components
- **Theme**: Light/dark mode support

### Backend (server/)
- **Framework**: Express.js
- **Storage**: In-memory storage (MemStorage class)
- **API**: RESTful endpoints for routines, completions, dashboard stats, and settings

### Shared (shared/)
- **Schema**: Zod schemas for type validation
- **Types**: TypeScript types shared between frontend and backend

## Key Features

### Daily Checklist
- Date navigation with swipeable interface
- Progress bar showing daily completion
- Routines grouped by time category (Morning, Noon, Evening, All Day)
- Checkbox toggles with strikethrough effect

### Routine Management
- Create, edit, delete routines
- Multiple time category selection per routine
- Optional notification settings per routine

### Dashboard
- Time range filters (7 days, 30 days, YTD, All Time)
- Stats: Current streak, longest streak, completed count, total tasks
- Completion rate with motivational messages
- Per-routine streak tracking with milestone badges
- Sharing functionality for stats and individual routines

### Milestones
- 7 days (1 Week)
- 21 days
- 30 days (1 Month)
- 50 days
- 100 days
- 365 days (1 Year)

## Color Palette

| Purpose    | Color       | Hex     |
|------------|-------------|---------|
| Primary    | Calm Blue   | #5B7C99 |
| Secondary  | Soft Sky    | #E8F1F5 |
| Accent     | Success Green | #4CAF50 |
| Background | Off-White   | #FAFBFC |
| Text       | Dark Slate  | #2C3E50 |
| Warning    | Orange      | #FF9800 |

## API Endpoints

### Routines
- `GET /api/routines` - Get all routines
- `GET /api/routines/daily?param0=YYYY-MM-DD` - Get routines with completion status
- `POST /api/routines` - Create routine
- `PUT /api/routines/:id` - Update routine
- `DELETE /api/routines/:id` - Delete routine

### Completions
- `POST /api/completions` - Toggle completion
- `GET /api/completions?date=YYYY-MM-DD` - Get completions for date

### Dashboard
- `GET /api/dashboard?param0=7d|30d|ytd|all` - Get dashboard stats
- `GET /api/dashboard/routines?param0=7d|30d|ytd|all` - Get per-routine stats

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings

## Development

The app runs on port 5000 with both frontend and backend served from the same origin.

```bash
npm run dev
```

## User Preferences
- Mobile-first design optimized for fast daily interactions
- Clean, distraction-free interface
- Inter font family
- Card-based layout with subtle shadows
