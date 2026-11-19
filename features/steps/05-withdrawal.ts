import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";
import { Database } from "../../src/utils/database";
import type { CustomerBalanceRow, TransactionRow } from "../../src/types/database.types";

const { When, Then } = createBdd(test);

When("I withdraw {string}", async ({ transactionPage, testData }, withdrawalKey: string) => {
  const withdrawal = testData.withdrawals[withdrawalKey];
  await transactionPage.submitTransaction("withdraw", withdrawal.amount, withdrawal.reason);
});

When("I withdraw {string} with reason {string}", async ({ transactionPage, testData }, withdrawalKey: string, reasonKey: string) => {
  await transactionPage.submitTransaction("withdraw", testData.withdrawals[withdrawalKey].amount, testData.withdrawalReasons[reasonKey]);
});

When("I withdraw the full balance", async ({ transactionPage, scenario }) => {
  await transactionPage.submitTransaction("withdraw", scenario.balanceBefore);
});

When("I withdraw {string} more than the balance", async ({ transactionPage, testData, scenario }, excessKey: string) => {
  await transactionPage.submitTransaction("withdraw", scenario.balanceBefore + testData.amountsAboveBalance[excessKey]);
});

When("I withdraw invalid amount {string}", async ({ transactionPage, testData }, invalidAmountKey: string) => {
  await transactionPage.submitTransaction("withdraw", testData.invalidAmounts[invalidAmountKey]);
});

When("I choose the withdrawal transaction type", async ({ transactionPage }) => {
  await transactionPage.type.selectOption("withdraw");
});

Then("I see the balance reduced by withdrawal {string}", async ({ transactionPage, testData, scenario }, withdrawalKey: string) => {
  expect(await transactionPage.getBalance()).toBeCloseTo(scenario.balanceBefore - testData.withdrawals[withdrawalKey].amount, 2);
});

Then("I see the balance is zero", async ({ transactionPage }) => {
  expect(await transactionPage.getBalance()).toBe(0);
});

Then("I see withdrawal reason {string} selected", async ({ transactionPage, testData }, reasonKey: string) => {
  await transactionPage.expectSelectedReason(testData.withdrawalReasons[reasonKey]);
});

Then("I see only the withdrawal reasons offered", async ({ transactionPage, testData }) => {
  await transactionPage.expectReasons(Object.values(testData.withdrawalReasons));
});

Then("I see withdrawal {string} saved in the database", async ({ transactionPage, db, testData, scenario }, withdrawalKey: string) => {
  if (!Database.isAvailable()) return;

  const withdrawal = testData.withdrawals[withdrawalKey];
  const transactionId = (await transactionPage.transactionId.textContent()) ?? "";
  const balanceAfter = scenario.balanceBefore - withdrawal.amount;

  const transactionRows = await db.query<TransactionRow>(
    `SELECT TransactionId, TransactionType, Amount, BalanceBefore, BalanceAfter, Reason, TransactionDateTime, CreatedBy
     FROM dbo.Transactions WHERE TransactionId = @transactionId AND CustomerId = @customerId`,
    { transactionId: Number(transactionId), customerId: scenario.customerId },
  );

  expect(transactionRows).toHaveLength(1);
  expect(transactionRows[0]).toMatchObject({
    TransactionId: transactionId,
    TransactionType: testData.transactionTypes.withdrawal,
    Reason: withdrawal.reason,
    CreatedBy: testData.users.teller,
  });
  expect(Number(transactionRows[0].Amount)).toBe(withdrawal.amount);
  expect(Number(transactionRows[0].BalanceBefore)).toBe(scenario.balanceBefore);
  expect(Number(transactionRows[0].BalanceAfter)).toBe(balanceAfter);
  expect(transactionRows[0].TransactionDateTime).toBeInstanceOf(Date);

  const customerRows = await db.query<CustomerBalanceRow>("SELECT Balance FROM dbo.Customers WHERE CustomerId = @customerId", {
    customerId: scenario.customerId,
  });
  expect(customerRows).toHaveLength(1);
  expect(Number(customerRows[0].Balance)).toBe(balanceAfter);
});
