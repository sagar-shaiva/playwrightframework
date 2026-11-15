import { createBdd } from "playwright-bdd";
import { test } from "../../src/fixtures/bdd.fixture";
import { data } from "../../config/env.config";

const { Given, When, Then } = createBdd(test, { tags: "@bdd07" });

Given("the manual login form is open", async ({ loginPage }) => {
  await loginPage.expectLoaded();
});

When("the Teller logs in manually", async ({ loginPage }) => {
  await loginPage.login(data.userIds.T, data.password);
});

Then("the Teller dashboard is shown", async ({ customerPage }) => {
  await customerPage.expectLoggedInAs(data.userIds.T);
});

When("the Branch Manager logs in manually", async ({ loginPage }) => {
  await loginPage.login(data.userIds.BM, data.password);
});

Then("the Branch Manager dashboard is shown", async ({ customerPage }) => {
  await customerPage.expectLoggedInAs(data.userIds.BM);
});

When("the Teller signs in and signs out", async ({ loginPage, customerPage }) => {
  await loginPage.login(data.userIds.T, data.password);
  await customerPage.expectLoggedInAs(data.userIds.T);
  await customerPage.logout();
});

Then("the login form is available again", async ({ loginPage }) => {
  await loginPage.expectLoaded();
});

When("the Teller submits an incorrect password", async ({ loginPage, dialogs }) => {
  dialogs.expectNext(data.expectedMessages.invalidPassword);
  await loginPage.login(data.userIds.T, data.loginNegative.wrongPassword.password);
});

Then("the invalid password message is shown", async ({ loginPage }) => {
  await loginPage.expectError(data.expectedMessages.invalidPassword);
});
