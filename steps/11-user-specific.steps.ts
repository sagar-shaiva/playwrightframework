import { createBdd } from "playwright-bdd";
import { test, expect } from "../src/fixtures/bdd.fixture";

const { Given, When, Then } = createBdd(test, { tags: "@bdd11" });

Given("I am on the dashboard", async ({ customerPage }) => {
  await customerPage.expectLoaded();
});

When("I open the transaction page", async ({ customerPage }) => {
  await customerPage.goToTransactionPage();
});

Then("I am authenticated as {string}", async ({ customerPage, testData }, role: string) => {
  await customerPage.expectLoggedInAs(testData.users[role]);
});

Then("I see the transaction page welcome {string}", async ({ transactionPage, testData }, role: string) => {
  await expect(transactionPage.welcomeUser).toContainText(testData.users[role]);
});
