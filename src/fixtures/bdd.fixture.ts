import { Page, expect } from "@playwright/test";
import { test as base } from "playwright-bdd";
import * as fs from "fs";
import * as path from "path";
import { COUNTRY, ENV, data, getAuthFile } from "../../config/env.config";
import type { TestData } from "../schemas/test-data.schema";
import { LaunchPage } from "../pages/LaunchPage";
import { LoginPage } from "../pages/LoginPage";
import { CustomerPage } from "../pages/CustomerPage";
import { TransactionPage } from "../pages/TransactionPage";
import { BranchPage } from "../pages/BranchPage";
import { Database } from "../utils/database";
import { DialogHandler } from "../utils/dialogHandler";
import { getDateFolder, getFileTimestamp } from "../utils/dateHelper";

type PageFixtures = {
  appPage: Page;
  loginPage: LoginPage;
  customerPage: CustomerPage;
  transactionPage: TransactionPage;
  branchPage: BranchPage;
};

type DbFixtures = {
  db: Database;
};

type DialogFixtures = {
  dialogs: DialogHandler;
};

type DataFixtures = {
  testData: TestData;
  scenario: ScenarioState;
};

/** Values a shared step stores for a later step in the same scenario. */
type ScenarioState = {
  customerId: string;
  balanceBefore: number;
};

type AuthFixtures = {
  asUser: (role: string) => Promise<CustomerPage>;
};

type ScreenshotFixtures = {
  takeScreenshot: (name: string, targetPage?: Page) => Promise<string>;
};

const emptyStorageState = { cookies: [], origins: [] };

const appTest = base.extend<PageFixtures & DbFixtures & DialogFixtures & DataFixtures & AuthFixtures & ScreenshotFixtures>({
  testData: async ({}, use) => {
    await use(data);
  },
  scenario: async ({}, use) => {
    await use({ customerId: "", balanceBefore: 0 });
  },
  appPage: async ({ page }, use) => {
    const launchPage = new LaunchPage(page);
    const appPage = await launchPage.openLoginPopup();
    await use(appPage);
  },
  loginPage: async ({ appPage }, use) => {
    await use(new LoginPage(appPage));
  },
  customerPage: async ({ appPage }, use) => {
    await use(new CustomerPage(appPage));
  },
  transactionPage: async ({ appPage }, use) => {
    await use(new TransactionPage(appPage));
  },
  branchPage: async ({ appPage }, use) => {
    await use(new BranchPage(appPage));
  },
  takeScreenshot: async ({ appPage }, use, testInfo) => {
    await use(async (name, targetPage = appPage) => {
      const screenshotFolder = path.resolve(process.cwd(), "reports", ENV, COUNTRY, getDateFolder(), "screenshots");
      const filePath = path.join(screenshotFolder, `${name}-${getFileTimestamp()}.png`);

      fs.mkdirSync(screenshotFolder, { recursive: true });
      await targetPage.screenshot({ path: filePath, fullPage: true });
      await testInfo.attach(name, { path: filePath, contentType: "image/png" });
      return filePath;
    });
  },
  dialogs: [
    async ({ appPage }, use) => {
      const dialogs = new DialogHandler(appPage);
      await use(dialogs);
      dialogs.dispose();
      dialogs.printUnexpectedMessages();
    },
    { auto: true },
  ],
  asUser: async ({ browser, testData }, use) => {
    const sessions: { page: Page; dialogs: DialogHandler }[] = [];

    await use(async (role) => {
      const page = await browser.newPage({ storageState: getAuthFile(testData.users[role]) });
      const launchPage = new LaunchPage(page);
      const appPage = await launchPage.openLoginPopup();
      sessions.push({ page, dialogs: new DialogHandler(appPage) });
      return new CustomerPage(appPage);
    });

    for (const { page, dialogs } of sessions) {
      dialogs.dispose();
      dialogs.printUnexpectedMessages();
      await page.close();
    }
  },
  db: async ({}, use) => {
    const db = new Database();
    await use(db);
    await db.close();
  },
});

/** BDD scenarios select a saved user session with @auth-<role>, e.g. @auth-teller; @noauth scenarios start logged out. */
export const test = appTest.extend({
  storageState: async ({ $tags, testData }, use) => {
    const authTag = $tags.find((tag) => tag.startsWith("@auth-"));
    const role = authTag?.slice("@auth-".length);
    const userId = role ? testData.users[role] : undefined;

    if (authTag && !userId) {
      throw new Error(`Unknown BDD authentication tag: ${authTag}`);
    }

    await use(userId ? getAuthFile(userId) : emptyStorageState);
  },
});

export { expect };
