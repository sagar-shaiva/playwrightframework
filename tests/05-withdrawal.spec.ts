import { test, expect } from "../src/fixtures/test.fixture";
import { data, getAuthFile } from "../config/env.config";
import { getRuntimeData, saveRuntimeData } from "../src/utils/runtimeData";
import { Database } from "../src/utils/database";
import type { CustomerBalanceRow, TransactionRow } from "../src/types/database.types";

const { customers, transactions, expectedMessages } = data;

test.describe("Database customer withdrawal", () => {
  test.use({ storageState: getAuthFile(data.userIds.T) });

  test("stores the withdrawal and transaction details", async ({ customerPage, transactionPage, dialogs, db }, testInfo) => {
    const flow = data.generatedCustomerFlow;
    const customerId = getRuntimeData<string>("customerId");
    const balanceBefore = flow.openingBalance + flow.depositAmount;
    const balanceAfter = balanceBefore - flow.withdrawalAmount;
    let transactionId = "";

    await test.step("UI: withdraw from the created customer", async () => {
      await customerPage.open();
      await customerPage.search(customerId);
      await customerPage.expectDatabaseCustomerFound(flow.name);
      expect(await customerPage.getBalance()).toBe(balanceBefore);

      await customerPage.goToTransaction();
      dialogs.expectNext(expectedMessages.transactionSuccess);
      await transactionPage.submit("withdraw", flow.withdrawalAmount, flow.withdrawalReason);
      await transactionPage.expectSuccess();
      await expect(transactionPage.transactionId).toHaveText(/^\d+$/);
      transactionId = (await transactionPage.transactionId.textContent()) ?? "";
      saveRuntimeData(testInfo, "withdrawalTransactionId", transactionId);
      expect(await transactionPage.getBalance()).toBe(balanceAfter);
    });

    await test.step("DB: withdrawal and ledger row are stored", async () => {
      if (!Database.isAvailable()) return;

      const transactionRows = await db.query<TransactionRow>(
        `SELECT TransactionId, TransactionType, Amount, BalanceBefore, BalanceAfter,
                Reason, TransactionDateTime, CreatedBy
         FROM dbo.Transactions
         WHERE TransactionId = @transactionId AND CustomerId = @customerId`,
        { transactionId: Number(transactionId), customerId },
      );

      expect(transactionRows).toHaveLength(1);
      expect(transactionRows[0]).toMatchObject({
        TransactionId: transactionId,
        TransactionType: transactions.withdraw.databaseType,
        Reason: flow.withdrawalReason,
        CreatedBy: data.userIds.T,
      });
      expect(Number(transactionRows[0].Amount)).toBe(flow.withdrawalAmount);
      expect(Number(transactionRows[0].BalanceBefore)).toBe(balanceBefore);
      expect(Number(transactionRows[0].BalanceAfter)).toBe(balanceAfter);
      expect(transactionRows[0].TransactionDateTime).toBeInstanceOf(Date);

      const customerRows = await db.query<CustomerBalanceRow>(`SELECT Balance FROM dbo.Customers WHERE CustomerId = @customerId`, { customerId });
      expect(customerRows).toHaveLength(1);
      expect(Number(customerRows[0].Balance)).toBe(balanceAfter);
    });
  });
});

test.describe("Customer withdrawal", () => {
  test.use({ storageState: getAuthFile(data.userIds.T) });

  test.describe("with a selected customer", () => {
    test.beforeEach(async ({ customerPage }) => {
      await customerPage.open();
      await customerPage.search(customers.valid.id);
      await customerPage.goToTransaction();
    });

    test("decreases the account balance", async ({ transactionPage, dialogs }) => {
      dialogs.expectNext(expectedMessages.transactionSuccess);
      await transactionPage.submit("withdraw", transactions.withdraw.amount, transactions.withdraw.reason);
      await transactionPage.expectSuccess();
      expect(await transactionPage.getBalance()).toBe(transactions.withdraw.expectedBalance);
    });

    test("allows withdrawing the full balance", async ({ transactionPage, dialogs }) => {
      dialogs.expectNext(expectedMessages.transactionSuccess);
      await transactionPage.submit("withdraw", customers.valid.balance);
      await transactionPage.expectSuccess();
      expect(await transactionPage.getBalance()).toBe(0);
    });

    test("offers only withdrawal reasons", async ({ transactionPage }) => {
      await transactionPage.type.selectOption("withdraw");
      await transactionPage.expectReasons(transactions.withdraw.reasons);
    });

    for (const reason of transactions.withdraw.reasons) {
      test(`accepts the reason "${reason}"`, async ({ transactionPage, dialogs }) => {
        dialogs.expectNext(expectedMessages.transactionSuccess);
        await transactionPage.submit("withdraw", transactions.withdraw.amount, reason);
        await transactionPage.expectSuccess();
        await expect(transactionPage.reason.locator("option:checked")).toHaveText(reason);
      });
    }

    test("rejects a withdrawal above the balance", async ({ transactionPage, dialogs }) => {
      dialogs.expectNext(expectedMessages.insufficientFunds);
      await transactionPage.submit("withdraw", transactions.overdraft.amount);
      await transactionPage.expectError(expectedMessages.insufficientFunds);
    });

    test("rejects a withdrawal one cent above the balance", async ({ transactionPage, dialogs }) => {
      dialogs.expectNext(expectedMessages.insufficientFunds);
      await transactionPage.submit("withdraw", customers.valid.balance + transactions.withdraw.overBalanceIncrement);
      await transactionPage.expectError(expectedMessages.insufficientFunds);
    });

    for (const amount of transactions.invalidAmounts) {
      test(`rejects invalid amount ${amount}`, async ({ transactionPage, dialogs }) => {
        dialogs.expectNext(expectedMessages.invalidAmount);
        await transactionPage.submit("withdraw", amount);
        await transactionPage.expectError(expectedMessages.invalidAmount);
      });
    }
  });

  test("cannot withdraw before selecting a customer", async ({ transactionPage, dialogs }) => {
    await transactionPage.open();
    dialogs.expectNext(expectedMessages.customerRequired);
    await transactionPage.submit("withdraw", transactions.unselectedCustomerAmount);
    await transactionPage.expectError(expectedMessages.customerRequired);
  });
});
