import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";
import { data } from "../../config/env.config";
import { getRuntimeData, saveRuntimeData } from "../../src/utils/runtimeData";
import { Database } from "../../src/utils/database";
import type { CustomerBalanceRow, TransactionRow } from "../../src/types/database.types";

const { Given, When, Then } = createBdd(test, { tags: "@bdd05" });
let transactionId = "";
let balanceAfterWithdrawal = 0;

Given("I am signed in as the Teller", async ({ customerPage }) => {
  await customerPage.expectLoaded();
  await customerPage.expectLoggedInAs(data.userIds.T);
});

When("I withdraw the configured amount from the customer created in this workflow", async ({ customerPage, transactionPage, dialogs }) => {
  const flow = data.generatedCustomerFlow;
  const customerId = getRuntimeData<string>("bddCustomerId");
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(customerId);
  await customerPage.expectCustomerFound(flow.name);
  expect(await customerPage.getBalance()).toBe(flow.openingBalance + flow.depositAmount);
  await customerPage.goToTransactionPage();
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("withdraw", flow.withdrawalAmount, flow.withdrawalReason);
  await transactionPage.expectSuccess();
  await expect(transactionPage.transactionId).toHaveText(/^\d+$/);
  transactionId = (await transactionPage.transactionId.textContent()) ?? "";
  balanceAfterWithdrawal = flow.openingBalance + flow.depositAmount - flow.withdrawalAmount;
  saveRuntimeData(test.info(), "bddWithdrawalTransactionId", transactionId);
});

Then("the customer's balance reflects the withdrawal", async ({ transactionPage }) => {
  expect(await transactionPage.getBalance()).toBe(balanceAfterWithdrawal);
});

Then("the withdrawal is saved in the database when database checks are enabled", async ({ db }) => {
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
    TransactionType: data.transactions.withdraw.databaseType,
    Reason: data.generatedCustomerFlow.withdrawalReason,
    CreatedBy: data.userIds.T,
  });
  expect(Number(rows[0].Amount)).toBe(data.generatedCustomerFlow.withdrawalAmount);
  expect(Number(rows[0].BalanceBefore)).toBe(data.generatedCustomerFlow.openingBalance + data.generatedCustomerFlow.depositAmount);
  expect(Number(rows[0].BalanceAfter)).toBe(balanceAfterWithdrawal);
  expect(rows[0].TransactionDateTime).toBeInstanceOf(Date);
  const customerRows = await db.query<CustomerBalanceRow>("SELECT Balance FROM dbo.Customers WHERE CustomerId = @customerId", { customerId });
  expect(customerRows).toHaveLength(1);
  expect(Number(customerRows[0].Balance)).toBe(balanceAfterWithdrawal);
});

When("I submit a withdrawal without selecting a customer", async ({ customerPage, transactionPage, dialogs }) => {
  await customerPage.expectLoaded();
  await customerPage.goToTransactionPage();
  dialogs.expectNext(data.expectedMessages.customerRequired);
  await transactionPage.submitTransaction("withdraw", data.transactions.unselectedCustomerAmount);
});

Then("the customer selection error is displayed", async ({ transactionPage }) => {
  await transactionPage.expectError(data.expectedMessages.customerRequired);
});

When("I view the withdrawal reasons for a known customer", async ({ customerPage, transactionPage }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  await customerPage.goToTransactionPage();
  await transactionPage.type.selectOption("withdraw");
});

Then("the available reasons match the configured withdrawal reasons", async ({ transactionPage }) => {
  await transactionPage.expectReasons(data.transactions.withdraw.reasons);
});

When("I prepare a withdrawal from an existing customer", async ({ customerPage }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  await customerPage.goToTransactionPage();
});

Then("the configured withdrawal completes and the expected balance is displayed", async ({ transactionPage, dialogs }) => {
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("withdraw", data.transactions.withdraw.amount, data.transactions.withdraw.reason);
  await transactionPage.expectSuccess();
  expect(await transactionPage.getBalance()).toBe(data.transactions.withdraw.expectedBalance);
});

