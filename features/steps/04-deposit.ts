import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";
import { Database } from "../../src/utils/database";
import type { CustomerBalanceRow, TransactionRow } from "../../src/types/database.types";

const { When, Then } = createBdd(test);

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

Then("I see the balance increased by deposit {string}", async ({ transactionPage, testData, scenario }, depositKey: string) => {
  expect(await transactionPage.getBalance()).toBeCloseTo(scenario.balanceBefore + testData.deposits[depositKey].amount, 2);
});

Then("I see deposit reason {string} selected", async ({ transactionPage, testData }, reasonKey: string) => {
  await transactionPage.expectSelectedReason(testData.depositReasons[reasonKey]);
});

Then("I see only the deposit reasons offered", async ({ transactionPage, testData }) => {
  await transactionPage.expectReasons(Object.values(testData.depositReasons));
});

Then("I see deposit {string} saved in the database", async ({ transactionPage, db, testData, scenario }, depositKey: string) => {
  if (!Database.isAvailable()) return;

  const deposit = testData.deposits[depositKey];
  const transactionId = (await transactionPage.transactionId.textContent()) ?? "";
  const balanceAfter = scenario.balanceBefore + deposit.amount;

  const transactionRows = await db.query<TransactionRow>(
    `SELECT TransactionId, TransactionType, Amount, BalanceBefore, BalanceAfter, Reason, TransactionDateTime, CreatedBy
     FROM dbo.Transactions WHERE TransactionId = @transactionId AND CustomerId = @customerId`,
    { transactionId: Number(transactionId), customerId: scenario.customerId },
  );

  expect(transactionRows).toHaveLength(1);
  expect(transactionRows[0]).toMatchObject({
    TransactionId: transactionId,
    TransactionType: testData.transactionTypes.deposit,
    Reason: deposit.reason,
    CreatedBy: testData.users.teller,
  });
  expect(Number(transactionRows[0].Amount)).toBe(deposit.amount);
  expect(Number(transactionRows[0].BalanceBefore)).toBe(scenario.balanceBefore);
  expect(Number(transactionRows[0].BalanceAfter)).toBe(balanceAfter);
  expect(transactionRows[0].TransactionDateTime).toBeInstanceOf(Date);

  const customerRows = await db.query<CustomerBalanceRow>("SELECT Balance FROM dbo.Customers WHERE CustomerId = @customerId", {
    customerId: scenario.customerId,
  });
  expect(customerRows).toHaveLength(1);
  expect(Number(customerRows[0].Balance)).toBe(balanceAfter);
});
