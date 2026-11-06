import { defineConfig, devices } from "@playwright/test";
import { ENV, COUNTRY, getAppUrl } from "./config/env.config";
import { getDateFolder } from "./src/utils/dateHelper";

const date = getDateFolder();
const reportRoot = `reports/${ENV}/${COUNTRY}/${date}`;

/**
 * Project dependencies order stateful workflows; independent spec files may run in parallel.
 * Reports and artefacts are grouped per environment and per date.
 * Select the target with env vars, e.g. TEST_ENV=uat COUNTRY=FJ npx playwright test
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: process.env.CI ? 1 : undefined,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },

  outputDir: `${reportRoot}/test-results`,

  reporter: [
    ["list"],
    ["html", { outputFolder: `${reportRoot}/html`, open: "never" }],
    ["json", { outputFile: `${reportRoot}/results/results.json` }],
    [
      "allure-playwright",
      {
        resultsDir: `${reportRoot}/allure-results`,
        environmentInfo: {
          Environment: ENV,
          Country: COUNTRY,
          BaseURL: getAppUrl(),
        },
      },
    ],
  ],

  use: {
    baseURL: getAppUrl(),
    trace: "on",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
  },

  projects: [
    {
      name: "branch-open",
      testMatch: /01-branch-open\.setup\.ts/,
      teardown: "branch-close",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "branch-close",
      testMatch: /99-branch-close\.teardown\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "setup",
      testMatch: /02-auth\.setup\.ts/,
      dependencies: ["branch-open"],
    },
    // Only true prerequisites are chained; DB assertions live inside the UI tests as test.step blocks.
    {
      name: "customer-create",
      testMatch: /03-customer-create\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "customer-deposit",
      testMatch: /04-deposit\.spec\.ts/,
      dependencies: ["customer-create"],
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "customer-withdrawal",
      testMatch: /05-withdrawal\.spec\.ts/,
      dependencies: ["customer-deposit"],
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: `${ENV}-${COUNTRY}`,
      testIgnore: [/\.setup\.ts/, /\.teardown\.ts/, /0[3-5]-(customer-create|deposit|withdrawal)\.spec\.ts/],
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],

  webServer: {
    command: "node dummy-app/server.js",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
