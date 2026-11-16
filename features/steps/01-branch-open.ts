import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";
import { data } from "../../config/env.config";

const { Given, When, Then } = createBdd(test, { tags: "@bdd01" });

Given("the Super User is signed in", async ({ loginPage, customerPage }) => {
  await loginPage.expectLoaded();
  await loginPage.login(data.userIds.SU, data.password);
  await customerPage.expectLoggedInAs(data.userIds.SU);
});

When("the Super User opens the branch", async ({ branchPage }) => {
  await branchPage.ensureOpen();
});

Then("the branch is open", async ({ branchPage }) => {
  await expect(branchPage.state).toHaveText("Open");
});
