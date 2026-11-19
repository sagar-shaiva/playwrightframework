import { createBdd } from "playwright-bdd";
import { test } from "../../src/fixtures/bdd.fixture";

const { When, Then } = createBdd(test);

When("I trigger a service failure", async ({ appPage }) => {
  await appPage.evaluate(() => window.dispatchEvent(new Event("teller:service-failure")));
});

Then("I see the application is still usable", async ({ customerPage }) => {
  await customerPage.expectLoaded();
});
