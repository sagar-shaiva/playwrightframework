import { test, expect } from "../src/fixtures/test.fixtures";
import { getRuntimeData } from "../src/utils/runtimeData";
import { Database } from "../src/utils/database";
import type { CustomerBalanceRow, TransactionRow } from "../src/types/database.types";

test.describe("Customer deposits", () => {
  test.use({ authRole: "teller" });

  test('The Teller deposits into the new customer "retail"', async ({ customerPage, transactionPage, dialogs, db, testData }) => {
    const deposit = testData.deposits.salary;
    const customerId = getRuntimeData<string>("customerId");
    let balanceBefore = 0;
    let transactionId = "";

    await test.step("UI: deposit into the new customer", async () => {
      await customerPage.expectLoaded();
      await customerPage.expectLoggedInAs(testData.users.teller);
      await customerPage.searchCustomer(customerId);
      await customerPage.expectCustomerFound(testData.newCustomers.retail.name);
      balanceBefore = await customerPage.getBalance();
      await customerPage.goToTransactionPage();

      await transactionPage.submitTransaction("deposit", deposit.amount, deposit.reason);
      await dialogs.expectShown(testData.messages.transactionSuccess);
      await transactionPage.expectSuccess();
      expect(await transactionPage.getBalance()).toBeCloseTo(balanceBefore + deposit.amount, 2);
      transactionId = (await transactionPage.transactionId.textContent()) ?? "";
    });

    await test.step("DB: the deposit and the customer balance are stored", async () => {
      if (!Database.isAvailable()) return;

      const balanceAfter = balanceBefore + deposit.amount;
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
      expect(Number(transactionRows[0].BalanceBefore)).toBe(balanceBefore);
      expect(Number(transactionRows[0].BalanceAfter)).toBe(balanceAfter);
      expect(transactionRows[0].TransactionDateTime).toBeInstanceOf(Date);

      const customerRows = await db.query<CustomerBalanceRow>("SELECT Balance FROM dbo.Customers WHERE CustomerId = @customerId", { customerId });
      expect(customerRows).toHaveLength(1);
      expect(Number(customerRows[0].Balance)).toBe(balanceAfter);
    });
  });

  for (const { customer, deposit } of [
    { customer: "retail", deposit: "standard" },
    { customer: "retail", deposit: "decimal" },
    { customer: "corporate", deposit: "standard" },
  ]) {
    test(`The Teller deposits "${deposit}" into customer "${customer}"`, async ({ customerPage, transactionPage, dialogs, testData }) => {
      await customerPage.expectLoaded();
      await customerPage.expectLoggedInAs(testData.users.teller);
      await customerPage.searchCustomer(testData.customers[customer].id);
      await customerPage.expectCustomerFound(testData.customers[customer].name);
      const balanceBefore = await customerPage.getBalance();
      await customerPage.goToTransactionPage();

      await transactionPage.submitTransaction("deposit", testData.deposits[deposit].amount, testData.deposits[deposit].reason);

      await dialogs.expectShown(testData.messages.transactionSuccess);
      await transactionPage.expectSuccess();
      expect(await transactionPage.getBalance()).toBeCloseTo(balanceBefore + testData.deposits[deposit].amount, 2);
    });
  }

  test.describe('with customer "retail" open on the transaction page', () => {
    test.beforeEach(async ({ customerPage, testData }) => {
      await customerPage.expectLoaded();
      await customerPage.expectLoggedInAs(testData.users.teller);
      await customerPage.searchCustomer(testData.customers.retail.id);
      await customerPage.expectCustomerFound(testData.customers.retail.name);
      await customerPage.goToTransactionPage();
    });

    for (const reason of ["cash", "cheque", "salary", "transfer", "refund"]) {
      test(`The Teller deposits using reason "${reason}"`, async ({ transactionPage, dialogs, testData }) => {
        await transactionPage.submitTransaction("deposit", testData.deposits.standard.amount, testData.depositReasons[reason]);

        await dialogs.expectShown(testData.messages.transactionSuccess);
        await transactionPage.expectSuccess();
        await transactionPage.expectSelectedReason(testData.depositReasons[reason]);
      });
    }

    test("Only deposit reasons are offered for a deposit", async ({ transactionPage, testData }) => {
      await transactionPage.type.selectOption("deposit");

      await transactionPage.expectReasons(Object.values(testData.depositReasons));
    });

    for (const invalidAmount of ["zero", "negative"]) {
      test(`A deposit of invalid amount "${invalidAmount}" is rejected`, async ({ transactionPage, dialogs, testData }) => {
        await transactionPage.submitTransaction("deposit", testData.invalidAmounts[invalidAmount]);

        await dialogs.expectShown(testData.messages.invalidAmount);
        await transactionPage.expectError(testData.messages.invalidAmount);
      });
    }
  });

  test("A deposit without a selected customer is rejected", async ({ customerPage, transactionPage, dialogs, testData }) => {
    await customerPage.expectLoaded();
    await customerPage.expectLoggedInAs(testData.users.teller);
    await customerPage.goToTransactionPage();

    await transactionPage.submitTransaction("deposit", testData.deposits.standard.amount, testData.deposits.standard.reason);

    await dialogs.expectShown(testData.messages.customerNotSelected);
    await transactionPage.expectError(testData.messages.customerNotSelected);
  });
});

test.describe("Customer deposits by a Branch Manager", () => {
  test.use({ authRole: "branchManager" });

  test("A Branch Manager cannot post a deposit", async ({ customerPage, transactionPage, dialogs, testData }) => {
    await customerPage.expectLoaded();
    await customerPage.expectLoggedInAs(testData.users.branchManager);

    await customerPage.goToTransactionPage();

    await dialogs.expectShown(testData.messages.tellerOnly);
    await transactionPage.expectError(testData.messages.tellerOnly);
    await expect(transactionPage.submitButton).toBeDisabled();
  });
});
