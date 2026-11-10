import { test, expect } from "../src/fixtures/test.fixture";
import { data, getAuthFile } from "../config/env.config";
const { customers } = data;
test.use({ storageState: getAuthFile(data.userIds.T) });
test.describe.serial("Teller customer lookup", () => {
    test.beforeEach(async ({ customerPage }) => {
        await customerPage.expectLoaded();
        await customerPage.expectLoggedInAs(data.userIds.T);
    });
    test("finds an existing retail customer", async ({ customerPage }) => {
        await customerPage.searchCustomer(customers.valid.id);
        await customerPage.expectCustomerFound(customers.valid.name);
        expect(await customerPage.getBalance()).toBe(customers.valid.balance);
    });
    test("finds an existing corporate customer", async ({ customerPage }) => {
        await customerPage.searchCustomer(customers.corporate.id);
        await customerPage.expectCustomerFound(customers.corporate.name);
        expect(await customerPage.getBalance()).toBe(customers.corporate.balance);
    });
    test("shows an error for an unknown customer", async ({ customerPage, dialogs }) => {
        dialogs.expectNext(data.expectedMessages.customerNotFound);
        await customerPage.searchCustomer(customers.invalid.id);
        await customerPage.expectCustomerNotFound();
    });
});
