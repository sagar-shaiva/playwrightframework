import { test, expect } from "../src/fixtures/test.fixture";
import { data, getAuthFile } from "../config/env.config";

const { customers } = data;

test.use({ storageState: getAuthFile(data.userIds.T) });

test.describe.serial("Teller customer lookup", () => {
  test.beforeEach(async ({ customerPage }) => {
    await customerPage.open();
    await customerPage.expectUser(data.userIds.T);
  });

  test("finds an existing retail customer", async ({ customerPage }) => {
    await customerPage.search(customers.valid.id);
    await customerPage.expectFound(customers.valid.name ?? "");
    expect(await customerPage.getBalance()).toBe(customers.valid.balance);
  });

  test("finds an existing corporate customer", async ({ customerPage }) => {
    await customerPage.search(customers.corporate.id);
    await customerPage.expectFound(customers.corporate.name ?? "");
    expect(await customerPage.getBalance()).toBe(customers.corporate.balance);
  });

  test("shows an error for an unknown customer", async ({ customerPage, dialogs }) => {
    dialogs.expectNext(data.expectedMessages.customerNotFound);
    await customerPage.search(customers.invalid.id);
    await customerPage.expectNotFound();
  });
});
