import { test, expect } from "../src/fixtures/test.fixtures";

test.describe("Role-specific dashboards", () => {
  test.describe("Branch Manager", () => {
    test.use({ authRole: "branchManager" });

    test("The Branch Manager dashboard shows the Branch Manager", async ({ customerPage, testData }) => {
      await customerPage.expectLoaded();

      await customerPage.expectLoggedInAs(testData.users.branchManager);
    });
  });

  test.describe("Manager", () => {
    test.use({ authRole: "manager" });

    test("The transaction page shows the Manager", async ({ customerPage, transactionPage, testData }) => {
      await customerPage.expectLoaded();

      await customerPage.goToTransactionPage();

      await expect(transactionPage.welcomeUser).toContainText(testData.users.manager);
    });
  });
});
