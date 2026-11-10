import { Locator, Page, expect } from "@playwright/test";

export class StatementPage {
  readonly heading: Locator;
  readonly customerId: Locator;
  readonly customerName: Locator;
  readonly balance: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Account statement" });
    this.customerId = page.getByTestId("statement-customer-id");
    this.customerName = page.getByTestId("statement-customer-name");
    this.balance = page.getByTestId("statement-balance");
  }

  async expectStatement(customerId: string, customerName: string) {
    await expect(this.heading).toBeVisible();
    await expect(this.customerId).toHaveText(customerId);
    await expect(this.customerName).toHaveText(customerName);
  }
}
