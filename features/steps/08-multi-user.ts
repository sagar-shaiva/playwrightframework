import { createBdd } from "playwright-bdd";
import { test } from "../../src/fixtures/bdd.fixture";
import { data } from "../../config/env.config";
import type { CustomerPage } from "../../src/pages/CustomerPage";

const { Given, When, Then } = createBdd(test, { tags: "@bdd08" });
let otherUserPage: CustomerPage;

Given("the multi-user dashboard is open for a Teller", async ({ customerPage }) => {
  await customerPage.expectLoaded();
  await customerPage.expectLoggedInAs(data.userIds.T);
});

When("the Teller opens a Branch Manager session", async ({ asUser }) => {
  otherUserPage = await asUser(data.userIds.BM);
});

Then("the other session identifies the Branch Manager", async () => {
  await otherUserPage.expectLoggedInAs(data.userIds.BM);
});

When("the Teller opens a Manager session", async ({ asUser }) => {
  otherUserPage = await asUser(data.userIds.MG);
});

Then("the other session identifies the Manager", async () => {
  await otherUserPage.expectLoggedInAs(data.userIds.MG);
});
