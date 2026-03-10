# Routine Minder

![Routine Minder Banner](public/icons/logo.svg)

> **Consistency is key.** Routine Minder is a professional-grade Progressive Web App (PWA) designed to help you build and maintain daily habits through gamification and detailed analytics.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-active-success.svg)](https://routine-minder.ravishankars.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-orange.svg)](https://vitejs.dev/guide/features.html#pwa)

## ✨ Features

- **📱 Offline-First PWA**: Installable on iOS and Android. Works completely offline.
- **📊 Advanced Analytics**:
    - **Activity Heatmap**: Visualize your consistency over the year.
    - **Bento Grid Dashboard**: Premium, dense data visualization.
    - **Time Categories**: AM/NOON/PM breakdowns.
- **🎮 Gamification System**:
    - **XP & Levels**: Progress from Novice to Legend.
    - **Streaks**: Daily streaks with multipliers (Week Warrior, On Fire).
    - **Achievements**: Unlock badges for milestones (Perfect Week, Early Bird, etc.).
- **🎨 Premium UI/UX**:
    - **Glassmorphism**: Modern glass card aesthetics.
    - **Animations**: Micro-interactions and smooth transitions.
    - **Dual Theme**: Refined Light and Dark modes.
- **🔒 Privacy Focused**: All data stored locally in your browser (IndexedDB/LocalStorage). Optional Google Sync for cross-device backup.

## 🚀 Tech Stack

- **Frontend**: React 18, TypeScript, Vite 7
- **UI Framework**: Tailwind CSS, Shadcn/ui, Framer Motion
- **State Management**: TanStack React Query
- **Routing**: Wouter (Micro-router)
- **Visualization**: Recharts, Activity Heatmap
- **PWA**: vite-plugin-pwa (Workbox)
- **Backend (Optional Sync)**: Cloudflare Workers (Hono), Cloudflare D1 (SQLite)

## � Architecture

For a deep dive into the system architecture, design system, deployment pipeline, and local development setup, see the **[Architecture & Design Guide](ARCHITECTURE.md)**.

## 🛠️ Quick Start

### Prerequisites

- Node.js 20+
- npm 9+

### Setup

```bash
git clone https://github.com/ravishan16/routine-minder.git
cd routine-minder
npm install
npm run dev
```

See [ARCHITECTURE.md — Local Development](ARCHITECTURE.md#local-development) for full-stack setup with the Worker backend.

## 📦 Project Structure

```
routine-minder/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # UI Components (Shadcn + Custom)
│   │   ├── lib/            # Utilities & Core Logic
│   │   │   ├── achievements.ts # Types & Constants
│   │   │   ├── stats.ts        # Gamification Engine (Pure Functions)
│   │   │   └── storage.ts      # LocalStorage & API Client
│   │   ├── pages/          # Route Components
│   │   └── ...
│   └── ...
├── worker/                 # Cloudflare Backend
│   ├── src/                # Hono API
│   └── ...
└── ...
```

## 🧪 Testing

### Unit Tests

```bash
npm run test          # watch mode
npx vitest run        # single run (CI)
```

### E2E Tests (Playwright)

E2E tests run against a local full-stack environment (Vite + Cloudflare Worker).

```bash
# 1. Start the Worker (Terminal 1)
cd worker && npm install
npx wrangler d1 migrations apply routine-minder-db --local
npx wrangler dev --config worker/wrangler.toml --port 8787

# 2. Start the Frontend (Terminal 2, from project root)
npm install && npm run dev

# 3. Run E2E tests (Terminal 3, from project root)
npm run test:e2e            # headless
npm run test:e2e:headed     # visible browser
```

See [ARCHITECTURE.md — Testing](ARCHITECTURE.md#testing) for configuration details and guidelines.

## 🤝 Contributing

Contributions are welcome! Please verify that all tests pass (`npm run test`) and the UI is consistent with the glassmorphism design system before submitting a PR.

## 📄 License

MIT © [Ravi Shan](https://github.com/ravishan16)
