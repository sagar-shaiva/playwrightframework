import { defineConfig, devices } from "@playwright/test";
import { defineBddProject } from "playwright-bdd";
import { ENV, COUNTRY, getAppUrl } from "./config/env.config";
import { getDateFolder } from "./src/utils/dateHelper";

const date = getDateFolder();
const reportRoot = `reports/${ENV}/${COUNTRY}/${date}`;
const reportPrefix = process.env.framework === "bdd" ? "bdd-" : "";
const bddFeatures = {
  features: "features/*.feature",
  steps: ["features/steps/*.ts", "src/fixtures/bdd.fixture.ts"],
};
const isBddMode = process.env.framework === "bdd";
const bddProjects = [
  {
    ...defineBddProject({ ...bddFeatures, name: "bdd-branch-open", tags: "@bdd01" }),
    teardown: "bdd-branch-close",
    use: { ...devices["Desktop Chrome"] },
  },
  {
    ...defineBddProject({ ...bddFeatures, name: "bdd-auth", tags: "@bdd02" }),
    dependencies: ["bdd-branch-open"],
    use: { ...devices["Desktop Chrome"] },
  },
  {
    ...defineBddProject({ ...bddFeatures, name: "bdd-customer-create", tags: "@bdd03" }),
    dependencies: ["bdd-auth"],
    use: { ...devices["Desktop Chrome"] },
  },
  {
    ...defineBddProject({ ...bddFeatures, name: "bdd-customer-deposit", tags: "@bdd04" }),
    dependencies: ["bdd-customer-create"],
    use: { ...devices["Desktop Chrome"] },
  },
  {
    ...defineBddProject({ ...bddFeatures, name: "bdd-customer-withdrawal", tags: "@bdd05" }),
    dependencies: ["bdd-customer-deposit"],
    use: { ...devices["Desktop Chrome"] },
  },
  {
    ...defineBddProject({
      ...bddFeatures,
      name: "bdd-independent",
      tags: "not @pomSetup and not @bdd01 and not @bdd02 and not @bdd03 and not @bdd04 and not @bdd05 and not @bdd99",
    }),
    dependencies: ["bdd-customer-withdrawal"],
    use: { ...devices["Desktop Chrome"] },
  },
  {
    ...defineBddProject({ ...bddFeatures, name: "bdd-branch-close", tags: "@bdd99" }),
    use: { ...devices["Desktop Chrome"] },
  },
];
const pomProjects = [
  {
    name: "branch-open",
    testMatch: /01-branch-open\.setup\.ts/,
    teardown: "branch-close",
    use: { ...devices["Desktop Chrome"] },
  },
  {
    name: "branch-close",
    testMatch: /99-branch-close\.teardown\.ts/,
    use: { ...devices["Desktop Chrome"] },
  },
  {
    name: "setup",
    testMatch: /02-auth\.setup\.ts/,
    dependencies: ["branch-open"],
  },
  {
    name: "customer-create",
    testMatch: /03-customer-create\.spec\.ts/,
    dependencies: ["setup"],
    use: { ...devices["Desktop Chrome"] },
  },
  {
    name: "customer-deposit",
    testMatch: /04-deposit\.spec\.ts/,
    dependencies: ["customer-create"],
    use: { ...devices["Desktop Chrome"] },
  },
  {
    name: "customer-withdrawal",
    testMatch: /05-withdrawal\.spec\.ts/,
    dependencies: ["customer-deposit"],
    use: { ...devices["Desktop Chrome"] },
  },
  {
    name: `${ENV}-${COUNTRY}`,
    testIgnore: [/\.setup\.ts/, /\.teardown\.ts/, /0[3-5]-(customer-create|deposit|withdrawal)\.spec\.ts/],
    dependencies: ["customer-withdrawal"],
    use: { ...devices["Desktop Chrome"] },
  },
];

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

  outputDir: `${reportRoot}/${reportPrefix}test-results`,

  reporter: [
    ["list"],
    ["html", { outputFolder: `${reportRoot}/${reportPrefix}html`, open: "never" }],
    ["json", { outputFile: `${reportRoot}/${reportPrefix}results/results.json` }],
    [
      "allure-playwright",
      {
        resultsDir: `${reportRoot}/${reportPrefix}allure-results`,
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

  projects: isBddMode ? bddProjects : pomProjects,

  webServer: {
    command: "node dummy-app/server.js",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
