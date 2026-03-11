import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    viewport: { width: 390, height: 844 }, // iPhone 14 size
    actionTimeout: 10_000,
    screenshot: "on",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  webServer: [
    {
      command:
        "cd worker && npx wrangler d1 migrations apply routine-minder-db --local && npx wrangler dev",
      url: "http://localhost:8787",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: "npm run dev",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: {
        VITE_API_URL: "http://localhost:8787",
      },
    },
  ],
});
