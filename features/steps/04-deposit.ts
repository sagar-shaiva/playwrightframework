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

Given("the Teller session is active", async ({ customerPage }) => {
  await customerPage.expectLoaded();
  await customerPage.expectLoggedInAs(data.userIds.T);
});

Given("the Branch Manager session is active", async ({ customerPage }) => {
  await customerPage.expectLoaded();
  await customerPage.expectLoggedInAs(data.userIds.BM);
});

When("the Teller deposits the configured amount into the BDD customer", async ({ customerPage, transactionPage, dialogs }) => {
  const flow = data.generatedCustomerFlow;
  const customerId = getRuntimeData<string>("bddCustomerId");
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(customerId);
  await customerPage.expectCustomerFound(flow.name);
  await customerPage.goToTransactionPage();
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("deposit", flow.depositAmount, flow.depositReason);
  await transactionPage.expectSuccess();
  transactionId = (await transactionPage.transactionId.textContent()) ?? "";
  balanceAfterDeposit = flow.openingBalance + flow.depositAmount;
  saveRuntimeData(test.info(), "bddDepositTransactionId", transactionId);
});

Then("the customer balance includes the deposit", async ({ transactionPage }) => {
  expect(await transactionPage.getBalance()).toBe(balanceAfterDeposit);
});

Then("the deposit is stored in the database when available", async ({ db }) => {
  if (!Database.isAvailable()) return;
  const customerId = getRuntimeData<string>("bddCustomerId");
  const rows = await db.query<TransactionRow>(
    `SELECT TransactionId, TransactionType, Amount, BalanceBefore, BalanceAfter, Reason, CreatedBy
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
  expect(Number(rows[0].BalanceAfter)).toBe(balanceAfterDeposit);
  const customerRows = await db.query<CustomerBalanceRow>("SELECT Balance FROM dbo.Customers WHERE CustomerId = @customerId", { customerId });
  expect(Number(customerRows[0].Balance)).toBe(balanceAfterDeposit);
});

When("the Teller submits a deposit without selecting a customer", async ({ customerPage, transactionPage, dialogs }) => {
  await customerPage.expectLoaded();
  await customerPage.goToTransactionPage();
  dialogs.expectNext(data.expectedMessages.customerRequired);
  await transactionPage.submitTransaction("deposit", data.transactions.unselectedCustomerAmount);
});

Then("the customer selection error is shown", async ({ transactionPage }) => {
  await transactionPage.expectError(data.expectedMessages.customerRequired);
});

When("the Teller opens deposit reasons for a known customer", async ({ customerPage, transactionPage }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  await customerPage.goToTransactionPage();
  await transactionPage.type.selectOption("deposit");
});

Then("only configured deposit reasons are available", async ({ transactionPage }) => {
  await transactionPage.expectReasons(data.transactions.deposit.reasons);
});

When("the Teller deposits the configured decimal amount", async ({ customerPage, transactionPage, dialogs }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  balanceBeforeDecimalDeposit = await customerPage.getBalance();
  await customerPage.goToTransactionPage();
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("deposit", data.transactions.deposit.decimalAmount);
  await transactionPage.expectSuccess();
});

Then("the balance increases by the decimal deposit amount", async ({ transactionPage }) => {
  expect(await transactionPage.getBalance()).toBeCloseTo(balanceBeforeDecimalDeposit + data.transactions.deposit.decimalAmount, 2);
});

When("the Teller prepares the deposit form for an existing customer", async ({ customerPage }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  await customerPage.goToTransactionPage();
});

Then("the configured deposit increases the balance", async ({ transactionPage, dialogs }) => {
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("deposit", data.transactions.deposit.amount, data.transactions.deposit.reason);
  await transactionPage.expectSuccess();
  expect(await transactionPage.getBalance()).toBe(data.transactions.deposit.expectedBalance);
});

Then("the first configured deposit reason is accepted", async ({ transactionPage, dialogs }) => {
  const reason = data.transactions.deposit.reasons[0];
  if (!reason) throw new Error("No deposit reason exists for this scenario tag");
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("deposit", data.transactions.deposit.amount, reason);
  await transactionPage.expectSuccess();
  await transactionPage.expectSelectedReason(reason);
});

Then("the second configured deposit reason is accepted", async ({ transactionPage, dialogs }) => {
  const reason = data.transactions.deposit.reasons[1];
  if (!reason) throw new Error("No second deposit reason is configured");
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("deposit", data.transactions.deposit.amount, reason);
  await transactionPage.expectSuccess();
  await transactionPage.expectSelectedReason(reason);
});

Then("the third configured deposit reason is accepted", async ({ transactionPage, dialogs }) => {
  const reason = data.transactions.deposit.reasons[2];
  if (!reason) throw new Error("No third deposit reason is configured");
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("deposit", data.transactions.deposit.amount, reason);
  await transactionPage.expectSuccess();
  await transactionPage.expectSelectedReason(reason);
});

Then("the fourth configured deposit reason is accepted", async ({ transactionPage, dialogs }) => {
  const reason = data.transactions.deposit.reasons[3];
  if (!reason) throw new Error("No fourth deposit reason is configured");
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("deposit", data.transactions.deposit.amount, reason);
  await transactionPage.expectSuccess();
  await transactionPage.expectSelectedReason(reason);
});

Then("the fifth configured deposit reason is accepted", async ({ transactionPage, dialogs }) => {
  const reason = data.transactions.deposit.reasons[4];
  if (!reason) throw new Error("No fifth deposit reason is configured");
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("deposit", data.transactions.deposit.amount, reason);
  await transactionPage.expectSuccess();
  await transactionPage.expectSelectedReason(reason);
});

When("the Teller prepares the deposit form for amount checks", async ({ customerPage, transactionPage }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  await customerPage.goToTransactionPage();
  await transactionPage.type.selectOption("deposit");
});

Then("the first configured invalid deposit amount is rejected", async ({ transactionPage, dialogs }) => {
  const amount = data.transactions.invalidAmounts[0];
  if (amount === undefined) throw new Error("No invalid deposit amount is configured");
  dialogs.expectNext(data.expectedMessages.invalidAmount);
  await transactionPage.submitTransaction("deposit", amount);
  await transactionPage.expectError(data.expectedMessages.invalidAmount);
});

Then("the second configured invalid deposit amount is rejected", async ({ transactionPage, dialogs }) => {
  const amount = data.transactions.invalidAmounts[1];
  if (amount === undefined) throw new Error("No second invalid deposit amount is configured");
  dialogs.expectNext(data.expectedMessages.invalidAmount);
  await transactionPage.submitTransaction("deposit", amount);
  await transactionPage.expectError(data.expectedMessages.invalidAmount);
});

When("a Branch Manager opens the deposit page", async ({ customerPage, dialogs }) => {
  await customerPage.expectLoaded();
  dialogs.expectNext(data.expectedMessages.tellerRequired);
  await customerPage.goToTransactionPage();
});

Then("the transaction is blocked for a non-Teller", async ({ transactionPage }) => {
  await expect(transactionPage.submitButton).toBeDisabled();
  await transactionPage.expectError(data.expectedMessages.tellerRequired);
});
