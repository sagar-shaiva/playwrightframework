import { Page, Locator, expect } from "@playwright/test";
import { getAppUrl } from "../../config/env.config";

/** Login popup shown as soon as the application is opened. */
export class LoginPage {
  readonly modal: Locator;
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    this.modal = page.locator("#loginModal");
    this.username = page.locator("#username");
    this.password = page.locator("#password");
    this.loginButton = page.locator("#loginBtn");
    this.errorMessage = page.locator("#loginError");
  }

  /** Opens the app for the active env/country and waits for the login popup. */
  async open() {
    await this.page.goto(getAppUrl());
    await expect(this.modal).toBeVisible();
  }

  async login(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginButton.click();
  }

  async expectAuthenticatedAs(userId: string) {
    await this.page.goto(getAppUrl());
    await expect(this.page.locator("#welcomeUser")).toContainText(userId);
  }

  async expectError(message?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }
}
