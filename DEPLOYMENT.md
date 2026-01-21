# GitHub Actions Deployment Setup

This project uses GitHub Actions to automatically deploy to Cloudflare Pages on every push to `main`.

## Prerequisites

- A GitHub repository
- A Cloudflare account (free tier works)

## Setup Steps

### 1. Get Cloudflare Credentials

#### API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click your profile icon (top right) → **My Profile**
3. Select **API Tokens** from the left sidebar
4. Click **Create Token**
5. Click **Use template** next to "Edit Cloudflare Workers"
6. Under **Account Resources**, select your account
7. Click **Continue to summary** → **Create Token**
8. **Copy the token** (you won't see it again!)

#### Account ID

1. Go to [Workers & Pages Overview](https://dash.cloudflare.com/?to=/:account/workers-and-pages)
2. Look at the right sidebar
3. Copy your **Account ID**

### 2. Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these two secrets:

| Secret Name | Value |
|-------------|-------|
| `CLOUDFLARE_API_TOKEN` | Your API token from step 1 |
| `CLOUDFLARE_ACCOUNT_ID` | Your account ID from step 1 |

### 3. Push and Deploy

```bash
# Add all files
git add .

# Commit changes
git commit -m "Setup GitHub Actions deployment"

# Push to main branch
git push origin main
```

### 4. Verify Deployment

1. Go to your GitHub repository → **Actions** tab
2. You should see the "Deploy to Cloudflare Pages" workflow running
3. Wait for both jobs to complete (green checkmarks)
4. Your sites will be available at:
   - PWA: `https://routine-minder.pages.dev`
   - Landing: `https://routine-minder-landing.pages.dev`

## Workflow Details

The workflow (`.github/workflows/deploy.yml`) has two jobs:

### `deploy-pwa`
1. Checks out code
2. Sets up Node.js 20
3. Installs dependencies with `npm ci`
4. Builds the PWA with `npm run build`
5. Deploys `/dist` to Cloudflare Pages

### `deploy-landing`
1. Checks out code
2. Deploys `/landing` folder directly (no build needed)

## Custom Domains

After successful deployment:

1. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/?to=/:account/pages)
2. Select your project
3. Go to **Custom domains** tab
4. Click **Set up a custom domain**
5. Enter your domain and follow the DNS setup instructions

## Troubleshooting

### Workflow fails with "Project not found"

This happens on first deployment. The Cloudflare Pages project gets created automatically. Just re-run the failed workflow.

### Permission denied errors

Make sure your API token has these permissions:
- Account → Cloudflare Pages → Edit
- Account → Account Settings → Read

### Build fails

1. Check that `npm run build` works locally
2. Ensure all dependencies are in `package.json`
3. Check the GitHub Actions logs for specific errors

## Manual Deployment

If you prefer not to use GitHub Actions:

```bash
# Install Wrangler CLI globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build and deploy PWA
npm run build
wrangler pages deploy dist --project-name=routine-minder

# Deploy landing page
wrangler pages deploy landing --project-name=routine-minder-landing
```

## Environment Variables

If you need environment variables at build time, add them to your GitHub repository secrets and reference them in the workflow:

```yaml
- name: Build PWA
  run: npm run build
  env:
    VITE_SOME_VAR: ${{ secrets.SOME_VAR }}
```
