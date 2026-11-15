import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";
import { data } from "../../config/env.config";

const { Given, When, Then } = createBdd(test, { tags: "@bdd11" });

Given("the user-specific dashboard is open as a Branch Manager", async ({ customerPage }) => {
  await customerPage.expectLoaded();
});

Then("the dashboard identifies the Branch Manager", async ({ customerPage }) => {
  await customerPage.expectLoggedInAs(data.userIds.BM);
});

Given("the user-specific dashboard is open as a Manager", async ({ customerPage }) => {
  await customerPage.expectLoaded();
});

When("the Manager opens transactions", async ({ customerPage }) => {
  await customerPage.goToTransactionPage();
});

Then("the transaction dashboard identifies the Manager", async ({ transactionPage }) => {
  await expect(transactionPage.welcomeUser).toContainText(data.userIds.MG);
});
