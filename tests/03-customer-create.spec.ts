import { test, expect } from "../src/fixtures/test.fixtures";
import { saveRuntimeData } from "../src/utils/runtimeData";
import { Database } from "../src/utils/database";
import type { CustomerRow } from "../src/types/database.types";

test.use({ authRole: "superUser" });

test('The Super User creates the new customer "retail"', async ({ customerPage, db, testData }, testInfo) => {
  const newCustomer = testData.newCustomers.retail;
  let customerId = "";

  await test.step("UI: create the new customer", async () => {
    await customerPage.expectLoaded();
    await customerPage.expectLoggedInAs(testData.users.superUser);

    customerId = await customerPage.createCustomer(newCustomer.name, newCustomer.type, newCustomer.openingBalance);
    saveRuntimeData(testInfo, "customerId", customerId);

    await expect(customerPage.customerName).toContainText(newCustomer.name);
    await expect(customerPage.customerName).toContainText(customerId);
  });

  await test.step("DB: the new customer is stored", async () => {
    if (!Database.isAvailable()) return;

    const rows = await db.query<CustomerRow>(`SELECT CustomerId, CustomerName, CustomerType, Balance FROM dbo.Customers WHERE CustomerId = @customerId`, { customerId });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ CustomerId: customerId, CustomerName: newCustomer.name, CustomerType: newCustomer.type });
    expect(Number(rows[0].Balance)).toBe(newCustomer.openingBalance);
  });
});
