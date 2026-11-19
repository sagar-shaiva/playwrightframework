import * as fs from "fs";
import * as path from "path";
import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";
import { getAuthFile } from "../../config/env.config";
import { getRuntimeData } from "../../src/utils/runtimeData";

// Shared by every feature. Each quoted value is a key in src/data/<env>/<COUNTRY>.json.
const { Given, When, Then } = createBdd(test);

// ---------- Sign-in ----------

Given("I am on the login form", async ({ loginPage }) => {
  await loginPage.expectLoaded();
});

Given("I am signed in as {string}", async ({ customerPage, testData }, role: string) => {
  await customerPage.expectLoaded();
  await customerPage.expectLoggedInAs(testData.users[role]);
});

When("I sign in as {string}", async ({ loginPage, testData }, role: string) => {
  await loginPage.login(testData.users[role], testData.password);
});

When("I sign in as {string} with password {string}", async ({ loginPage, testData }, role: string, passwordKey: string) => {
  await loginPage.login(testData.users[role], testData.invalidPasswords[passwordKey]);
});

Then("I am authenticated as {string}", async ({ customerPage, testData }, role: string) => {
  await customerPage.expectLoggedInAs(testData.users[role]);
});

Then("I save the session of {string}", async ({ page, testData }, role: string) => {
  const authFile = getAuthFile(testData.users[role]);
  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});

Then("I see the login error {string}", async ({ loginPage, dialogs, testData }, messageKey: string) => {
  await dialogs.expectShown(testData.messages[messageKey]);
  await loginPage.expectError(testData.messages[messageKey]);
});

// ---------- Customers ----------

Given("I open customer {string} on the transaction page", async ({ customerPage, testData, scenario }, customerKey: string) => {
  const customer = testData.customers[customerKey];
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(customer.id);
  await customerPage.expectCustomerFound(customer.name);
  scenario.customerId = customer.id;
  scenario.balanceBefore = await customerPage.getBalance();
  await customerPage.goToTransactionPage();
});

Given("I open the new customer {string} on the transaction page", async ({ customerPage, testData, scenario }, newCustomerKey: string) => {
  await customerPage.expectLoaded();
  scenario.customerId = getRuntimeData<string>("bddCustomerId");
  await customerPage.searchCustomer(scenario.customerId);
  await customerPage.expectCustomerFound(testData.newCustomers[newCustomerKey].name);
  scenario.balanceBefore = await customerPage.getBalance();
  await customerPage.goToTransactionPage();
});

// ---------- Transactions ----------

Given("I open the transaction page", async ({ customerPage }) => {
  await customerPage.expectLoaded();
  await customerPage.goToTransactionPage();
});

Then("I see the success message {string}", async ({ transactionPage, dialogs, testData }, messageKey: string) => {
  await dialogs.expectShown(testData.messages[messageKey]);
  await transactionPage.expectSuccess();
});

Then("I see the transaction error {string}", async ({ transactionPage, dialogs, testData }, messageKey: string) => {
  await dialogs.expectShown(testData.messages[messageKey]);
  await transactionPage.expectError(testData.messages[messageKey]);
});

Then("I see the submit button disabled", async ({ transactionPage }) => {
  await expect(transactionPage.submitButton).toBeDisabled();
});

// ---------- Evidence ----------

Then("I take a screenshot {string}", async ({ takeScreenshot }, name: string) => {
  await takeScreenshot(name);
});
