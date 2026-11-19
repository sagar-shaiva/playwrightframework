import { test } from "../src/fixtures/test.fixtures";

test.describe("Application dialogs", () => {
  test.use({ authRole: "teller" });

  test("An unexpected service failure dialog is accepted", async ({ customerPage, appPage, testData }) => {
    await customerPage.expectLoaded();
    await customerPage.expectLoggedInAs(testData.users.teller);

    await appPage.evaluate(() => window.dispatchEvent(new Event("teller:service-failure")));

    await customerPage.expectLoaded();
  });
});
