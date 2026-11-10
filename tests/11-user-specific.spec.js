import { test, expect } from "../src/fixtures/test.fixture";
import { data, getAuthFile } from "../config/env.config";
test.describe("Branch Manager user scenarios", () => {
    test.use({ storageState: getAuthFile(data.userIds.BM) });
    test("opens as the Branch Manager user", async ({ customerPage }) => {
        await customerPage.expectLoaded();
        await customerPage.expectLoggedInAs(data.userIds.BM);
    });
});
test.describe("Manager user scenarios", () => {
    test.use({ storageState: getAuthFile(data.userIds.MG) });
    test("opens as the Manager user", async ({ customerPage, transactionPage }) => {
        await customerPage.goToTransactionPage();
        await expect(transactionPage.welcomeUser).toContainText(data.userIds.MG);
    });
});
