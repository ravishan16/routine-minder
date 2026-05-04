# Deployment Guide

Routine Minder is designed to be deployed on **Cloudflare** (Pages for the frontend, Workers for the backend).

## Prerequisites

- [Cloudflare Account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed globally or locally.

```bash
npm install -g wrangler
```

## 1. Backend (Cloudflare Worker)

The backend handles authentication and data sync. It uses **Cloudflare D1** (SQLite at the edge).

1.  **Navigate to worker directory**
    ```bash
    cd worker
    ```

2.  **Login to Cloudflare**
    ```bash
    npx wrangler login
    ```

3.  **Create D1 Database**
    ```bash
    npx wrangler d1 create routine-minder-db
    ```

4.  **Update `wrangler.toml`**
    Copy the `database_id` from the output above and update your `wrangler.toml` file.

5.  **Apply Migrations**
    ```bash
    # Local development
    npx wrangler d1 migrations apply routine-minder-db --local

    # Production
    npx wrangler d1 migrations apply routine-minder-db --remote
    ```

6.  **Deploy Worker**
    ```bash
    npm run deploy
    ```

## 2. Frontend (Cloudflare Pages)

1.  **Navigate to root**
    ```bash
    cd ..
    ```

2.  **Build the project**
    ```bash
    npm run build
    ```

3.  **Deploy to Pages**
    ```bash
    npx wrangler pages deploy dist --project-name=routine-minder
    ```

## Environment Variables

For auth and integrations, configure variables in the Cloudflare Dashboard (Settings -> Variables / Secrets) or `wrangler.toml`.

-   Worker vars/secrets:
    - `API_SECRET` (optional, for API key middleware)
    - `OURA_REDIRECT_URI` (non-secret var)
    - `OURA_CLIENT_ID` (secret)
    - `OURA_CLIENT_SECRET` (secret)
    - `OURA_ALLOWED_EMAIL` (secret)
-   Frontend build-time vars:
    - `VITE_API_URL`
    - `VITE_API_KEY`
    - `VITE_GOOGLE_CLIENT_ID`
    - `VITE_VAPID_PUBLIC_KEY`

Set Oura secrets on the worker:

```bash
cd worker
npx wrangler secret put OURA_CLIENT_ID
npx wrangler secret put OURA_CLIENT_SECRET
npx wrangler secret put OURA_ALLOWED_EMAIL
```

## Local Oura OAuth Testing

For local testing, add this Redirect URI in your Oura app configuration:

- `http://localhost:5173`

Then run local frontend + local worker with local env:

```bash
# Terminal 1 (root)
npm run dev

# Terminal 2 (worker)
cd worker
npx wrangler dev --env local
```

Set your root `.env` for local API calls:

- `VITE_API_URL=http://127.0.0.1:8787`

The worker local environment in `worker/wrangler.toml` uses:

- `OURA_REDIRECT_URI=http://localhost:5173`

So OAuth authorization and token exchange use the same redirect URI in local.

## Oura Dashboard Usage

- Default behavior: the dashboard loads the last 7 days of Oura data.
- Custom range: choose `Start date` and `End date` in the Oura page.
- Copy/export: the dashboard provides a markdown table export suitable for pasting into docs or chat.

> [!TIP]
> **Google Brand Verification**: For detailed instructions on setting up the OAuth Consent Screen, App Logo, and Privacy Policy to get "Verified" status, see the Google Cloud Console documentation on [OAuth consent screen](https://support.google.com/cloud/answer/10311615).

## CI/CD Service Token

For automated deployments via GitHub Actions, ensure you have set the following **Secrets** in your GitHub repository settings:

### Cloudflare Deployment
-   `CLOUDFLARE_API_TOKEN`: Your Cloudflare API Token (Permissions: Workers Scripts:Edit, Pages:Edit).
-   `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID.

### App Configuration (Build Time)
-   `VITE_API_URL`: The URL of your deployed Worker (e.g., `https://routine-minder-api.[subdomain].workers.dev`).
-   `VITE_API_KEY`: An arbitrary secret key you set for API protection.
-   `VITE_GOOGLE_CLIENT_ID`: The Client ID from Google Cloud Console.
-   `VITE_VAPID_PUBLIC_KEY`: (Optional) For push notifications.
