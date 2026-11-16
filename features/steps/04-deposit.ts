import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";
import { data } from "../../config/env.config";
import { getRuntimeData, saveRuntimeData } from "../../src/utils/runtimeData";
import { Database } from "../../src/utils/database";
import type { CustomerBalanceRow, TransactionRow } from "../../src/types/database.types";

const { Given, When, Then } = createBdd(test, { tags: "@bdd04" });
let transactionId = "";
let balanceAfterDeposit = 0;
let balanceBeforeDecimalDeposit = 0;

Given("I am signed in as the Teller", async ({ customerPage }) => {
  await customerPage.expectLoaded();
  await customerPage.expectLoggedInAs(data.userIds.T);
});

Given("I am signed in as the Branch Manager", async ({ customerPage }) => {
  await customerPage.expectLoaded();
  await customerPage.expectLoggedInAs(data.userIds.BM);
});

When("I deposit the configured amount into the customer created in this workflow", async ({ customerPage, transactionPage, dialogs }) => {
  const flow = data.generatedCustomerFlow;
  const customerId = getRuntimeData<string>("bddCustomerId");
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(customerId);
  await customerPage.expectCustomerFound(flow.name);
  expect(await customerPage.getBalance()).toBe(flow.openingBalance);
  await customerPage.goToTransactionPage();
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("deposit", flow.depositAmount, flow.depositReason);
  await transactionPage.expectSuccess();
  await expect(transactionPage.transactionId).toHaveText(/^\d+$/);
  transactionId = (await transactionPage.transactionId.textContent()) ?? "";
  balanceAfterDeposit = flow.openingBalance + flow.depositAmount;
  saveRuntimeData(test.info(), "bddDepositTransactionId", transactionId);
});

Then("the customer's balance reflects the deposit", async ({ transactionPage }) => {
  expect(await transactionPage.getBalance()).toBe(balanceAfterDeposit);
});

Then("the deposit is saved in the database when database checks are enabled", async ({ db }) => {
  if (!Database.isAvailable()) return;
  const customerId = getRuntimeData<string>("bddCustomerId");
  const rows = await db.query<TransactionRow>(
    `SELECT TransactionId, TransactionType, Amount, BalanceBefore, BalanceAfter, Reason, TransactionDateTime, CreatedBy
     FROM dbo.Transactions WHERE TransactionId = @transactionId AND CustomerId = @customerId`,
    { transactionId: Number(transactionId), customerId },
  );
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    TransactionId: transactionId,
    TransactionType: data.transactions.deposit.databaseType,
    Reason: data.generatedCustomerFlow.depositReason,
    CreatedBy: data.userIds.T,
  });
  expect(Number(rows[0].Amount)).toBe(data.generatedCustomerFlow.depositAmount);
  expect(Number(rows[0].BalanceBefore)).toBe(data.generatedCustomerFlow.openingBalance);
  expect(Number(rows[0].BalanceAfter)).toBe(balanceAfterDeposit);
  expect(rows[0].TransactionDateTime).toBeInstanceOf(Date);
  const customerRows = await db.query<CustomerBalanceRow>("SELECT Balance FROM dbo.Customers WHERE CustomerId = @customerId", { customerId });
  expect(customerRows).toHaveLength(1);
  expect(Number(customerRows[0].Balance)).toBe(balanceAfterDeposit);
});

When("I submit a deposit without selecting a customer", async ({ customerPage, transactionPage, dialogs }) => {
  await customerPage.expectLoaded();
  await customerPage.goToTransactionPage();
  dialogs.expectNext(data.expectedMessages.customerRequired);
  await transactionPage.submitTransaction("deposit", data.transactions.unselectedCustomerAmount);
});

Then("the customer selection error is displayed", async ({ transactionPage }) => {
  await transactionPage.expectError(data.expectedMessages.customerRequired);
});

When("I view the deposit reasons for a known customer", async ({ customerPage, transactionPage }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  await customerPage.goToTransactionPage();
  await transactionPage.type.selectOption("deposit");
});

