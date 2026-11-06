import { test } from "../src/fixtures/test.fixture";
import { data, getAuthFile } from "../config/env.config";

test.describe("Multiple user workflow", () => {
  test.use({ storageState: getAuthFile(data.userIds.T) });

  test("Teller and Branch Manager work in the same test", async ({ customerPage, asUser }) => {
    await customerPage.open();
    await customerPage.expectUser(data.userIds.T);

    const branchManager = await asUser(data.userIds.BM);
    await branchManager.expectAuthenticatedAs(data.userIds.BM);
  });

  test("Teller and Manager work in another test", async ({ customerPage, asUser }) => {
    await customerPage.open();

    const manager = await asUser(data.userIds.MG);
    await manager.expectAuthenticatedAs(data.userIds.MG);
  });
});
