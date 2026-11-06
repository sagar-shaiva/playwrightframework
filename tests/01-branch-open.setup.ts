import { test as setup } from "@playwright/test";
import { data } from "../config/env.config";
import { BranchPage } from "../src/pages/BranchPage";
import { CustomerPage } from "../src/pages/CustomerPage";
import { LoginPage } from "../src/pages/LoginPage";

setup("open branch before authentication", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.login(data.userIds.SU, data.password);

  const customerPage = new CustomerPage(page);
  await customerPage.expectUser(data.userIds.SU);

  const branchPage = new BranchPage(page);
  await branchPage.ensureOpen();
});
