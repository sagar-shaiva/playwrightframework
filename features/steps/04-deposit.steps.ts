import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";
import { Database } from "../../src/utils/database";
import { getRuntimeData } from "../../src/utils/runtimeData";
import type { CustomerBalanceRow, TransactionRow } from "../../src/types/database.types";

const { Given, When, Then } = createBdd(test, { tags: "@bdd04" });

// ---------- Sign-in and navigation ----------

Given("I am signed in as {string}", async ({ customerPage, testData }, role: string) => {
  await customerPage.expectLoaded();
  await customerPage.expectLoggedInAs(testData.users[role]);
});

Given("I open customer {string} on the transaction page", async ({ customerPage, testData }, customerKey: string) => {
  const customer = testData.customers[customerKey];
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(customer.id);
  await customerPage.expectCustomerFound(customer.name);
  await customerPage.goToTransactionPage();
});

Given("I open the new customer {string} on the transaction page", async ({ customerPage, testData }, newCustomerKey: string) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(getRuntimeData<string>("bddCustomerId"));
  await customerPage.expectCustomerFound(testData.newCustomers[newCustomerKey].name);
  await customerPage.goToTransactionPage();
});

Given("I open the transaction page", async ({ customerPage }) => {
  await customerPage.expectLoaded();
  await customerPage.goToTransactionPage();
});

// ---------- Deposit actions ----------

When("I deposit {string}", async ({ transactionPage, testData }, depositKey: string) => {
  const deposit = testData.deposits[depositKey];
  await transactionPage.submitTransaction("deposit", deposit.amount, deposit.reason);
});

When("I deposit {string} with reason {string}", async ({ transactionPage, testData }, depositKey: string, reasonKey: string) => {
  await transactionPage.submitTransaction("deposit", testData.deposits[depositKey].amount, testData.depositReasons[reasonKey]);
});

When("I deposit invalid amount {string}", async ({ transactionPage, testData }, invalidAmountKey: string) => {
  await transactionPage.submitTransaction("deposit", testData.invalidAmounts[invalidAmountKey]);
});

When("I choose the deposit transaction type", async ({ transactionPage }) => {
  await transactionPage.type.selectOption("deposit");
});

// ---------- Checks ----------

Then("I see the success message {string}", async ({ transactionPage, dialogs, testData }, messageKey: string) => {
  await dialogs.expectShown(testData.messages[messageKey]);
  await transactionPage.expectSuccess();
});

Then("I see the transaction error {string}", async ({ transactionPage, dialogs, testData }, messageKey: string) => {
  await dialogs.expectShown(testData.messages[messageKey]);
  await transactionPage.expectError(testData.messages[messageKey]);
});

Then("I see the submit button disabled", async ({ transactionPage }) => {
  await expect(transactionPage.submitButton).toBeDisabled();
});

Then("I see the new customer {string} balance increased by deposit {string}", async ({ transactionPage, testData }, newCustomerKey: string, depositKey: string) => {
  const expectedBalance = testData.newCustomers[newCustomerKey].openingBalance + testData.deposits[depositKey].amount;
  expect(await transactionPage.getBalance()).toBeCloseTo(expectedBalance, 2);
});

Then("I see the balance of customer {string} increased by deposit {string}", async ({ transactionPage, testData }, customerKey: string, depositKey: string) => {
  const expectedBalance = testData.customers[customerKey].balance + testData.deposits[depositKey].amount;
  expect(await transactionPage.getBalance()).toBeCloseTo(expectedBalance, 2);
});

Then("I see deposit reason {string} selected", async ({ transactionPage, testData }, reasonKey: string) => {
  await transactionPage.expectSelectedReason(testData.depositReasons[reasonKey]);
});

Then("I see only the deposit reasons offered", async ({ transactionPage, testData }) => {
  await transactionPage.expectReasons(Object.values(testData.depositReasons));
});

Then("I see deposit {string} saved in the database for the new customer {string}", async ({ transactionPage, db, testData }, depositKey: string, newCustomerKey: string) => {
  if (!Database.isAvailable()) return;

  const deposit = testData.deposits[depositKey];
  const openingBalance = testData.newCustomers[newCustomerKey].openingBalance;
  const customerId = getRuntimeData<string>("bddCustomerId");
  const transactionId = (await transactionPage.transactionId.textContent()) ?? "";
  const balanceAfter = openingBalance + deposit.amount;

  const transactionRows = await db.query<TransactionRow>(
    `SELECT TransactionId, TransactionType, Amount, BalanceBefore, BalanceAfter, Reason, TransactionDateTime, CreatedBy
     FROM dbo.Transactions WHERE TransactionId = @transactionId AND CustomerId = @customerId`,
    { transactionId: Number(transactionId), customerId },
  );

  expect(transactionRows).toHaveLength(1);
  expect(transactionRows[0]).toMatchObject({
    TransactionId: transactionId,
    TransactionType: testData.transactionTypes.deposit,
    Reason: deposit.reason,
    CreatedBy: testData.users.teller,
  });
  expect(Number(transactionRows[0].Amount)).toBe(deposit.amount);
  expect(Number(transactionRows[0].BalanceBefore)).toBe(openingBalance);
  expect(Number(transactionRows[0].BalanceAfter)).toBe(balanceAfter);
  expect(transactionRows[0].TransactionDateTime).toBeInstanceOf(Date);

  const customerRows = await db.query<CustomerBalanceRow>("SELECT Balance FROM dbo.Customers WHERE CustomerId = @customerId", { customerId });
  expect(customerRows).toHaveLength(1);
  expect(Number(customerRows[0].Balance)).toBe(balanceAfter);
});
