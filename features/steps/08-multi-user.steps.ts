import { createBdd } from "playwright-bdd";
import { test } from "../../src/fixtures/bdd.fixture";
import type { CustomerPage } from "../../src/pages/CustomerPage";

const { Given, When, Then } = createBdd(test, { tags: "@bdd08" });
let secondSession: CustomerPage;

Given("I am signed in as {string}", async ({ customerPage, testData }, role: string) => {
  await customerPage.expectLoaded();
  await customerPage.expectLoggedInAs(testData.users[role]);
});

When("I open a second session as {string}", async ({ asUser }, role: string) => {
  secondSession = await asUser(role);
});

Then("I see the second session signed in as {string}", async ({ testData }, role: string) => {
  await secondSession.expectLoggedInAs(testData.users[role]);
});