Then("the first configured withdrawal reason is accepted", async ({ transactionPage, dialogs }) => {
  const reason = data.transactions.withdraw.reasons[0];
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("withdraw", data.transactions.withdraw.amount, reason);
  await transactionPage.expectSuccess();
  await transactionPage.expectSelectedReason(reason);
});

Then("the second configured withdrawal reason is accepted", async ({ transactionPage, dialogs }) => {
  const reason = data.transactions.withdraw.reasons[1];
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("withdraw", data.transactions.withdraw.amount, reason);
  await transactionPage.expectSuccess();
  await transactionPage.expectSelectedReason(reason);
});

Then("the third configured withdrawal reason is accepted", async ({ transactionPage, dialogs }) => {
  const reason = data.transactions.withdraw.reasons[2];
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("withdraw", data.transactions.withdraw.amount, reason);
  await transactionPage.expectSuccess();
  await transactionPage.expectSelectedReason(reason);
});

Then("the fourth configured withdrawal reason is accepted", async ({ transactionPage, dialogs }) => {
  const reason = data.transactions.withdraw.reasons[3];
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("withdraw", data.transactions.withdraw.amount, reason);
  await transactionPage.expectSuccess();
  await transactionPage.expectSelectedReason(reason);
});

Then("the fifth configured withdrawal reason is accepted", async ({ transactionPage, dialogs }) => {
  const reason = data.transactions.withdraw.reasons[4];
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("withdraw", data.transactions.withdraw.amount, reason);
  await transactionPage.expectSuccess();
  await transactionPage.expectSelectedReason(reason);
});

When("I prepare the withdrawal form for amount checks", async ({ customerPage, transactionPage }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  await customerPage.goToTransactionPage();
});

Then("the first configured invalid withdrawal amount is rejected", async ({ transactionPage, dialogs }) => {
  const amount = data.transactions.invalidAmounts[0];
  dialogs.expectNext(data.expectedMessages.invalidAmount);
  await transactionPage.submitTransaction("withdraw", amount);
  await transactionPage.expectError(data.expectedMessages.invalidAmount);
});

Then("the second configured invalid withdrawal amount is rejected", async ({ transactionPage, dialogs }) => {
  const amount = data.transactions.invalidAmounts[1];
  dialogs.expectNext(data.expectedMessages.invalidAmount);
  await transactionPage.submitTransaction("withdraw", amount);
  await transactionPage.expectError(data.expectedMessages.invalidAmount);
});

Then("an insufficient funds message is displayed", async ({ transactionPage }) => {
  await transactionPage.expectError(data.expectedMessages.insufficientFunds);
});

When("I submit a withdrawal above the available balance", async ({ customerPage, transactionPage, dialogs }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  await customerPage.goToTransactionPage();
  dialogs.expectNext(data.expectedMessages.insufficientFunds);
  await transactionPage.submitTransaction("withdraw", data.transactions.overdraft.amount);
});

When("I submit a withdrawal one cent above the available balance", async ({ customerPage, transactionPage, dialogs }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  const amount = data.customers.valid.balance + data.transactions.withdraw.overBalanceIncrement;
  await customerPage.goToTransactionPage();
  dialogs.expectNext(data.expectedMessages.insufficientFunds);
  await transactionPage.submitTransaction("withdraw", amount);
});

When("I withdraw the available balance", async ({ customerPage, transactionPage, dialogs }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  const balance = data.customers.valid.balance;
  await customerPage.goToTransactionPage();
  dialogs.expectNext(data.expectedMessages.transactionSuccess);
  await transactionPage.submitTransaction("withdraw", balance);
  await transactionPage.expectSuccess();
});

Then("the remaining balance is zero", async ({ transactionPage }) => {
  expect(await transactionPage.getBalance()).toBe(0);
});
