# Routine Minder

![Routine Minder Banner](public/icons/icon-512.png)

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

## 🛠️ Installation & Development

### Prerequisites

- Node.js 18+
- npm 9+

### Quick Start

1.  **Clone the repository**
    ```bash
    git clone https://github.com/ravishan16/routine-minder.git
    cd routine-minder
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start development server**
    ```bash
    npm run dev
    ```

4.  **Run tests**
    ```bash
    npm run test
    ```

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

We use **Vitest** for unit testing our gamification engine.

```bash
# Run all tests
npm run test

# Run with UI
npm run test -- --ui
```

## 🤝 Contributing

Contributions are welcome! Please verify that all tests pass (`npm run test`) and the UI is consistent with the glassmorphism design system before submitting a PR.

## 📄 License

MIT © [Ravi Shan](https://github.com/ravishan16)
