import { test, expect } from "../src/fixtures/test.fixtures";

test.use({ authRole: "teller" });

test.describe("Customer lookup", () => {
  test.beforeEach(async ({ customerPage, testData }) => {
    await customerPage.expectLoaded();
    await customerPage.expectLoggedInAs(testData.users.teller);
  });

  for (const customer of ["retail", "corporate"]) {
    test(`The Teller finds customer "${customer}"`, async ({ customerPage, testData }) => {
      await customerPage.searchCustomer(testData.customers[customer].id);

      await customerPage.expectCustomerFound(testData.customers[customer].name);
      expect(await customerPage.getBalance()).toBe(testData.customers[customer].balance);
    });
  }

  for (const unknownCustomer of ["notRegistered"]) {
    test(`The Teller cannot find unknown customer "${unknownCustomer}"`, async ({ customerPage, dialogs, testData }) => {
      await customerPage.searchCustomer(testData.unknownCustomers[unknownCustomer].id);

      await dialogs.expectShown(testData.messages.customerNotFound);
      await customerPage.expectCustomerNotFound();
    });
  }
});
