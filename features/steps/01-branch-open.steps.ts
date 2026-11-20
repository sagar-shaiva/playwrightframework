import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";

const { Given, When, Then } = createBdd(test, { tags: "@bdd01" });

Given("I am on the login form", async ({ loginPage }) => {
  await loginPage.expectLoaded();
});

When("I sign in as {string}", async ({ loginPage, testData }, role: string) => {
  await loginPage.login(testData.users[role], testData.password);
});

Then("I am authenticated as {string}", async ({ customerPage, testData }, role: string) => {
  await customerPage.expectLoggedInAs(testData.users[role]);
});

When("I open the branch", async ({ branchPage }) => {
  await branchPage.ensureOpen();
});

Then("I see the branch is open", async ({ branchPage }) => {
  await expect(branchPage.state).toHaveText("Open");
});
