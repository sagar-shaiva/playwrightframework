import { test as setup } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { LoginPage } from "../src/pages/LoginPage";
import { LaunchPage } from "../src/pages/LaunchPage";
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
        const launchPage = new LaunchPage(page);
        const appPage = await launchPage.openLoginPopup();
        const loginPage = new LoginPage(appPage);
        await loginPage.expectLoaded();
        await loginPage.login(userId, data.password);
        const customerPage = new CustomerPage(appPage);
        await customerPage.expectLoggedInAs(userId);
        // Session cookies belong to the browser context, so the popup's login is saved here too.
        await page.context().storageState({ path: authFile });
    });
}
