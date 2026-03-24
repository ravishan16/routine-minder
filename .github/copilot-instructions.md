
# Copilot Workspace Instructions for Routine Minder

## Purpose
These instructions guide GitHub Copilot and AI agents to work productively in the Routine Minder codebase, ensuring architectural consistency, type safety, and adherence to the "offline-first" philosophy.

---


## Key Links
- [Architecture & Design Guide](../ARCHITECTURE.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [Roadmap](../ROADMAP.md)
- [README](../README.md)
- [Google Brand Verification](../GOOGLE_VERIFICATION.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Design](../design/humble_hearth/DESIGN.md)

---


## Build & Test Commands
**Frontend (Root):**
- Dev: `npm run dev`
- Build/Type-Check: `npm run build`
- Test: `npm run test` (Vitest)
- E2E: `npm run test:e2e` (Playwright)

**Backend (Worker Directory):**
- Dev: `npm run dev` (Wrangler/Hono)
- Deploy: `npm run deploy`
- Database: `npm run db:create` | `npm run db:migrate`

---


## Architecture Principles
- **Offline-First:** IndexedDB/LocalStorage is the primary data source. UI must be optimistic and functional without a network connection.
- **Unified Type Safety:** Shared Zod schemas should define the contract between the React frontend and the Hono worker.
- **Edge-Ready:** Backend logic must remain lightweight for Cloudflare Workers; avoid heavy Node.js-specific dependencies.
- **Design System:** Use shadcn/ui components exclusively. Do not create raw CSS unless absolutely necessary; use Tailwind utility classes.

---


## Conventions & Patterns
- **Directory Logic:**
  - `client/src/components/ui/`: Atomic primitives (shadcn). Do not edit directly.
  - `client/src/components/`: Feature-specific components.
  - `client/src/hooks/`: All data fetching and sync logic (TanStack Query).
- **Zod-First Development:** Define the schema in shared/ (or equivalent) before implementing the UI form or API endpoint.
- **Sync Pattern:**
  1. `onSuccess` in React Query updates the local cache.
  2. A background worker or service worker handles the transition to Cloudflare D1.
- **PWA Management:** Use the `useRegisterSW` hook from `virtual:pwa-register/react` to handle update prompts and offline readiness.

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