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

For Google Authentication to work, you need to configure client IDs in the Cloudflare Dashboard (Settings -> Variables) or `wrangler.toml`.

-   `GOOGLE_CLIENT_ID`
-   `GOOGLE_CLIENT_SECRET` (Backend only)

> [!TIP]
> **Google Brand Verification**: For detailed instructions on setting up the OAuth Consent Screen, App Logo, and Privacy Policy to get "Verified" status, see [Google Verification Guide](file:///Users/ravi/.gemini/antigravity/brain/b76e9f31-ccea-4036-8a70-596ba0cd64a8/GOOGLE_VERIFICATION.md).

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
