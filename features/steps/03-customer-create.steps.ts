import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";
import { Database } from "../../src/utils/database";
import { getRuntimeData, saveRuntimeData } from "../../src/utils/runtimeData";
import type { CustomerRow } from "../../src/types/database.types";

const { Given, When, Then } = createBdd(test, { tags: "@bdd03" });

Given("I am signed in as {string}", async ({ customerPage, testData }, role: string) => {
  await customerPage.expectLoaded();
  await customerPage.expectLoggedInAs(testData.users[role]);
});

When("I create the new customer {string}", async ({ customerPage, testData }, newCustomerKey: string) => {
  const newCustomer = testData.newCustomers[newCustomerKey];
  const customerId = await customerPage.createCustomer(newCustomer.name, newCustomer.type, newCustomer.openingBalance);
  saveRuntimeData(test.info(), "bddCustomerId", customerId);
});

Then("I see the new customer {string} with a generated customer ID", async ({ customerPage, testData }, newCustomerKey: string) => {
  await expect(customerPage.customerName).toContainText(testData.newCustomers[newCustomerKey].name);
  await expect(customerPage.customerName).toContainText(getRuntimeData<string>("bddCustomerId"));
});

Then("I see the new customer {string} saved in the database", async ({ db, testData }, newCustomerKey: string) => {
  if (!Database.isAvailable()) return;

  const newCustomer = testData.newCustomers[newCustomerKey];
  const customerId = getRuntimeData<string>("bddCustomerId");
  const rows = await db.query<CustomerRow>(`SELECT CustomerId, CustomerName, CustomerType, Balance FROM dbo.Customers WHERE CustomerId = @customerId`, { customerId });

  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ CustomerId: customerId, CustomerName: newCustomer.name, CustomerType: newCustomer.type });
  expect(Number(rows[0].Balance)).toBe(newCustomer.openingBalance);
});
