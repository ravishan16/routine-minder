# Routine Minder

A simple, privacy-focused daily habit tracker PWA with offline-first architecture.

![Routine Minder](https://img.shields.io/badge/PWA-Ready-5B7C99?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## Features

- ✅ **Daily Routine Tracking** - Check off routines by time of day (AM/Noon/PM/All Day)
- � **Google Sign-In** - Cross-device sync with your Google account
- 🎮 **Gamification** - XP, levels, achievements, and streak multipliers
- 🔥 **Streak Tracking** - Build momentum with daily streaks and personal bests
- 📊 **Dashboard** - View completion rates, achievements, and per-routine stats
- 🏆 **Achievements** - Unlock badges for milestones (7/21/30/100/365-day streaks)
- 🌙 **Dark Mode** - Warm coral/teal theme with dark mode support
- 📱 **PWA** - Install on iPhone/Android like a native app
- 📴 **Offline-First** - Works without internet, syncs when connected
- 🔐 **Privacy-First** - Your data stays yours, delete account anytime

## Architecture

```
┌─────────────────────┐     ┌─────────────────────────────┐
│                     │     │                             │
│   React PWA         │────▶│   Cloudflare Worker         │
│   (Cloudflare Pages)│     │   (Hono API)                │
│                     │◀────│                             │
└─────────────────────┘     └──────────────┬──────────────┘
        │                                  │
        │ localStorage                     │
        │ (offline-first)                  ▼
        ▼                   ┌─────────────────────────────┐
┌─────────────────────┐     │                             │
│   Service Worker    │     │   Cloudflare D1             │
│   (Workbox)         │     │   (SQLite Database)         │
└─────────────────────┘     └─────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- Cloudflare account (free tier works)
- Wrangler CLI (`npm install -g wrangler`)

### 1. Clone & Install

```bash
git clone https://github.com/ravishan16/routine-minder.git
cd routine-minder
npm install
```

### 2. Set Up Cloudflare D1 Database

```bash
cd worker

# Login to Cloudflare
wrangler login

# Create the D1 database
wrangler d1 create routine-minder-db

# Copy the database_id from output and update worker/wrangler.toml
# Replace "placeholder" with your actual database ID

# Run the migration
wrangler d1 execute routine-minder-db --file=./migrations/001_init.sql
```

### 3. Deploy the Worker API

```bash
cd worker
wrangler deploy
```

Note the deployed URL (e.g., `https://routine-minder-api.your-subdomain.workers.dev`)

### 4. Configure & Deploy the Frontend

```bash
# Back to root
cd ..

# Update API URL in client/src/lib/storage.ts if needed
# Default: https://routine-minder-api.ravishankars.workers.dev

# Build and deploy to Cloudflare Pages
npm run build
npx wrangler pages deploy dist --project-name=routine-minder
```

### Automated Deployment (GitHub Actions)

The project includes GitHub Actions for automatic deployment:

1. Add these secrets to your GitHub repository:
   - `CLOUDFLARE_API_TOKEN` - API token with Workers/Pages permissions
   - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

2. Push to `main` branch - GitHub Actions will:
   - Deploy the Worker API
   - Build and deploy the PWA to Cloudflare Pages

## Development

```bash
# Install dependencies
npm install

# Start development server (frontend)
npm run dev

# In another terminal, start worker locally
cd worker
wrangler dev

# Type check
npm run check

# Build for production
npm run build

# Preview production build
npm run preview
```

### Worker Development

```bash
cd worker

# Run locally with D1 simulator
wrangler dev

# Run local migration
wrangler d1 execute routine-minder-db --local --file=./migrations/001_init.sql

# Deploy to production
wrangler deploy
```

## Project Structure

```
routine-minder/
├── client/                  # React PWA
│   ├── public/              # Static assets & PWA icons
│   │   └── icons/           # SVG app icons
│   └── src/
│       ├── components/      # UI components
│       │   ├── ui/          # shadcn/ui primitives
│       │   ├── landing-page.tsx
│       │   ├── error-boundary.tsx
│       │   └── ...
│       ├── hooks/           # React hooks
│       ├── lib/             # Core logic
│       │   ├── storage.ts   # localStorage + API sync
│       │   ├── schema.ts    # TypeScript types
│       │   ├── achievements.ts # Gamification system
│       │   └── utils.ts     # Utilities
│       └── pages/           # Page components
│           ├── today.tsx    # Main daily view
│           ├── dashboard.tsx # Gamified dashboard
│           ├── routines.tsx
│           ├── settings.tsx
│           ├── privacy.tsx  # Privacy policy
│           ├── terms.tsx    # Terms of service
│           └── about.tsx    # Features & install
├── worker/                  # Cloudflare Worker API
│   ├── src/
│   │   └── index.ts         # Hono API routes
│   ├── migrations/
│   │   └── 001_init.sql     # D1 schema
│   ├── wrangler.toml        # Worker config
│   └── package.json
├── package.json
├── vite.config.ts           # Vite + PWA configuration
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/device` | Register device & get user ID |
| POST | `/api/auth/google` | Google sign-in & cross-device sync |
| GET | `/api/routines` | List all routines |
| POST | `/api/routines` | Create a routine |
| PUT | `/api/routines/:id` | Update a routine |
| DELETE | `/api/routines/:id` | Soft-delete a routine (preserves history) |
| GET | `/api/completions` | Get completions (with ?date or ?days) |
| POST | `/api/completions/toggle` | Toggle completion status |
| GET | `/api/dashboard` | Get dashboard statistics |
| POST | `/api/sync` | Bulk sync from localStorage |
| DELETE | `/api/users/:userId` | Delete account and all data |

## How It Works

### Offline-First Storage

1. **localStorage is the source of truth** - All reads come from localStorage first
2. **Background sync** - Changes are synced to D1 when online
3. **Conflict resolution** - Last-write-wins for simplicity
4. **Service Worker** - Caches static assets for offline use

### Device-Based Authentication

1. First visit generates a unique device ID (UUID)
2. Device ID is sent to API to create/retrieve user
3. User ID stored in localStorage for subsequent requests
4. Sign in with Google to enable cross-device sync

### Cross-Device Sync

1. Sign in with Google on any device
2. Server looks up user by Google ID
3. Returns same user ID across all devices
4. Data syncs automatically via background sync

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite 7 |
| Styling | Tailwind CSS, shadcn/ui |
| State | TanStack React Query |
| Routing | Wouter |
| PWA | vite-plugin-pwa (Workbox) |
| API | Cloudflare Workers, Hono |
| Database | Cloudflare D1 (SQLite) |
| Hosting | Cloudflare Pages |

## Customization

### App Branding

Update these files:
- `vite.config.ts` - PWA manifest (name, colors)
- `client/public/icons/icon.svg` - App icon
- `client/index.html` - Title and meta tags

### Achievement System

Edit `client/src/lib/achievements.ts` to customize:
- XP per completion and streak multipliers
- Level thresholds and names
- Achievement badges and requirements

### API URL

Update the default API URL in `client/src/lib/storage.ts`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || "https://your-worker.workers.dev";
```

## Troubleshooting

### "Connection Failed" error
- Check that the Worker is deployed and running
- Verify the API URL in storage.ts matches your Worker URL
- Check browser console for CORS errors

### Data not syncing
- Check if you're online (offline mode uses localStorage only)
- Verify the Worker has proper D1 bindings
- Check Worker logs: `wrangler tail`

### PWA not installing
- Ensure you're using HTTPS (Cloudflare Pages provides this)
- iOS: Must use Safari browser
- Android: Must use Chrome browser

### D1 database issues
- Run migrations: `wrangler d1 execute routine-minder-db --file=./migrations/001_init.sql`
- Check database: `wrangler d1 execute routine-minder-db --command="SELECT * FROM users"`

## License

MIT License - feel free to use this for your own projects!

## Contributing

Contributions are welcome! Please open an issue or PR.

---

Made with ❤️ for better habits
