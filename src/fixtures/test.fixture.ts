import { Page, test as base, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { COUNTRY, ENV, getAuthFile } from "../../config/env.config";
import { LaunchPage } from "../pages/LaunchPage";
import { LoginPage } from "../pages/LoginPage";
import { CustomerPage } from "../pages/CustomerPage";
import { TransactionPage } from "../pages/TransactionPage";
import { Database } from "../utils/database";
import { DialogHandler } from "../utils/dialogHandler";
import { getDateFolder, getFileTimestamp } from "../utils/dateHelper";

type PageFixtures = {
  appPage: Page;
  loginPage: LoginPage;
  customerPage: CustomerPage;
  transactionPage: TransactionPage;
};

type DbFixtures = {
  db: Database;
};

type DialogFixtures = {
  dialogs: DialogHandler;
};

type AuthFixtures = {
  asUser: (userId: string) => Promise<CustomerPage>;
};

type ScreenshotFixtures = {
  takeScreenshot: (name: string, targetPage?: Page) => Promise<string>;
};

const emptyStorageState = { cookies: [], origins: [] };

const appTest = base.extend<PageFixtures & DbFixtures & DialogFixtures & AuthFixtures & ScreenshotFixtures>({
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
      try {
        await use(dialogs);
      } finally {
        dialogs.dispose();
        dialogs.printUnexpectedMessages();
        dialogs.verifyExpectedDialogs();
      }
    },
    { auto: true },
  ],
  asUser: async ({ browser }, use) => {
    const sessions: { page: Page; dialogs: DialogHandler }[] = [];

    await use(async (userId) => {
      const page = await browser.newPage({ storageState: getAuthFile(userId) });
      const launchPage = new LaunchPage(page);
      const appPage = await launchPage.openLoginPopup();
      sessions.push({ page, dialogs: new DialogHandler(appPage) });
      return new CustomerPage(appPage);
    });

    const dialogErrors: string[] = [];

    for (const { page, dialogs } of sessions) {
      dialogs.dispose();
      dialogs.printUnexpectedMessages();

      try {
        dialogs.verifyExpectedDialogs();
      } catch (error) {
        dialogErrors.push(String(error));
      } finally {
        await page.close();
      }
    }

    if (dialogErrors.length > 0) {
      throw new Error(dialogErrors.join("\n"));
    }
  },
  db: async ({}, use) => {
    const db = new Database();
    await use(db);
    await db.close();
  },
});

/** Every test starts logged out unless its spec explicitly selects an auth file. */
export const test = appTest.extend({ storageState: emptyStorageState });

export { expect };
