# AGENTS.md - Routine Minder Repository Expectations

This file provides persistent instructions for AI agents working on the Routine Minder codebase. Adhere to these rules to ensure architectural consistency and type safety.

---

## ## Working Agreements (Global)
- **Tooling**: Prefer `npm` for all package management. Use `npx wrangler` for Cloudflare-related tasks.
- **Communication**: Provide a concise technical rationale before executing any file modification.
- **Validation**: Always run unit tests (`npm run test`) after modifying logic in `client/src/lib/`.
- **Safety**: Never log or commit secrets. Use `.env.example` as a template for new environment variables.

---

## ## Repository Expectations (Project Root)
- **Node Version**: Use Node.js **22** for all build and test operations.
- **Offline-First Architecture**: 
    - `localStorage` is the primary source of truth for the UI.
    - All data fetching and background sync logic **must** reside in `client/src/lib/storage.ts`.
    - Do not create new React hooks for data fetching; use the existing `storage.ts` API.
- **Type Safety**: 
    - Define all Zod schemas in `client/src/lib/schema.ts`.
    - Manually sync types to the worker if changes affect the API contract (until a `shared/` package is implemented).
- **Environment Variables**:
    - Vite variables (starting with `VITE_`) must be placed in `client/.env.local`.
    - Worker variables (like `API_SECRET`) are managed via `wrangler.toml` or Cloudflare Dashboard.
- **Linting & Formatting**: Follow existing Prettier and ESLint configurations. Use Tailwind utility classes; avoid raw CSS.

---

## ## Specialized Rules (Module Level)

### ### Client (Frontend)
- **UI Components**: Use `shadcn/ui` primitives from `client/src/components/ui/`. Do not modify these directly.
- **Styling**: Adhere to the Glassmorphism system (`.glass`, `.glass-card`).
- **Design Future**: Consult `design/humble_hearth/DESIGN.md` before proposing significant UI refactors.
- **State Management**: Use TanStack Query in page components (`client/src/pages/`) to interface with `storage.ts`.

### ### Worker (Backend)
- **Framework**: Hono 4.x.
- **Database**: Cloudflare D1 (SQLite). Reference `SCHEMA.md` for current table structures.
- **Deployment**: Always use `--config worker/wrangler.toml` when running wrangler from the root.
- **Middleware**: Ensure `X-API-Key` protection is maintained for all `/api/*` endpoints.

### ### Testing
- **Unit Tests**: Add tests to `client/src/lib/achievements.test.ts` for any changes to the gamification engine.
- **E2E Tests**: Use Playwright (`e2e/app.spec.ts`). Ensure tests pass before submitting changes to the UI or Auth flows.
