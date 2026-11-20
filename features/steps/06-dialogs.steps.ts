import { createBdd } from "playwright-bdd";
import { test } from "../../src/fixtures/bdd.fixture";

const { Given, When, Then } = createBdd(test, { tags: "@bdd06" });

Given("I am signed in as {string}", async ({ customerPage, testData }, role: string) => {
  await customerPage.expectLoaded();
  await customerPage.expectLoggedInAs(testData.users[role]);
});

When("I trigger a service failure", async ({ appPage }) => {
  await appPage.evaluate(() => window.dispatchEvent(new Event("teller:service-failure")));
});

Then("I see the application is still usable", async ({ customerPage }) => {
  await customerPage.expectLoaded();
});
