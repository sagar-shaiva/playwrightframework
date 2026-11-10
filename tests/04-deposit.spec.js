import { test, expect } from "../src/fixtures/test.fixture";
import { data, getAuthFile } from "../config/env.config";
import { getRuntimeData, saveRuntimeData } from "../src/utils/runtimeData";
import { Database } from "../src/utils/database";
const { customers, transactions, expectedMessages } = data;
test.describe("Database customer deposit", () => {
    test.use({ storageState: getAuthFile(data.userIds.T) });
    test("stores the deposit and transaction details", async ({ customerPage, transactionPage, dialogs, db }, testInfo) => {
        const flow = data.generatedCustomerFlow;
        const customerId = getRuntimeData("customerId");
        let transactionId = "";
        await test.step("UI: deposit into the created customer", async () => {
            await customerPage.expectLoaded();
            await customerPage.searchCustomer(customerId);
            await customerPage.expectCustomerFound(flow.name);
            expect(await customerPage.getBalance()).toBe(flow.openingBalance);
            await customerPage.goToTransactionPage();
            dialogs.expectNext(expectedMessages.transactionSuccess);
            await transactionPage.submitTransaction("deposit", flow.depositAmount, flow.depositReason);
            await transactionPage.expectSuccess();
            await expect(transactionPage.transactionId).toHaveText(/^\d+$/);
            transactionId = (await transactionPage.transactionId.textContent()) ?? "";
            saveRuntimeData(testInfo, "depositTransactionId", transactionId);
            expect(await transactionPage.getBalance()).toBe(flow.openingBalance + flow.depositAmount);
        });
        await test.step("DB: deposit and ledger row are stored", async () => {
            if (!Database.isAvailable())
                return;
            const transactionRows = await db.query(`SELECT TransactionId, TransactionType, Amount, BalanceBefore, BalanceAfter,
                Reason, TransactionDateTime, CreatedBy
         FROM dbo.Transactions
         WHERE TransactionId = @transactionId AND CustomerId = @customerId`, { transactionId: Number(transactionId), customerId });
            expect(transactionRows).toHaveLength(1);
            expect(transactionRows[0]).toMatchObject({
                TransactionId: transactionId,
                TransactionType: transactions.deposit.databaseType,
                Reason: flow.depositReason,
                CreatedBy: data.userIds.T,
            });
            expect(Number(transactionRows[0].Amount)).toBe(flow.depositAmount);
            expect(Number(transactionRows[0].BalanceBefore)).toBe(flow.openingBalance);
            expect(Number(transactionRows[0].BalanceAfter)).toBe(flow.openingBalance + flow.depositAmount);
            expect(transactionRows[0].TransactionDateTime).toBeInstanceOf(Date);
            const customerRows = await db.query(`SELECT Balance FROM dbo.Customers WHERE CustomerId = @customerId`, { customerId });
            expect(customerRows).toHaveLength(1);
            expect(Number(customerRows[0].Balance)).toBe(flow.openingBalance + flow.depositAmount);
        });
    });
});
test.describe("Customer deposit", () => {
    test.use({ storageState: getAuthFile(data.userIds.T) });
    test.describe("with a selected customer", () => {
        test.beforeEach(async ({ customerPage }) => {
            await customerPage.expectLoaded();
            await customerPage.searchCustomer(customers.valid.id);
            await customerPage.goToTransactionPage();
        });
        test("increases the account balance", async ({ transactionPage, dialogs }) => {
            dialogs.expectNext(expectedMessages.transactionSuccess);
            await transactionPage.submitTransaction("deposit", transactions.deposit.amount, transactions.deposit.reason);
            await transactionPage.expectSuccess();
            expect(await transactionPage.getBalance()).toBe(transactions.deposit.expectedBalance);
        });
        test("accepts a decimal amount", async ({ transactionPage, dialogs }) => {
            dialogs.expectNext(expectedMessages.transactionSuccess);
            await transactionPage.submitTransaction("deposit", transactions.deposit.decimalAmount);
            await transactionPage.expectSuccess();
            expect(await transactionPage.getBalance()).toBeCloseTo(customers.valid.balance + transactions.deposit.decimalAmount, 2);
        });
        test("offers only deposit reasons", async ({ transactionPage }) => {
            await transactionPage.type.selectOption("deposit");
            await transactionPage.expectReasons(transactions.deposit.reasons);
        });
        for (const reason of transactions.deposit.reasons) {
            test(`accepts the reason "${reason}"`, async ({ transactionPage, dialogs }) => {
                dialogs.expectNext(expectedMessages.transactionSuccess);
                await transactionPage.submitTransaction("deposit", transactions.deposit.amount, reason);
                await transactionPage.expectSuccess();
                await expect(transactionPage.reason.locator("option:checked")).toHaveText(reason);
            });
        }
        for (const amount of transactions.invalidAmounts) {
            test(`rejects invalid amount ${amount}`, async ({ transactionPage, dialogs }) => {
                dialogs.expectNext(expectedMessages.invalidAmount);
                await transactionPage.submitTransaction("deposit", amount);
                await transactionPage.expectError(expectedMessages.invalidAmount);
            });
        }
    });
    test("cannot deposit before selecting a customer", async ({ customerPage, transactionPage, dialogs }) => {
        await customerPage.goToTransactionPage();
        dialogs.expectNext(expectedMessages.customerRequired);
        await transactionPage.submitTransaction("deposit", transactions.unselectedCustomerAmount);
        await transactionPage.expectError(expectedMessages.customerRequired);
    });
});
test.describe("Customer deposit by a non-Teller user", () => {
    test.use({ storageState: getAuthFile(data.userIds.BM) });
    test("is blocked", async ({ customerPage, transactionPage, dialogs }) => {
        dialogs.expectNext(expectedMessages.tellerRequired);
        await customerPage.goToTransactionPage();
        await expect(transactionPage.submitButton).toBeDisabled();
        await transactionPage.expectError(expectedMessages.tellerRequired);
    });
});
