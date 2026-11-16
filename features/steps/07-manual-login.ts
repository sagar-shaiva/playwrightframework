import { createBdd } from "playwright-bdd";
import { test } from "../../src/fixtures/bdd.fixture";
import { data } from "../../config/env.config";

const { Given, When, Then } = createBdd(test, { tags: "@bdd07" });

Given("the login form is displayed", async ({ loginPage }) => {
  await loginPage.expectLoaded();
});

When("I sign in as the Teller", async ({ loginPage, takeScreenshot }) => {
  await takeScreenshot("01.loginpage");
  await loginPage.login(data.userIds.T, data.password);
});

Then("I am authenticated as the Teller", async ({ customerPage, takeScreenshot }) => {
  await customerPage.expectLoggedInAs(data.userIds.T);
  await takeScreenshot("02.dashboardpage");
});

When("I sign in as the Branch Manager", async ({ loginPage, takeScreenshot }) => {
  await takeScreenshot("01.loginpage");
  await loginPage.login(data.userIds.BM, data.password);
});

Then("I am authenticated as the Branch Manager", async ({ customerPage, takeScreenshot }) => {
  await customerPage.expectLoggedInAs(data.userIds.BM);
  await takeScreenshot("02.dashboardpage");
});

When("I sign in as the Teller and then sign out", async ({ loginPage, customerPage, takeScreenshot }) => {
  await loginPage.login(data.userIds.T, data.password);
  await customerPage.expectLoggedInAs(data.userIds.T);
  await takeScreenshot("01.dashboardpage");
  await customerPage.logout();
  await takeScreenshot("02.loginpage-after-logout");
});

Then("the login form is displayed again", async ({ loginPage }) => {
  await loginPage.expectLoaded();
});

When("I submit an incorrect password as the Teller", async ({ loginPage, dialogs, takeScreenshot }) => {
  await takeScreenshot("01.loginpage");
  dialogs.expectNext(data.expectedMessages.invalidPassword);
  await loginPage.login(data.userIds.T, data.loginNegative.wrongPassword.password);
});

Then("the invalid password message is displayed", async ({ loginPage, takeScreenshot }) => {
  await loginPage.expectError(data.expectedMessages.invalidPassword);
  await takeScreenshot("02.invalid-password-error");
});
