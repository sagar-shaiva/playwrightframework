import { test as teardown } from "@playwright/test";
import { data } from "../config/env.config";
import { BranchPage } from "../src/pages/BranchPage";
import { CustomerPage } from "../src/pages/CustomerPage";
import { LaunchPage } from "../src/pages/LaunchPage";
import { LoginPage } from "../src/pages/LoginPage";
teardown("close branch after all tests", async ({ page }) => {
    const launchPage = new LaunchPage(page);
    const appPage = await launchPage.openLoginPopup();
    const loginPage = new LoginPage(appPage);
    await loginPage.expectLoaded();
    await loginPage.login(data.userIds.SU, data.password);
    const customerPage = new CustomerPage(appPage);
    await customerPage.expectLoggedInAs(data.userIds.SU);
    const branchPage = new BranchPage(appPage);
    await branchPage.ensureClosed();
});
