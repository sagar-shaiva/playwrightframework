import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";

const { Given, When, Then } = createBdd(test, { tags: "@bdd99" });

Given("I am signed in as {string}", async ({ customerPage, testData }, role: string) => {
  await customerPage.expectLoaded();
  await customerPage.expectLoggedInAs(testData.users[role]);
});

When("I close the branch", async ({ branchPage }) => {
  await branchPage.ensureClosed();
});

Then("I see the branch is closed", async ({ branchPage }) => {
  await expect(branchPage.state).toHaveText("Closed");
});
