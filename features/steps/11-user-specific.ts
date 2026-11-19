import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";

const { Given, Then } = createBdd(test);

Given("I am on the dashboard", async ({ customerPage }) => {
  await customerPage.expectLoaded();
});

Then("I see the transaction page welcome {string}", async ({ transactionPage, testData }, role: string) => {
  await expect(transactionPage.welcomeUser).toContainText(testData.users[role]);
});
