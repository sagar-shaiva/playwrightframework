import { test } from "../src/fixtures/test.fixtures";

test.describe("Multiple user sessions", () => {
  test.use({ authRole: "teller" });

  for (const otherRole of ["branchManager", "manager"]) {
    test(`"teller" and "${otherRole}" work in separate sessions`, async ({ customerPage, asUser, testData }) => {
      await customerPage.expectLoaded();
      await customerPage.expectLoggedInAs(testData.users.teller);

      const secondSession = await asUser(otherRole);

      await secondSession.expectLoggedInAs(testData.users[otherRole]);
    });
  }
});
