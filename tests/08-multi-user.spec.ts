import { test } from "../src/fixtures/test.fixture";
import { data, getAuthFile } from "../config/env.config";

test.describe("Multiple user workflow", () => {
  test.use({ storageState: getAuthFile(data.userIds.T) });

  test("Teller and Branch Manager work in the same test", async ({ customerPage, asUser }) => {
    await customerPage.expectLoaded();
    await customerPage.expectLoggedInAs(data.userIds.T);

    const branchManager = await asUser(data.userIds.BM);
    await branchManager.expectLoggedInAs(data.userIds.BM);
  });

  test("Teller and Manager work in another test", async ({ customerPage, asUser }) => {
    await customerPage.expectLoaded();

    const manager = await asUser(data.userIds.MG);
    await manager.expectLoggedInAs(data.userIds.MG);
  });
});
