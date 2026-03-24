# GEMINI.md - Routine Minder Instructions

## Core Patterns
- **Data Logic Location**: All data fetching, sync, and `localStorage` logic must reside in `client/src/lib/storage.ts`. Avoid creating new hooks for these tasks.
- **Vite Environment**: Place environment variables (`VITE_API_URL`, etc.) in `client/.env.local` for detection. The root `.env` is for reference only.
- **Wrangler Context**: Use `--config worker/wrangler.toml` when executing `wrangler` commands from the project root.
- **Offline-First**: Treat `localStorage` as the primary data source; background sync to D1 handles cross-device updates.

## Technical Quirks
- **Zod Schemas**: Schemas are located in `client/src/lib/schema.ts` and are shared with the worker by manual type matching.
- **Node.js**: The project requires Node.js **22+** for CI and local development.
- **API Security**: The `X-API-Key` header is mandatory for all `/api/*` requests except health checks.

## Styling & Design
- **Glassmorphism**: Use the `.glass` and `.glass-card` Tailwind utilities defined in `client/src/index.css`.
- **Future Design**: Refer to `design/humble_hearth/DESIGN.md` for the planned "Living Journal" aesthetic.
