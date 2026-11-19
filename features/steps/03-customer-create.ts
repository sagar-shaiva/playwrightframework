import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";
import { Database } from "../../src/utils/database";
import { saveRuntimeData } from "../../src/utils/runtimeData";
import type { CustomerRow } from "../../src/types/database.types";

const { When, Then } = createBdd(test);

When("I create the new customer {string}", async ({ customerPage, testData, scenario }, newCustomerKey: string) => {
  const newCustomer = testData.newCustomers[newCustomerKey];
  scenario.customerId = await customerPage.createCustomer(newCustomer.name, newCustomer.type, newCustomer.openingBalance);
  saveRuntimeData(test.info(), "bddCustomerId", scenario.customerId);
});

Then("I see the new customer {string} with a generated customer ID", async ({ customerPage, testData, scenario }, newCustomerKey: string) => {
  await expect(customerPage.customerName).toContainText(testData.newCustomers[newCustomerKey].name);
  await expect(customerPage.customerName).toContainText(scenario.customerId);
});

Then("I see the new customer {string} saved in the database", async ({ db, testData, scenario }, newCustomerKey: string) => {
  if (!Database.isAvailable()) return;

  const newCustomer = testData.newCustomers[newCustomerKey];
  const rows = await db.query<CustomerRow>(`SELECT CustomerId, CustomerName, CustomerType, Balance FROM dbo.Customers WHERE CustomerId = @customerId`, { customerId: scenario.customerId });

  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ CustomerId: scenario.customerId, CustomerName: newCustomer.name, CustomerType: newCustomer.type });
  expect(Number(rows[0].Balance)).toBe(newCustomer.openingBalance);
});
