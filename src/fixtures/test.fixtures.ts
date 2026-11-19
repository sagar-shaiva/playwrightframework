import { Page, expect, test as base } from "@playwright/test";
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
};

type AuthFixtures = {
  authRole: string | undefined;
  asUser: (role: string) => Promise<CustomerPage>;
};

type ScreenshotFixtures = {
  takeScreenshot: (name: string, targetPage?: Page) => Promise<string>;
};

const emptyStorageState = { cookies: [], origins: [] };

/** POM tests start logged out unless they select a role with test.use({ authRole: "teller" }). */
export const test = base.extend<PageFixtures & DbFixtures & DialogFixtures & DataFixtures & AuthFixtures & ScreenshotFixtures>({
  testData: async ({}, use) => {
    await use(data);
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
  authRole: [undefined, { option: true }],
  storageState: async ({ authRole, testData }, use) => {
    await use(authRole ? getAuthFile(testData.users[authRole]) : emptyStorageState);
  },
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

export { expect };
