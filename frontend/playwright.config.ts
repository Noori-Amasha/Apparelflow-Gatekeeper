import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",

  fullyParallel: false,
  workers: 1,
  timeout: 60000,

  expect: {
    timeout: 10000,
  },

  retries: 0,
  reporter: "list",

  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],

  webServer: {
    command: "npm run dev -- --host localhost",
    url: "http://localhost:5173",
    reuseExistingServer: false,
    timeout: 30000,

    env: {
      VITE_API_BASE_URL: "http://localhost:5001/api",
    },
  },
});
