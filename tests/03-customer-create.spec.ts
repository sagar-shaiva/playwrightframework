import { test, expect } from "../src/fixtures/test.fixture";
import { data, getAuthFile } from "../config/env.config";
import { saveRuntimeData } from "../src/utils/runtimeData";
import { Database } from "../src/utils/database";
import type { CustomerRow } from "../src/types/database.types";

test.use({ storageState: getAuthFile(data.userIds.SU) });

test("SU creates customer for transaction workflow", async ({ customerPage, db }, testInfo) => {
  const flow = data.generatedCustomerFlow;
  let customerId = "";

  await test.step("UI: create customer", async () => {
    await customerPage.open();
    await customerPage.expectUser(data.userIds.SU);

    customerId = await customerPage.createCustomer(flow.name, flow.type, flow.openingBalance);
    saveRuntimeData(testInfo, "customerId", customerId);

    await expect(customerPage.customerName).toContainText(customerId);
  });

  await test.step("DB: customer is stored", async () => {
    if (!Database.isAvailable()) return;

    const rows = await db.query<CustomerRow>(
      `SELECT CustomerId, CustomerName, CustomerType, Balance
       FROM dbo.Customers
       WHERE CustomerId = @customerId`,
      { customerId },
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ CustomerId: customerId, CustomerName: flow.name, CustomerType: flow.type });
    expect(Number(rows[0].Balance)).toBe(flow.openingBalance);
  });
});
