import { Page, Locator, expect } from "@playwright/test";

/** Login form shown in the popup opened by the launch page. */
export class LoginPage {
  readonly loginForm: Locator;
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    this.loginForm = page.getByRole("heading", { name: "Pacific Teller" });
    this.username = page.getByLabel("User ID");
    this.password = page.getByLabel("Password");
    this.loginButton = page.getByRole("button", { name: "Sign in" });
    this.errorMessage = page.getByRole("alert");
  }

  async expectLoaded() {
    await expect(this.loginForm).toBeVisible();
  }

  async login(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginButton.click();
  }

  async expectError(message?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }
}
