import { createBdd } from "playwright-bdd";
import { test } from "../../src/fixtures/bdd.fixture";
import * as fs from "fs";
import * as path from "path";
import { data } from "../../config/env.config";
import { getAuthFile } from "../../config/env.config";

const { When } = createBdd(test, { tags: "@bdd02" });

When("the configured user signs in and saves their session", async ({ page, loginPage, customerPage, $tags }) => {
  const loginTag = $tags.find((tag) => tag.startsWith("@login-"));
  const role = loginTag?.slice("@login-".length) as keyof typeof data.userIds | undefined;
  const userId = role ? data.userIds[role] : undefined;

  if (!userId) {
    throw new Error(`Missing or invalid BDD login tag: ${loginTag ?? "none"}`);
  }

  await loginPage.expectLoaded();
  await loginPage.login(userId, data.password);
  await customerPage.expectLoggedInAs(userId);

  const authFile = getAuthFile(userId);
  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
