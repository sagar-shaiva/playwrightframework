import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";
import { data } from "../../config/env.config";

const { Given, When, Then } = createBdd(test, { tags: "@bdd99" });

Given("I am signed in as the Super User", async ({ customerPage }) => {
  await customerPage.expectLoaded();
  await customerPage.expectLoggedInAs(data.userIds.SU);
});

When("I close the branch", async ({ branchPage }) => {
  await branchPage.ensureClosed();
});

Then("the branch is closed", async ({ branchPage }) => {
  await expect(branchPage.state).toHaveText("Closed");
});
