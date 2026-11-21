import { createBdd } from "playwright-bdd";
import { test, expect } from "../src/fixtures/bdd.fixture";

const { Given, When, Then } = createBdd(test, { tags: "@bdd10" });

Given("I am signed in as {string}", async ({ customerPage, testData }, role: string) => {
  await customerPage.expectLoaded();
  await customerPage.expectLoggedInAs(testData.users[role]);
});

When("I search for customer {string}", async ({ customerPage, testData }, customerKey: string) => {
  await customerPage.searchCustomer(testData.customers[customerKey].id);
});

When("I search for unknown customer {string}", async ({ customerPage, testData }, unknownCustomerKey: string) => {
  await customerPage.searchCustomer(testData.unknownCustomers[unknownCustomerKey].id);
});

Then("I see the name and balance of customer {string}", async ({ customerPage, testData }, customerKey: string) => {
  const customer = testData.customers[customerKey];
  await customerPage.expectCustomerFound(customer.name);
  expect(await customerPage.getBalance()).toBe(customer.balance);
});

Then("I see the customer error {string}", async ({ customerPage, dialogs, testData }, messageKey: string) => {
  await dialogs.expectShown(testData.messages[messageKey]);
  await customerPage.expectCustomerNotFound();
});
