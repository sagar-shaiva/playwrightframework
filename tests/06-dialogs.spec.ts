import { test } from "../src/fixtures/test.fixture";
import { data, getAuthFile } from "../config/env.config";

test.describe("Expected dialogs", () => {
  test("validates invalid password and accepts the dialog", async ({ loginPage, dialogs }) => {
    await loginPage.expectLoaded();

    dialogs.expectNext(data.expectedMessages.invalidPassword);
    await loginPage.login(data.userIds.T, data.loginNegative.wrongPassword.password);
    await loginPage.expectError(data.expectedMessages.invalidPassword);
  });

  test.describe("Authenticated teller", () => {
    test.use({ storageState: getAuthFile(data.userIds.T) });

    test("validates transaction success and accepts the dialog", async ({ customerPage, transactionPage, dialogs }) => {
      await customerPage.expectLoaded();
      await customerPage.searchCustomer(data.customers.valid.id);
      await customerPage.goToTransactionPage();

      dialogs.expectNext(data.expectedMessages.transactionSuccess);
      await transactionPage.submitTransaction("deposit", data.transactions.deposit.amount, data.transactions.deposit.reason);
      await transactionPage.expectSuccess();
    });
  });
});

test.describe("Unexpected dialogs", () => {
  test.use({ storageState: getAuthFile(data.userIds.T) });

  test("accepts and reports an unexpected environment failure", async ({ customerPage, appPage }) => {
    await customerPage.expectLoaded();
    await appPage.evaluate(() => window.dispatchEvent(new Event("teller:service-failure")));
  });
});
