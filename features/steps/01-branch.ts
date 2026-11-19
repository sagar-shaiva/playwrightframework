import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";

const { When, Then } = createBdd(test);

When("I open the branch", async ({ branchPage }) => {
  await branchPage.ensureOpen();
});

Then("I see the branch is open", async ({ branchPage }) => {
  await expect(branchPage.state).toHaveText("Open");
});

When("I close the branch", async ({ branchPage }) => {
  await branchPage.ensureClosed();
});

Then("I see the branch is closed", async ({ branchPage }) => {
  await expect(branchPage.state).toHaveText("Closed");
});
