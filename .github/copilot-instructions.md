
# Copilot Workspace Instructions for Routine Minder

## Purpose
These instructions guide GitHub Copilot and AI agents to work productively in the Routine Minder codebase, ensuring architectural consistency, type safety, and adherence to the "offline-first" philosophy.

---


## Key Links
- [Architecture & Design Guide](../ARCHITECTURE.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [Roadmap](../ROADMAP.md)
- [README](../README.md)
- [Design (Humble Hearth)](../design/humble_hearth/DESIGN.md)
- [Mockups (Mobile Designs)](../design/)

---


## Build & Test Commands
**Frontend (Root):**
- Node Version: `22`
- Dev: `npm run dev`
- Build/Type-Check: `npm run build`
- Test: `npm run test` (Vitest)
- E2E: `npm run test:e2e` (Playwright)

**Backend (Worker Directory):**
- Node Version: `22`
- Dev: `npm run dev` (Wrangler/Hono)
- Deploy: `npm run deploy`
- Database: `npm run db:create` | `npm run db:migrate`

---


## Architecture Principles
- **Offline-First:** LocalStorage is the primary data source (implemented in `client/src/lib/storage.ts`). UI must be optimistic and functional without a network connection.
- **Type Safety:** Shared types in `client/src/lib/schema.ts` define the contract between the React frontend and the Hono worker.
- **Edge-Ready:** Backend logic must remain lightweight for Cloudflare Workers; avoid heavy Node.js-specific dependencies.
- **Design System:** Use shadcn/ui components exclusively. Do not create raw CSS unless absolutely necessary; use Tailwind utility classes.
- **Future Design:** Refer to `design/humble_hearth/DESIGN.md` for the "Living Journal" aesthetic planned for future implementation.

---


## Conventions & Patterns
- **Directory Logic:**
  - `client/src/components/ui/`: Atomic primitives (shadcn). Do not edit directly.
  - `client/src/components/`: Feature-specific components.
  - `client/src/lib/storage.ts`: All data fetching, sync logic, and TanStack Query function implementations.
  - `client/src/pages/`: Page-level components where TanStack Query hooks are typically invoked.
- **Zod Development:** Define the schema in `client/src/lib/schema.ts` before implementing the UI form or API endpoint.
- **Sync Pattern:**
  1. `onSuccess` in React Query (in page components) invalidates relevant queries.
  2. `client/src/lib/storage.ts` handles background sync to Cloudflare D1 via `setInterval` and `online` event listeners.
- **PWA Management:** Use `vite-plugin-pwa` (Workbox) for offline readiness and asset caching.

---


## Pitfalls & Gotchas
- **Hydration Errors:** When using Framer Motion or PWA logic, ensure components are client-side safe to avoid SSR/Hydration mismatches.
- **D1 Limitations:** SQLite on the edge has specific constraints; ensure migrations are tested with `wrangler d1 execute`.
- **API Key Security:** The `X-API-Key` must be checked via Hono middleware in `worker/src/index.ts`.
- **Z-Index/Modals:** Always use shadcn’s Dialog/Sheet components to handle focus traps and portal rendering correctly.

---


## AI Agent Integration (Specific to Mathi/OpenClaw)
- When generating code, prioritize **Composition over Inheritance**.
- If adding a feature, suggest the corresponding E2E Playwright test in the same PR.
- Ensure all new API endpoints are documented with Hono's `describeRoute` or similar metadata if using OpenAPI.

---


## Example Prompts
- "Generate a Zod schema and a shadcn form for tracking a new daily habit."
- "Create a Hono middleware to validate the custom API key and log requests to D1."
- "Implement an optimistic update using React Query for the 'Mark Routine Complete' action."
- "Configure a new 'Workbox' strategy in vite.config.ts to cache routine icons."

---

## Next Steps
- Consider creating agent customizations for:
  - Automated migration checks
  - UI consistency linting
  - API contract validation

---

_Last updated: 2026-03-24_