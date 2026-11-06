import { test as setup } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { LoginPage } from "../src/pages/LoginPage";
import { CustomerPage } from "../src/pages/CustomerPage";
import { data, getAuthFile } from "../config/env.config";

const authDirectory = path.dirname(getAuthFile(Object.values(data.userIds)[0]));

setup.beforeAll(() => {
  fs.rmSync(authDirectory, { recursive: true, force: true });
  fs.mkdirSync(authDirectory, { recursive: true });
});

/**
 * Logs in once per configured user ID for the active env/country and persists each
 * authenticated session to its own storageState file for the fixtures to use.
 */
for (const userId of Object.values(data.userIds)) {
  setup(`authenticate ${userId}`, async ({ page }) => {
    const authFile = getAuthFile(userId);

    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login(userId, data.password);

    const customerPage = new CustomerPage(page);
    await customerPage.expectUser(userId);

    await page.context().storageState({ path: authFile });
  });
}
