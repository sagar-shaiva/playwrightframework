import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";
import { data } from "../../config/env.config";
import { BranchPage } from "../../src/pages/BranchPage";

const { Given, When, Then } = createBdd(test, { tags: "@bdd99" });

Given("the Super User session is active", async ({ customerPage }) => {
  await customerPage.expectLoaded();
  await customerPage.expectLoggedInAs(data.userIds.SU);
});

When("the Super User closes the branch", async ({ appPage }) => {
  await new BranchPage(appPage).ensureClosed();
});

Then("the branch status is closed", async ({ appPage }) => {
  await expect(new BranchPage(appPage).state).toHaveText("Closed");
});
