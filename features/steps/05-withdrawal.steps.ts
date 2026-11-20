import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";
import { Database } from "../../src/utils/database";
import { getRuntimeData } from "../../src/utils/runtimeData";
import type { CustomerBalanceRow, TransactionRow } from "../../src/types/database.types";

const { Given, When, Then } = createBdd(test, { tags: "@bdd05" });

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

// ---------- Withdrawal actions ----------

When("I withdraw {string}", async ({ transactionPage, testData }, withdrawalKey: string) => {
  const withdrawal = testData.withdrawals[withdrawalKey];
  await transactionPage.submitTransaction("withdraw", withdrawal.amount, withdrawal.reason);
});

When("I withdraw {string} with reason {string}", async ({ transactionPage, testData }, withdrawalKey: string, reasonKey: string) => {
  await transactionPage.submitTransaction("withdraw", testData.withdrawals[withdrawalKey].amount, testData.withdrawalReasons[reasonKey]);
});

When("I withdraw the full balance of customer {string}", async ({ transactionPage, testData }, customerKey: string) => {
  await transactionPage.submitTransaction("withdraw", testData.customers[customerKey].balance);
});

When("I withdraw {string} more than the balance of customer {string}", async ({ transactionPage, testData }, excessKey: string, customerKey: string) => {
  await transactionPage.submitTransaction("withdraw", testData.customers[customerKey].balance + testData.amountsAboveBalance[excessKey]);
});

When("I withdraw invalid amount {string}", async ({ transactionPage, testData }, invalidAmountKey: string) => {
  await transactionPage.submitTransaction("withdraw", testData.invalidAmounts[invalidAmountKey]);
});

When("I choose the withdrawal transaction type", async ({ transactionPage }) => {
  await transactionPage.type.selectOption("withdraw");
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

Then("I see the balance of customer {string} reduced by withdrawal {string}", async ({ transactionPage, testData }, customerKey: string, withdrawalKey: string) => {
  const expectedBalance = testData.customers[customerKey].balance - testData.withdrawals[withdrawalKey].amount;
  expect(await transactionPage.getBalance()).toBeCloseTo(expectedBalance, 2);
});

Then(
  "I see the new customer {string} balance after deposit {string} and withdrawal {string}",
  async ({ transactionPage, testData }, newCustomerKey: string, depositKey: string, withdrawalKey: string) => {
    const expectedBalance = testData.newCustomers[newCustomerKey].openingBalance + testData.deposits[depositKey].amount - testData.withdrawals[withdrawalKey].amount;
    expect(await transactionPage.getBalance()).toBeCloseTo(expectedBalance, 2);
  },
);

Then("I see the balance is zero", async ({ transactionPage }) => {
  expect(await transactionPage.getBalance()).toBe(0);
});

Then("I see withdrawal reason {string} selected", async ({ transactionPage, testData }, reasonKey: string) => {
  await transactionPage.expectSelectedReason(testData.withdrawalReasons[reasonKey]);
});

Then("I see only the withdrawal reasons offered", async ({ transactionPage, testData }) => {
  await transactionPage.expectReasons(Object.values(testData.withdrawalReasons));
});

Then("I see withdrawal {string} saved in the database", async ({ transactionPage, db, testData }, withdrawalKey: string) => {
  if (!Database.isAvailable()) return;

  const withdrawal = testData.withdrawals[withdrawalKey];
  const customerId = getRuntimeData<string>("bddCustomerId");
  const transactionId = (await transactionPage.transactionId.textContent()) ?? "";

  const transactionRows = await db.query<TransactionRow>(
    `SELECT TransactionId, TransactionType, Amount, BalanceBefore, BalanceAfter, Reason, TransactionDateTime, CreatedBy
     FROM dbo.Transactions WHERE TransactionId = @transactionId AND CustomerId = @customerId`,
    { transactionId: Number(transactionId), customerId },
  );

  expect(transactionRows).toHaveLength(1);
  expect(transactionRows[0]).toMatchObject({
    TransactionId: transactionId,
    TransactionType: testData.transactionTypes.withdrawal,
    Reason: withdrawal.reason,
    CreatedBy: testData.users.teller,
  });
  const balanceAfter = Number(transactionRows[0].BalanceAfter);
  expect(Number(transactionRows[0].Amount)).toBe(withdrawal.amount);
  expect(balanceAfter).toBe(Number(transactionRows[0].BalanceBefore) - withdrawal.amount);
  expect(transactionRows[0].TransactionDateTime).toBeInstanceOf(Date);

  const customerRows = await db.query<CustomerBalanceRow>("SELECT Balance FROM dbo.Customers WHERE CustomerId = @customerId", { customerId });
  expect(customerRows).toHaveLength(1);
  expect(Number(customerRows[0].Balance)).toBe(balanceAfter);
});
