import { Page, Locator, expect } from "@playwright/test";
import { COUNTRY, ENV } from "../../config/env.config";

/** Customer lookup panel of the teller dashboard. */
export class CustomerPage {
  readonly welcomeUser: Locator;
  readonly envLabel: Locator;
  readonly countryLabel: Locator;
  readonly logoutButton: Locator;
  readonly transactionLink: Locator;
  readonly customerId: Locator;
  readonly searchButton: Locator;
  readonly customerNameInput: Locator;
  readonly customerTypeInput: Locator;
  readonly openingBalanceInput: Locator;
  readonly createCustomerButton: Locator;
  readonly customerStatus: Locator;
  readonly customerName: Locator;
  readonly errorMessage: Locator;
  readonly accountSummary: Locator;
  readonly accountBalance: Locator;
  readonly statementActions: Locator;
  readonly viewStatementButton: Locator;
  readonly printToPdfButton: Locator;
  readonly downloadPdfButton: Locator;
  readonly printStatementButton: Locator;
  readonly printNoCloseButton: Locator;

  constructor(private readonly page: Page) {
    this.welcomeUser = page.locator("#welcomeUser");
    this.envLabel = page.locator("#envLabel");
    this.countryLabel = page.locator("#countryLabel");
    this.logoutButton = page.locator("#logoutBtn");
    this.transactionLink = page.locator("#navTransaction");
    this.customerId = page.locator("#customerId");
    this.searchButton = page.locator("#searchCustomerBtn");
    this.customerNameInput = page.locator("#customerNameInput");
    this.customerTypeInput = page.locator("#customerTypeInput");
    this.openingBalanceInput = page.locator("#customerBalanceInput");
    this.createCustomerButton = page.locator("#createCustomerBtn");
    this.customerStatus = page.locator("#customerStatus");
    this.customerName = page.locator("#customerName");
    this.errorMessage = page.locator("#customerError");
    this.accountSummary = page.locator("#accountSummary");
    this.accountBalance = page.locator("#accountBalance");
    this.statementActions = page.locator("#statementActions");
    this.viewStatementButton = page.locator("#viewStatementBtn");
    this.printToPdfButton = page.locator("#printToPdfBtn");
    this.downloadPdfButton = page.locator("#downloadPdfBtn");
    this.printStatementButton = page.locator("#printStatementBtn");
    this.printNoCloseButton = page.locator("#printNoCloseBtn");
  }

  /** After sign-in the popup lands on the customer page; wait until it is ready. */
  async expectLoaded() {
    await expect(this.customerId).toBeVisible();
    await expect(this.transactionLink).not.toHaveAttribute("href", "#");
  }

  async expectLoggedInAs(userId: string) {
    await expect(this.welcomeUser).toContainText(userId);
    await expect(this.envLabel).toHaveText(ENV.toUpperCase());
    await expect(this.countryLabel).toHaveText(COUNTRY);
  }

  async logout() {
    await this.logoutButton.click();
    await expect(this.page.locator("#loginModal")).toBeVisible();
  }

  async goToTransactionPage() {
    await expect(this.transactionLink).not.toHaveAttribute("href", "#");
    await this.transactionLink.click();
    await expect(this.page.locator("#txnType")).toBeVisible();
  }

  async searchCustomer(id: string) {
    await this.customerId.fill(id);
    await this.searchButton.click();
  }

  async createCustomer(name: string, type: "Retail" | "Business", openingBalance: number) {
    await this.customerNameInput.fill(name);
    await this.customerTypeInput.selectOption(type);
    await this.openingBalanceInput.fill(String(openingBalance));
    await this.createCustomerButton.click();
    await expect(this.customerStatus).toHaveClass(/success/);

    const customerId = await this.customerId.inputValue();
    expect(customerId).toMatch(new RegExp(`^${COUNTRY}\\d{6}$`));
    return customerId;
  }

  async expectCustomerFound(name: string) {
    await expect(this.customerName).toContainText(name);
    await expect(this.accountSummary).toBeVisible();
  }

  async expectStatementActionsVisible() {
    await expect(this.statementActions).toBeVisible();
  }

  async expectCustomerNotFound() {
    await expect(this.errorMessage).toBeVisible();
  }

  async getBalance() {
    const text = (await this.accountBalance.textContent()) ?? "0";
    return parseFloat(text);
  }

  async openStatement() {
    const [popup, response] = await Promise.all([
      this.page.waitForEvent("popup"),
      this.page.context().waitForEvent("response", (response) => response.ok() && response.headers()["content-type"]?.includes("application/pdf") === true),
      this.viewStatementButton.click(),
    ]);
    return { popup, pdfUrl: response.url() };
  }

  async openPrintToPdf() {
    const [popup, response] = await Promise.all([
      this.page.waitForEvent("popup"),
      this.page.context().waitForEvent("response", (response) => response.ok() && response.headers()["content-type"]?.includes("application/pdf") === true),
      this.printToPdfButton.click(),
    ]);
    return { popup, pdfUrl: response.url() };
  }

  async downloadStatementPdf() {
    const downloadPromise = this.page.waitForEvent("download");
    await this.downloadPdfButton.click();
    return downloadPromise;
  }

  async openPrintPreview() {
    const popupPromise = this.page.waitForEvent("popup");
    await this.printStatementButton.click();
    return popupPromise;
  }

  async openPrintNoClosePreview() {
    const popupPromise = this.page.waitForEvent("popup");
    await this.printNoCloseButton.click();
    return popupPromise;
  }
}
