import { expect } from "@playwright/test";
/** Login form shown in the popup opened by the launch page. */
export class LoginPage {
    page;
    loginForm;
    username;
    password;
    loginButton;
    errorMessage;
    constructor(page) {
        this.page = page;
        this.loginForm = page.locator("#loginModal");
        this.username = page.locator("#username");
        this.password = page.locator("#password");
        this.loginButton = page.locator("#loginBtn");
        this.errorMessage = page.locator("#loginError");
    }
    async expectLoaded() {
        await expect(this.loginForm).toBeVisible();
    }
    async login(username, password) {
        await this.username.fill(username);
        await this.password.fill(password);
        await this.loginButton.click();
    }
    async expectError(message) {
        await expect(this.errorMessage).toBeVisible();
        if (message) {
            await expect(this.errorMessage).toContainText(message);
        }
    }
}
