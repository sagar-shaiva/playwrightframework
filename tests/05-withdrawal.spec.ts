import { test, expect } from "../src/fixtures/test.fixtures";
import { getRuntimeData } from "../src/utils/runtimeData";
import { Database } from "../src/utils/database";
import type { CustomerBalanceRow, TransactionRow } from "../src/types/database.types";

test.describe("Customer withdrawals", () => {
  test.use({ authRole: "teller" });

  test('The Teller withdraws from the new customer "retail"', async ({ customerPage, transactionPage, dialogs, db, testData }) => {
    const withdrawal = testData.withdrawals.cash;
    const customerId = getRuntimeData<string>("customerId");
    let balanceBefore = 0;
    let transactionId = "";

    await test.step("UI: withdraw from the new customer", async () => {
      await customerPage.expectLoaded();
      await customerPage.expectLoggedInAs(testData.users.teller);
      await customerPage.searchCustomer(customerId);
      await customerPage.expectCustomerFound(testData.newCustomers.retail.name);
      balanceBefore = await customerPage.getBalance();
      await customerPage.goToTransactionPage();

      await transactionPage.submitTransaction("withdraw", withdrawal.amount, withdrawal.reason);
      await dialogs.expectShown(testData.messages.transactionSuccess);
      await transactionPage.expectSuccess();
      expect(await transactionPage.getBalance()).toBeCloseTo(balanceBefore - withdrawal.amount, 2);
      transactionId = (await transactionPage.transactionId.textContent()) ?? "";
    });

    await test.step("DB: the withdrawal and the customer balance are stored", async () => {
      if (!Database.isAvailable()) return;

      const balanceAfter = balanceBefore - withdrawal.amount;
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
      expect(Number(transactionRows[0].Amount)).toBe(withdrawal.amount);
      expect(Number(transactionRows[0].BalanceBefore)).toBe(balanceBefore);
      expect(Number(transactionRows[0].BalanceAfter)).toBe(balanceAfter);
      expect(transactionRows[0].TransactionDateTime).toBeInstanceOf(Date);

      const customerRows = await db.query<CustomerBalanceRow>("SELECT Balance FROM dbo.Customers WHERE CustomerId = @customerId", { customerId });
      expect(customerRows).toHaveLength(1);
      expect(Number(customerRows[0].Balance)).toBe(balanceAfter);
    });
  });

  for (const { customer, withdrawal } of [
    { customer: "retail", withdrawal: "standard" },
    { customer: "corporate", withdrawal: "standard" },
  ]) {
    test(`The Teller withdraws "${withdrawal}" from customer "${customer}"`, async ({ customerPage, transactionPage, dialogs, testData }) => {
      await customerPage.expectLoaded();
      await customerPage.expectLoggedInAs(testData.users.teller);
      await customerPage.searchCustomer(testData.customers[customer].id);
      await customerPage.expectCustomerFound(testData.customers[customer].name);
      const balanceBefore = await customerPage.getBalance();
      await customerPage.goToTransactionPage();

      await transactionPage.submitTransaction("withdraw", testData.withdrawals[withdrawal].amount, testData.withdrawals[withdrawal].reason);

      await dialogs.expectShown(testData.messages.transactionSuccess);
      await transactionPage.expectSuccess();
      expect(await transactionPage.getBalance()).toBeCloseTo(balanceBefore - testData.withdrawals[withdrawal].amount, 2);
    });
  }

  test.describe('with customer "retail" open on the transaction page', () => {
    let balanceBefore = 0;

    test.beforeEach(async ({ customerPage, testData }) => {
      await customerPage.expectLoaded();
      await customerPage.expectLoggedInAs(testData.users.teller);
      await customerPage.searchCustomer(testData.customers.retail.id);
      await customerPage.expectCustomerFound(testData.customers.retail.name);
      balanceBefore = await customerPage.getBalance();
      await customerPage.goToTransactionPage();
    });

    test('The Teller withdraws the full balance of customer "retail"', async ({ transactionPage, dialogs, testData }) => {
      await transactionPage.submitTransaction("withdraw", balanceBefore);

      await dialogs.expectShown(testData.messages.transactionSuccess);
      await transactionPage.expectSuccess();
      expect(await transactionPage.getBalance()).toBe(0);
    });

    for (const reason of ["cash", "billPayment", "transferSent", "serviceFee", "loanRepayment"]) {
      test(`The Teller withdraws using reason "${reason}"`, async ({ transactionPage, dialogs, testData }) => {
        await transactionPage.submitTransaction("withdraw", testData.withdrawals.standard.amount, testData.withdrawalReasons[reason]);

        await dialogs.expectShown(testData.messages.transactionSuccess);
        await transactionPage.expectSuccess();
        await transactionPage.expectSelectedReason(testData.withdrawalReasons[reason]);
      });
    }

    test("Only withdrawal reasons are offered for a withdrawal", async ({ transactionPage, testData }) => {
      await transactionPage.type.selectOption("withdraw");

      await transactionPage.expectReasons(Object.values(testData.withdrawalReasons));
    });

    test("A withdrawal far above the balance is rejected", async ({ transactionPage, dialogs, testData }) => {
      await transactionPage.submitTransaction("withdraw", testData.withdrawals.farAboveBalance.amount, testData.withdrawals.farAboveBalance.reason);

      await dialogs.expectShown(testData.messages.insufficientFunds);
      await transactionPage.expectError(testData.messages.insufficientFunds);
    });

    for (const excess of ["oneCent"]) {
      test(`A withdrawal "${excess}" above the balance is rejected`, async ({ transactionPage, dialogs, testData }) => {
        await transactionPage.submitTransaction("withdraw", balanceBefore + testData.amountsAboveBalance[excess]);

        await dialogs.expectShown(testData.messages.insufficientFunds);
        await transactionPage.expectError(testData.messages.insufficientFunds);
      });
    }

    for (const invalidAmount of ["zero", "negative"]) {
      test(`A withdrawal of invalid amount "${invalidAmount}" is rejected`, async ({ transactionPage, dialogs, testData }) => {
        await transactionPage.submitTransaction("withdraw", testData.invalidAmounts[invalidAmount]);

        await dialogs.expectShown(testData.messages.invalidAmount);
        await transactionPage.expectError(testData.messages.invalidAmount);
      });
    }
  });

  test("A withdrawal without a selected customer is rejected", async ({ customerPage, transactionPage, dialogs, testData }) => {
    await customerPage.expectLoaded();
    await customerPage.expectLoggedInAs(testData.users.teller);
    await customerPage.goToTransactionPage();

    await transactionPage.submitTransaction("withdraw", testData.withdrawals.standard.amount, testData.withdrawals.standard.reason);

    await dialogs.expectShown(testData.messages.customerNotSelected);
    await transactionPage.expectError(testData.messages.customerNotSelected);
  });
});
