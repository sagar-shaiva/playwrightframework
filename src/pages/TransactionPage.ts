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
    this.type = page.getByLabel("Transaction type");
    this.reason = page.getByLabel("Reason");
    this.amount = page.getByLabel("Amount");
    this.submitButton = page.getByRole("button", { name: "Submit transaction" });
    this.status = page.getByRole("status", { name: "Transaction status" });
    this.transactionId = page.getByTestId("transaction-id");
    this.accountBalance = page.getByTestId("account-balance");
    this.welcomeUser = page.getByText(/^Welcome/);
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
    await expect(this.reason.getByRole("option")).toHaveText(labels);
  }

  async expectSelectedReason(label: string) {
    await expect(this.reason.getByRole("option", { selected: true })).toHaveText(label);
  }

  async getBalance() {
    const text = (await this.accountBalance.textContent()) ?? "0";
    return parseFloat(text);
  }
}
