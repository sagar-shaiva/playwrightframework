import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";
import { data } from "../../config/env.config";
import { getRuntimeData, saveRuntimeData } from "../../src/utils/runtimeData";
import { Database } from "../../src/utils/database";
import type { CustomerBalanceRow, TransactionRow } from "../../src/types/database.types";

const { Given, When, Then } = createBdd(test, { tags: "@bdd05" });
let transactionId = "";
let balanceAfterWithdrawal = 0;

Given("the Teller session is active", async ({ customerPage }) => {
  await customerPage.expectLoaded();
  await customerPage.expectLoggedInAs(data.userIds.T);
});

When("the Teller withdraws the configured amount from the BDD customer", async ({ customerPage, transactionPage, dialogs }) => {
  const flow = data.generatedCustomerFlow;
  const customerId = getRuntimeData<string>("bddCustomerId");
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(customerId);
  await customerPage.expectCustomerFound(flow.name);
  await customerPage.goToTransactionPage();
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("withdraw", flow.withdrawalAmount, flow.withdrawalReason);
  await transactionPage.expectSuccess();
  transactionId = (await transactionPage.transactionId.textContent()) ?? "";
  balanceAfterWithdrawal = flow.openingBalance + flow.depositAmount - flow.withdrawalAmount;
  saveRuntimeData(test.info(), "bddWithdrawalTransactionId", transactionId);
});

Then("the customer balance reflects the withdrawal", async ({ transactionPage }) => {
  expect(await transactionPage.getBalance()).toBe(balanceAfterWithdrawal);
});

Then("the withdrawal is stored in the database when available", async ({ db }) => {
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
    TransactionType: data.transactions.withdraw.databaseType,
    Reason: data.generatedCustomerFlow.withdrawalReason,
    CreatedBy: data.userIds.T,
  });
  expect(Number(rows[0].Amount)).toBe(data.generatedCustomerFlow.withdrawalAmount);
  expect(Number(rows[0].BalanceAfter)).toBe(balanceAfterWithdrawal);
  const customerRows = await db.query<CustomerBalanceRow>("SELECT Balance FROM dbo.Customers WHERE CustomerId = @customerId", { customerId });
  expect(Number(customerRows[0].Balance)).toBe(balanceAfterWithdrawal);
});

When("the Teller submits a withdrawal without selecting a customer", async ({ customerPage, transactionPage, dialogs }) => {
  await customerPage.expectLoaded();
  await customerPage.goToTransactionPage();
  dialogs.expectNext(data.expectedMessages.customerRequired);
  await transactionPage.submitTransaction("withdraw", data.transactions.unselectedCustomerAmount);
});

Then("the customer selection error is shown", async ({ transactionPage }) => {
  await transactionPage.expectError(data.expectedMessages.customerRequired);
});

When("the Teller opens withdrawal reasons for a known customer", async ({ customerPage, transactionPage }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  await customerPage.goToTransactionPage();
  await transactionPage.type.selectOption("withdraw");
});

Then("only configured withdrawal reasons are available", async ({ transactionPage }) => {
  await transactionPage.expectReasons(data.transactions.withdraw.reasons);
});

When("the Teller prepares a withdrawal from an existing customer", async ({ customerPage }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  await customerPage.goToTransactionPage();
});

Then("the configured withdrawal decreases the balance", async ({ transactionPage, dialogs }) => {
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("withdraw", data.transactions.withdraw.amount, data.transactions.withdraw.reason);
  await transactionPage.expectSuccess();
  expect(await transactionPage.getBalance()).toBe(data.transactions.withdraw.expectedBalance);
});

Then("the first configured withdrawal reason is accepted", async ({ transactionPage, dialogs }) => {
  const reason = data.transactions.withdraw.reasons[0];
  if (!reason) throw new Error("No withdrawal reason is configured");
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("withdraw", data.transactions.withdraw.amount, reason);
  await transactionPage.expectSuccess();
  await transactionPage.expectSelectedReason(reason);
});

