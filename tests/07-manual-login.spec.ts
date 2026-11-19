import { test } from "../src/fixtures/test.fixtures";

test.describe("Manual sign-in", () => {
  for (const role of ["teller", "branchManager"]) {
    test(`"${role}" signs in from the login form`, async ({ loginPage, customerPage, takeScreenshot, testData }) => {
      await loginPage.expectLoaded();
      await takeScreenshot("01.loginpage");

      await loginPage.login(testData.users[role], testData.password);

      await customerPage.expectLoggedInAs(testData.users[role]);
      await takeScreenshot("02.dashboardpage");
    });
  }

  test("The Teller signs out and returns to the login form", async ({ loginPage, customerPage, takeScreenshot, testData }) => {
    await loginPage.expectLoaded();
    await loginPage.login(testData.users.teller, testData.password);
    await customerPage.expectLoggedInAs(testData.users.teller);

    await customerPage.logout();

    await loginPage.expectLoaded();
    await takeScreenshot("02.loginpage-after-logout");
  });

  test("A wrong password is rejected", async ({ loginPage, dialogs, takeScreenshot, testData }) => {
    await loginPage.expectLoaded();

    await loginPage.login(testData.users.teller, testData.invalidPasswords.wrongPassword);

    await dialogs.expectShown(testData.messages.invalidPassword);
    await loginPage.expectError(testData.messages.invalidPassword);
    await takeScreenshot("02.invalid-password-error");
  });
});
