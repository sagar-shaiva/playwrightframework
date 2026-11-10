import { expect } from "@playwright/test";
export class StatementPage {
    page;
    heading;
    customerId;
    customerName;
    balance;
    constructor(page) {
        this.page = page;
        this.heading = page.getByRole("heading", { name: "Account statement" });
        this.customerId = page.locator("#statementCustomerId");
        this.customerName = page.locator("#statementCustomerName");
        this.balance = page.locator("#statementBalance");
    }
    async expectStatement(customerId, customerName) {
        await expect(this.heading).toBeVisible();
        await expect(this.customerId).toHaveText(customerId);
        await expect(this.customerName).toHaveText(customerName);
    }
}
