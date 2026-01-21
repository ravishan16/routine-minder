# Routine Minder

A simple, privacy-focused daily habit tracker PWA with Google Sheets as the backend.

![Routine Minder](https://img.shields.io/badge/PWA-Ready-5B7C99?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## Features

- ✅ **Daily Routine Tracking** - Check off routines by time of day (AM/Noon/PM)
- 🔥 **Streak Tracking** - Build momentum with daily streaks
- 📊 **Dashboard** - View completion rates and progress over time
- 🌙 **Dark Mode** - Easy on the eyes
- 📱 **PWA** - Install on iPhone/Android like a native app
- 🔐 **Privacy-First** - Your data lives in YOUR Google Sheet
- 👥 **Multi-User** - Each Google account has isolated data

## Architecture

```
┌─────────────────────┐     ┌─────────────────────────────┐
│                     │     │                             │
│   React PWA         │────▶│   Google Apps Script        │
│   (Cloudflare)      │     │   (Web App)                 │
│                     │◀────│                             │
└─────────────────────┘     └──────────────┬──────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │                             │
                            │   User's Google Sheet       │
                            │   (Google Drive)            │
                            │                             │
                            └─────────────────────────────┘
```

## Quick Start

### 1. Deploy Google Apps Script

1. Go to [Google Apps Script](https://script.google.com/home/start)
2. Create a new project
3. Copy the contents of `google-apps-script/Code.gs` into the script editor
4. Click **Deploy** → **New deployment**
5. Select **Web app** as the type
6. Configure:
   - Execute as: **User accessing the web app**
   - Who has access: **Anyone with Google account**
7. Click **Deploy** and authorize the app
8. Copy the Web App URL (looks like `https://script.google.com/macros/s/.../exec`)

### 2. Deploy to Cloudflare Pages (Automated with GitHub Actions)

The project includes GitHub Actions for automatic deployment to Cloudflare Pages.

#### Step 1: Get Cloudflare Credentials

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click your profile icon → **My Profile** → **API Tokens**
3. Click **Create Token**
4. Use the **Edit Cloudflare Workers** template, or create custom token with:
   - `Account.Cloudflare Pages` - Edit
   - `Account.Account Settings` - Read
   - `Zone.Zone` - Read (optional, for custom domains)
5. Copy the API Token
6. Note your **Account ID** (found on the right sidebar of Workers & Pages overview)

#### Step 2: Add Secrets to GitHub

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Add these repository secrets:
   - `CLOUDFLARE_API_TOKEN` - Your API token from step 1
   - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

#### Step 3: Push to Deploy

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

The GitHub Action will automatically:
- Build the PWA and deploy to `routine-minder.pages.dev`
- Deploy the landing page to `routine-minder-landing.pages.dev`

#### Manual Deployment (Alternative)

```bash
# Install dependencies
npm install

# Build the app
npm run build

# Deploy with Wrangler CLI
npx wrangler pages deploy dist --project-name=routine-minder
```

### 3. Configure Custom Domains (Optional)

After the first deployment succeeds:

1. Go to [Cloudflare Pages](https://dash.cloudflare.com/?to=/:account/pages)
2. Select your project (`routine-minder`)
3. Go to **Custom domains** tab
4. Add your custom domain (e.g., `routines.yourdomain.com`)

### 4. Deploy the Landing Page

The landing page is automatically deployed by GitHub Actions to a separate project.
Update the app URL in `landing/index.html` to point to your PWA URL before pushing.

### 4. Use the App

1. Open your deployed PWA URL
2. Paste your Google Apps Script Web App URL
3. Click **Connect & Start**
4. Your data is now stored in a Google Sheet called "Routine Minder Data" in your Drive!

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type check
npm run check

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env` file for optional Google Sign-In:

```env
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

> Note: Google Sign-In is optional. The app works without it by connecting directly to your Apps Script URL.

## Project Structure

```
routine-minder/
├── client/                  # React PWA
│   ├── public/              # Static assets & PWA icons
│   └── src/
│       ├── components/      # UI components
│       ├── hooks/           # React hooks
│       ├── lib/             # API client, auth, utilities
│       └── pages/           # Page components
├── google-apps-script/      # Google Apps Script backend
│   ├── Code.gs              # Main script
│   └── appsscript.json      # Script configuration
├── landing/                 # Landing page for Cloudflare
│   └── index.html           # Install instructions & QR code
├── package.json
├── vite.config.ts           # Vite + PWA configuration
└── README.md
```

## How Multi-User Works

Each user who connects to the Apps Script creates their own Google Sheet:

1. User opens PWA and pastes their Apps Script URL
2. Apps Script checks if "Routine Minder Data" exists in user's Drive
3. If not, it creates the sheet with default structure
4. All CRUD operations go to that user's specific sheet

**Privacy:** Each user's data is completely isolated in their own Google Drive. You (the developer) have no access to user data.

## API Endpoints (Apps Script)

| Action | Description |
|--------|-------------|
| `ping` | Check connection & get user email |
| `getRoutines` | List all active routines |
| `getDailyRoutines` | Get routines with completion status for a date |
| `createRoutine` | Create a new routine |
| `updateRoutine` | Update a routine |
| `deleteRoutine` | Soft-delete a routine |
| `toggleCompletion` | Toggle completion status |
| `getCompletions` | Get completions for a date |
| `getDashboard` | Get dashboard statistics |
| `getSettings` | Get user settings |
| `updateSettings` | Update user settings |
| `exportData` | Export all data as JSON |

## Customization

### App Branding

Update these files:
- `vite.config.ts` - PWA manifest (name, colors, icons)
- `client/public/icons/` - App icons (generate from SVG)
- `landing/index.html` - Landing page branding

### Default Routines

Edit `google-apps-script/Code.gs` in the `getOrCreateSpreadsheet()` function to change the default routines for new users.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| State | TanStack React Query |
| Routing | Wouter |
| PWA | vite-plugin-pwa |
| Backend | Google Apps Script |
| Database | Google Sheets |
| Hosting | Cloudflare Pages |

## Troubleshooting

### "Connection Failed" error
- Ensure your Apps Script is deployed as a Web App
- Check that access is set to "Anyone with Google account"
- Try redeploying the Apps Script

### Data not saving
- Check browser console for errors
- Verify the Apps Script URL is correct
- Ensure you're signed into a Google account

### PWA not installing
- Make sure you're using HTTPS
- iOS: Must use Safari browser
- Android: Must use Chrome browser

## License

MIT License - feel free to use this for your own projects!

## Contributing

Contributions are welcome! Please open an issue or PR.

---

Made with ❤️ for better habits
