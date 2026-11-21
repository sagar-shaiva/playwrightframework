import { createBdd } from "playwright-bdd";
import { test } from "../src/fixtures/bdd.fixture";

const { Given, When, Then } = createBdd(test, { tags: "@bdd07" });

Given("I am on the login form", async ({ loginPage }) => {
  await loginPage.expectLoaded();
});

When("I sign in as {string}", async ({ loginPage, testData }, role: string) => {
  await loginPage.login(testData.users[role], testData.password);
});

When("I sign in as {string} with password {string}", async ({ loginPage, testData }, role: string, passwordKey: string) => {
  await loginPage.login(testData.users[role], testData.invalidPasswords[passwordKey]);
});

When("I sign out", async ({ customerPage }) => {
  await customerPage.logout();
});

Then("I am authenticated as {string}", async ({ customerPage, testData }, role: string) => {
  await customerPage.expectLoggedInAs(testData.users[role]);
});

Then("I see the login error {string}", async ({ loginPage, dialogs, testData }, messageKey: string) => {
  await dialogs.expectShown(testData.messages[messageKey]);
  await loginPage.expectError(testData.messages[messageKey]);
});

Then("I take a screenshot {string}", async ({ takeScreenshot }, name: string) => {
  await takeScreenshot(name);
});
