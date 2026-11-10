import { test } from "../src/fixtures/test.fixture";
import { data } from "../config/env.config";
test.describe("Manual login", () => {
    test("Teller logs in manually", async ({ loginPage, customerPage, takeScreenshot }) => {
        await loginPage.expectLoaded();
        await takeScreenshot("01.loginpage");
        await loginPage.login(data.userIds.T, data.password);
        await customerPage.expectLoggedInAs(data.userIds.T);
        await takeScreenshot("02.dashboardpage");
    });
    test("Branch Manager logs in manually", async ({ loginPage, customerPage, takeScreenshot }) => {
        await loginPage.expectLoaded();
        await takeScreenshot("01.loginpage");
        await loginPage.login(data.userIds.BM, data.password);
        await customerPage.expectLoggedInAs(data.userIds.BM);
        await takeScreenshot("02.dashboardpage");
    });
    test("Teller logs out and returns to login", async ({ loginPage, customerPage, takeScreenshot }) => {
        await loginPage.expectLoaded();
        await loginPage.login(data.userIds.T, data.password);
        await customerPage.expectLoggedInAs(data.userIds.T);
        await takeScreenshot("01.dashboardpage");
        await customerPage.logout();
        await takeScreenshot("02.loginpage-after-logout");
    });
    test("rejects an incorrect password", async ({ loginPage, dialogs, takeScreenshot }) => {
        await loginPage.expectLoaded();
        await takeScreenshot("01.loginpage");
        dialogs.expectNext(data.expectedMessages.invalidPassword);
        await loginPage.login(data.userIds.T, data.loginNegative.wrongPassword.password);
        await loginPage.expectError(data.expectedMessages.invalidPassword);
        await takeScreenshot("02.invalid-password-error");
    });
});
