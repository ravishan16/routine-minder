import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "icons/*.svg"],
      manifest: {
        name: "Routine Minder",
        short_name: "Routines",
        description: "Track your daily routines and build healthy habits",
        theme_color: "#5B7C99",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        categories: ["health", "productivity", "lifestyle"],
        icons: [
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/icons/icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Today's Routines",
            short_name: "Today",
            description: "View and complete today's routines",
            url: "/",
            icons: [{ src: "/icons/icon.svg", sizes: "96x96" }],
          },
          {
            name: "Dashboard",
            short_name: "Stats",
            description: "View your progress and streaks",
            url: "/dashboard",
            icons: [{ src: "/icons/icon.svg", sizes: "96x96" }],
          },
        ],
        screenshots: [
          {
            src: "/icons/icon.svg",
            sizes: "1280x720",
            type: "image/svg+xml",
            form_factor: "wide",
            label: "Routine Minder Dashboard",
          },
          {
            src: "/icons/icon.svg",
            sizes: "750x1334",
            type: "image/svg+xml",
            form_factor: "narrow",
            label: "Routine Minder Mobile",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
});
