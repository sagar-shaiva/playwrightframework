import { createBdd } from "playwright-bdd";
import { test } from "../../src/fixtures/bdd.fixture";
import { data } from "../../config/env.config";

const { Given, When, Then } = createBdd(test, { tags: "@bdd06" });

Given("the login form is displayed", async ({ loginPage }) => {
  await loginPage.expectLoaded();
});

When("I submit an invalid password", async ({ loginPage, dialogs }) => {
  dialogs.expectNext(data.expectedMessages.invalidPassword);
  await loginPage.login(data.userIds.T, data.loginNegative.wrongPassword.password);
});

Then("the invalid password message is displayed", async ({ loginPage }) => {
  await loginPage.expectError(data.expectedMessages.invalidPassword);
});

When("I complete a successful deposit", async ({ customerPage, transactionPage, dialogs }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  await customerPage.goToTransactionPage();
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("deposit", data.transactions.deposit.amount, data.transactions.deposit.reason);
});

Then("the transaction success message is displayed", async ({ transactionPage }) => {
  await transactionPage.expectSuccess();
});

Given("I am signed in as the Teller", async ({ customerPage }) => {
  await customerPage.expectLoaded();
  await customerPage.expectLoggedInAs(data.userIds.T);
});

When("the application displays a service failure", async ({ appPage, dialogs }) => {
  await appPage.evaluate(() => window.dispatchEvent(new Event("teller:service-failure")));
});
