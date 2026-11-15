import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";
import { data } from "../../config/env.config";
import { BranchPage } from "../../src/pages/BranchPage";

const { Given, When, Then } = createBdd(test, { tags: "@bdd01" });

Given("the Super User signs in", async ({ loginPage, customerPage }) => {
  await loginPage.expectLoaded();
  await loginPage.login(data.userIds.SU, data.password);
  await customerPage.expectLoggedInAs(data.userIds.SU);
});

When("the Super User opens the branch", async ({ appPage }) => {
  await new BranchPage(appPage).ensureOpen();
});

Then("the branch status is open", async ({ appPage }) => {
  await expect(new BranchPage(appPage).state).toHaveText("Open");
});
