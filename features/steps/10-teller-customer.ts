import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";
import { data } from "../../config/env.config";

const { Given, When, Then } = createBdd(test, { tags: "@bdd10" });

Given("I am signed in as the Teller", async ({ customerPage }) => {
  await customerPage.expectLoaded();
  await customerPage.expectLoggedInAs(data.userIds.T);
});

When("I search for the configured retail customer", async ({ customerPage }) => {
  await customerPage.searchCustomer(data.customers.valid.id);
});

Then("the retail customer's details and balance are displayed", async ({ customerPage }) => {
  await customerPage.expectCustomerFound(data.customers.valid.name);
  expect(await customerPage.getBalance()).toBe(data.customers.valid.balance);
});

When("I search for the configured corporate customer", async ({ customerPage }) => {
  await customerPage.searchCustomer(data.customers.corporate.id);
});

Then("the corporate customer's details and balance are displayed", async ({ customerPage }) => {
  await customerPage.expectCustomerFound(data.customers.corporate.name);
  expect(await customerPage.getBalance()).toBe(data.customers.corporate.balance);
});

When("I search for an unknown customer", async ({ customerPage, dialogs }) => {
  dialogs.expectNext(data.expectedMessages.customerNotFound);
  await customerPage.searchCustomer(data.customers.invalid.id);
});

Then("the customer not found message is displayed", async ({ customerPage }) => {
  await customerPage.expectCustomerNotFound();
});
