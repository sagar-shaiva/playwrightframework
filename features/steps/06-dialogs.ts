import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";
import { data } from "../../config/env.config";

const { Given, When, Then } = createBdd(test, { tags: "@bdd06" });

Given("the dialog login form is open", async ({ loginPage }) => {
  await loginPage.expectLoaded();
});

When("the user submits an invalid password", async ({ loginPage, dialogs }) => {
  dialogs.expectNext(data.expectedMessages.invalidPassword);
  await loginPage.login(data.userIds.T, data.loginNegative.wrongPassword.password);
});

Then("the invalid password message is shown", async ({ loginPage }) => {
  await loginPage.expectError(data.expectedMessages.invalidPassword);
});

When("the Teller completes a successful deposit", async ({ customerPage, transactionPage, dialogs }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  await customerPage.goToTransactionPage();
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("deposit", data.transactions.deposit.amount, data.transactions.deposit.reason);
});

Then("the transaction success message is shown", async ({ transactionPage }) => {
  await transactionPage.expectSuccess();
});

Given("the Teller session is active", async ({ customerPage }) => {
  await customerPage.expectLoaded();
  await customerPage.expectLoggedInAs(data.userIds.T);
});

When("the application reports a service failure", async ({ appPage, dialogs }) => {
  await appPage.evaluate(() => window.dispatchEvent(new Event("teller:service-failure")));
});

Then("the BDD scenario completes with the dialog handled", async ({ customerPage }) => {
  await expect(customerPage.customerId).toBeVisible();
});