Then("the second configured withdrawal reason is accepted", async ({ transactionPage, dialogs }) => {
  const reason = data.transactions.withdraw.reasons[1];
  if (!reason) throw new Error("No second withdrawal reason is configured");
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("withdraw", data.transactions.withdraw.amount, reason);
  await transactionPage.expectSuccess();
  await transactionPage.expectSelectedReason(reason);
});

Then("the third configured withdrawal reason is accepted", async ({ transactionPage, dialogs }) => {
  const reason = data.transactions.withdraw.reasons[2];
  if (!reason) throw new Error("No third withdrawal reason is configured");
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("withdraw", data.transactions.withdraw.amount, reason);
  await transactionPage.expectSuccess();
  await transactionPage.expectSelectedReason(reason);
});

Then("the fourth configured withdrawal reason is accepted", async ({ transactionPage, dialogs }) => {
  const reason = data.transactions.withdraw.reasons[3];
  if (!reason) throw new Error("No fourth withdrawal reason is configured");
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("withdraw", data.transactions.withdraw.amount, reason);
  await transactionPage.expectSuccess();
  await transactionPage.expectSelectedReason(reason);
});

Then("the fifth configured withdrawal reason is accepted", async ({ transactionPage, dialogs }) => {
  const reason = data.transactions.withdraw.reasons[4];
  if (!reason) throw new Error("No fifth withdrawal reason is configured");
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("withdraw", data.transactions.withdraw.amount, reason);
  await transactionPage.expectSuccess();
  await transactionPage.expectSelectedReason(reason);
});

When("the Teller prepares the withdrawal form for amount checks", async ({ customerPage, transactionPage }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  await customerPage.goToTransactionPage();
});

Then("the first configured invalid withdrawal amount is rejected", async ({ transactionPage, dialogs }) => {
  const amount = data.transactions.invalidAmounts[0];
  if (amount === undefined) throw new Error("No invalid withdrawal amount is configured");
  dialogs.expectNext(data.expectedMessages.invalidAmount);
  await transactionPage.submitTransaction("withdraw", amount);
  await transactionPage.expectError(data.expectedMessages.invalidAmount);
});

Then("the second configured invalid withdrawal amount is rejected", async ({ transactionPage, dialogs }) => {
  const amount = data.transactions.invalidAmounts[1];
  if (amount === undefined) throw new Error("No second invalid withdrawal amount is configured");
  dialogs.expectNext(data.expectedMessages.invalidAmount);
  await transactionPage.submitTransaction("withdraw", amount);
  await transactionPage.expectError(data.expectedMessages.invalidAmount);
});

Then("the insufficient funds message is shown", async ({ transactionPage }) => {
  await transactionPage.expectError(data.expectedMessages.insufficientFunds);
});

When("the Teller submits a withdrawal above the balance", async ({ customerPage, transactionPage, dialogs }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  await customerPage.goToTransactionPage();
  dialogs.expectNext(data.expectedMessages.insufficientFunds);
  await transactionPage.submitTransaction("withdraw", data.transactions.overdraft.amount);
});

When("the Teller submits a withdrawal one cent above the balance", async ({ customerPage, transactionPage, dialogs }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  const amount = (await customerPage.getBalance()) + data.transactions.withdraw.overBalanceIncrement;
  await customerPage.goToTransactionPage();
  dialogs.expectNext(data.expectedMessages.insufficientFunds);
  await transactionPage.submitTransaction("withdraw", amount);
});

When("the Teller withdraws the available balance", async ({ customerPage, transactionPage, dialogs }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  const balance = await customerPage.getBalance();
  await customerPage.goToTransactionPage();
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("withdraw", balance);
  await transactionPage.expectSuccess();
});

Then("the remaining balance is zero", async ({ transactionPage }) => {
  expect(await transactionPage.getBalance()).toBe(0);
});
