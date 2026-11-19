import { createBdd } from "playwright-bdd";
import { test } from "../../src/fixtures/bdd.fixture";

const { When } = createBdd(test);

When("I sign out", async ({ customerPage }) => {
  await customerPage.logout();
});
