import { Page, Locator, expect } from "@playwright/test";

export type TransactionType = "deposit" | "withdraw";

/** Transaction panel of the teller dashboard. */
export class TransactionPage {
  readonly type: Locator;
  readonly reason: Locator;
  readonly amount: Locator;
  readonly submitButton: Locator;
  readonly status: Locator;
  readonly transactionId: Locator;
  readonly accountBalance: Locator;
  readonly welcomeUser: Locator;

  constructor(private readonly page: Page) {
    this.type = page.locator("#txnType");
    this.reason = page.locator("#txnReason");
    this.amount = page.locator("#txnAmount");
    this.submitButton = page.locator("#submitTxnBtn");
    this.status = page.locator("#txnStatus");
    this.transactionId = page.locator("#txnId");
    this.accountBalance = page.locator("#accountBalance");
    this.welcomeUser = page.locator("#welcomeUser");
  }

  async submitTransaction(type: TransactionType, amount: number, reason?: string) {
    await this.type.selectOption(type);
    if (reason) await this.reason.selectOption({ label: reason });
    await this.amount.fill(String(amount));
    await this.submitButton.click();
  }

  async expectSuccess() {
    await expect(this.status).toHaveClass(/success/);
  }

  async expectError(message?: string) {
    await expect(this.status).toHaveClass(/error/);
    if (message) {
      await expect(this.status).toContainText(message);
    }
  }

  async expectReasons(labels: string[]) {
    await expect(this.reason.locator("option")).toHaveText(labels);
  }

  async getBalance() {
    const text = (await this.accountBalance.textContent()) ?? "0";
    return parseFloat(text);
  }
}
