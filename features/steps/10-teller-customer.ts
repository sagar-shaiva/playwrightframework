import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";

const { When, Then } = createBdd(test);

When("I search for customer {string}", async ({ customerPage, testData }, customerKey: string) => {
  await customerPage.searchCustomer(testData.customers[customerKey].id);
});

Then("I see the name and balance of customer {string}", async ({ customerPage, testData }, customerKey: string) => {
  const customer = testData.customers[customerKey];
  await customerPage.expectCustomerFound(customer.name);
  expect(await customerPage.getBalance()).toBe(customer.balance);
});

When("I search for unknown customer {string}", async ({ customerPage, testData }, unknownCustomerKey: string) => {
  await customerPage.searchCustomer(testData.unknownCustomers[unknownCustomerKey].id);
});

Then("I see the customer error {string}", async ({ customerPage, dialogs, testData }, messageKey: string) => {
  await dialogs.expectShown(testData.messages[messageKey]);
  await customerPage.expectCustomerNotFound();
});
