import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";
import { data } from "../../config/env.config";
import { Database } from "../../src/utils/database";
import { saveRuntimeData } from "../../src/utils/runtimeData";
import type { CustomerRow } from "../../src/types/database.types";

const { Given, When, Then } = createBdd(test, { tags: "@bdd03" });
let customerId = "";

Given("I am signed in as the Super User", async ({ customerPage }) => {
  await customerPage.expectLoaded();
  await customerPage.expectLoggedInAs(data.userIds.SU);
});

When("I create the configured customer", async ({ customerPage }) => {
  const flow = data.generatedCustomerFlow;
  customerId = await customerPage.createCustomer(flow.name, flow.type, flow.openingBalance);
  saveRuntimeData(test.info(), "bddCustomerId", customerId);
});

Then("the customer is available to later BDD scenarios", async ({ customerPage }) => {
  await expect(customerPage.customerName).toContainText(customerId);
});

Then("the customer is saved in the database when database checks are enabled", async ({ db }) => {
  if (!Database.isAvailable()) return;
  const flow = data.generatedCustomerFlow;
  const rows = await db.query<CustomerRow>(`SELECT CustomerId, CustomerName, CustomerType, Balance FROM dbo.Customers WHERE CustomerId = @customerId`, { customerId });
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ CustomerId: customerId, CustomerName: flow.name, CustomerType: flow.type });
  expect(Number(rows[0].Balance)).toBe(flow.openingBalance);
});
