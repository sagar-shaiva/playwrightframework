import * as fs from "fs";
import * as path from "path";
import { createBdd } from "playwright-bdd";
import { test } from "../../src/fixtures/bdd.fixture";
import { getAuthFile } from "../../config/env.config";

const { Given, When, Then } = createBdd(test, { tags: "@bdd02" });

Given("I am on the login form", async ({ loginPage }) => {
  await loginPage.expectLoaded();
});

When("I sign in as {string}", async ({ loginPage, testData }, role: string) => {
  await loginPage.login(testData.users[role], testData.password);
});

Then("I am authenticated as {string}", async ({ customerPage, testData }, role: string) => {
  await customerPage.expectLoggedInAs(testData.users[role]);
});

Then("I save the session of {string}", async ({ page, testData }, role: string) => {
  const authFile = getAuthFile(testData.users[role]);
  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