Then("the available reasons match the configured deposit reasons", async ({ transactionPage }) => {
  await transactionPage.expectReasons(data.transactions.deposit.reasons);
});

When("I deposit the configured decimal amount", async ({ customerPage, transactionPage, dialogs }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  balanceBeforeDecimalDeposit = data.customers.valid.balance;
  await customerPage.goToTransactionPage();
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("deposit", data.transactions.deposit.decimalAmount);
  await transactionPage.expectSuccess();
});

Then("the customer's balance reflects the decimal deposit", async ({ transactionPage }) => {
  expect(await transactionPage.getBalance()).toBeCloseTo(balanceBeforeDecimalDeposit + data.transactions.deposit.decimalAmount, 2);
});

When("I prepare a deposit for an existing customer", async ({ customerPage }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  await customerPage.goToTransactionPage();
});

Then("the configured deposit completes and the expected balance is displayed", async ({ transactionPage, dialogs }) => {
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("deposit", data.transactions.deposit.amount, data.transactions.deposit.reason);
  await transactionPage.expectSuccess();
  expect(await transactionPage.getBalance()).toBe(data.transactions.deposit.expectedBalance);
});

Then("the first configured deposit reason is accepted", async ({ transactionPage, dialogs }) => {
  const reason = data.transactions.deposit.reasons[0];
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("deposit", data.transactions.deposit.amount, reason);
  await transactionPage.expectSuccess();
  await transactionPage.expectSelectedReason(reason);
});

Then("the second configured deposit reason is accepted", async ({ transactionPage, dialogs }) => {
  const reason = data.transactions.deposit.reasons[1];
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("deposit", data.transactions.deposit.amount, reason);
  await transactionPage.expectSuccess();
  await transactionPage.expectSelectedReason(reason);
});

Then("the third configured deposit reason is accepted", async ({ transactionPage, dialogs }) => {
  const reason = data.transactions.deposit.reasons[2];
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("deposit", data.transactions.deposit.amount, reason);
  await transactionPage.expectSuccess();
  await transactionPage.expectSelectedReason(reason);
});

Then("the fourth configured deposit reason is accepted", async ({ transactionPage, dialogs }) => {
  const reason = data.transactions.deposit.reasons[3];
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("deposit", data.transactions.deposit.amount, reason);
  await transactionPage.expectSuccess();
  await transactionPage.expectSelectedReason(reason);
});

Then("the fifth configured deposit reason is accepted", async ({ transactionPage, dialogs }) => {
  const reason = data.transactions.deposit.reasons[4];
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("deposit", data.transactions.deposit.amount, reason);
  await transactionPage.expectSuccess();
  await transactionPage.expectSelectedReason(reason);
});

When("I prepare the deposit form for amount checks", async ({ customerPage, transactionPage }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  await customerPage.goToTransactionPage();
  await transactionPage.type.selectOption("deposit");
});

Then("the first configured invalid deposit amount is rejected", async ({ transactionPage, dialogs }) => {
  const amount = data.transactions.invalidAmounts[0];
  dialogs.expectNext(data.expectedMessages.invalidAmount);
  await transactionPage.submitTransaction("deposit", amount);
  await transactionPage.expectError(data.expectedMessages.invalidAmount);
});

Then("the second configured invalid deposit amount is rejected", async ({ transactionPage, dialogs }) => {
  const amount = data.transactions.invalidAmounts[1];
  dialogs.expectNext(data.expectedMessages.invalidAmount);
  await transactionPage.submitTransaction("deposit", amount);
  await transactionPage.expectError(data.expectedMessages.invalidAmount);
});

When("a Branch Manager attempts to open the deposit page", async ({ customerPage, dialogs }) => {
  await customerPage.expectLoaded();
  dialogs.expectNext(data.expectedMessages.tellerRequired);
  await customerPage.goToTransactionPage();
});

Then("the application prevents the transaction", async ({ transactionPage }) => {
  await expect(transactionPage.submitButton).toBeDisabled();
  await transactionPage.expectError(data.expectedMessages.tellerRequired);
});
