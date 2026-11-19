import { createBdd } from "playwright-bdd";
import { test } from "../../src/fixtures/bdd.fixture";
import type { CustomerPage } from "../../src/pages/CustomerPage";

const { When, Then } = createBdd(test);
let secondSession: CustomerPage;

When("I open a second session as {string}", async ({ asUser }, role: string) => {
  secondSession = await asUser(role);
});

Then("I see the second session signed in as {string}", async ({ testData }, role: string) => {
  await secondSession.expectLoggedInAs(testData.users[role]);
});
