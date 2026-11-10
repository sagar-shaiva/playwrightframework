import { expect } from "@playwright/test";
/** Transaction panel of the teller dashboard. */
export class TransactionPage {
    page;
    type;
    reason;
    amount;
    submitButton;
    status;
    transactionId;
    accountBalance;
    welcomeUser;
    constructor(page) {
        this.page = page;
        this.type = page.locator("#txnType");
        this.reason = page.locator("#txnReason");
        this.amount = page.locator("#txnAmount");
        this.submitButton = page.locator("#submitTxnBtn");
        this.status = page.locator("#txnStatus");
        this.transactionId = page.locator("#txnId");
        this.accountBalance = page.locator("#accountBalance");
        this.welcomeUser = page.locator("#welcomeUser");
    }
    async submitTransaction(type, amount, reason) {
        await this.type.selectOption(type);
        if (reason)
            await this.reason.selectOption({ label: reason });
        await this.amount.fill(String(amount));
        await this.submitButton.click();
    }
    async expectSuccess() {
        await expect(this.status).toHaveClass(/success/);
    }
    async expectError(message) {
        await expect(this.status).toHaveClass(/error/);
        if (message) {
            await expect(this.status).toContainText(message);
        }
    }
    async expectReasons(labels) {
        await expect(this.reason.locator("option")).toHaveText(labels);
    }
    async getBalance() {
        const text = (await this.accountBalance.textContent()) ?? "0";
        return parseFloat(text);
    }
}
