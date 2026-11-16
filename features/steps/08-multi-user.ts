import { createBdd } from "playwright-bdd";
import { test } from "../../src/fixtures/bdd.fixture";
import { data } from "../../config/env.config";
import type { CustomerPage } from "../../src/pages/CustomerPage";

const { Given, When, Then } = createBdd(test, { tags: "@bdd08" });
let otherUserPage: CustomerPage;

Given("I am signed in as the Teller", async ({ customerPage }) => {
  await customerPage.expectLoaded();
  await customerPage.expectLoggedInAs(data.userIds.T);
});

Given("the authenticated session is ready", async ({ customerPage }) => {
  await customerPage.expectLoaded();
});

When("I open a session as the Branch Manager", async ({ asUser }) => {
  otherUserPage = await asUser(data.userIds.BM);
});

Then("the second session is authenticated as the Branch Manager", async () => {
  await otherUserPage.expectLoggedInAs(data.userIds.BM);
});

When("I open a session as the Manager", async ({ asUser }) => {
  otherUserPage = await asUser(data.userIds.MG);
});

Then("the second session is authenticated as the Manager", async () => {
  await otherUserPage.expectLoggedInAs(data.userIds.MG);
});
