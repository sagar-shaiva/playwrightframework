import { expect } from "@playwright/test";
export class BranchPage {
    page;
    panel;
    state;
    openButton;
    closeButton;
    message;
    constructor(page) {
        this.page = page;
        this.panel = page.locator("#branchPanel");
        this.state = page.locator("#branchState");
        this.openButton = page.locator("#openBranchBtn");
        this.closeButton = page.locator("#closeBranchBtn");
        this.message = page.locator("#branchMessage");
    }
    async ensureOpen() {
        await expect(this.panel).toBeVisible();
        if ((await this.state.textContent())?.trim() === "Open")
            return;
        this.page.once("dialog", (dialog) => dialog.accept());
        await this.openButton.click();
        await expect(this.message).toHaveText("Branch opened");
        await expect(this.state).toHaveText("Open");
    }
    async ensureClosed() {
        await expect(this.panel).toBeVisible();
        if ((await this.state.textContent())?.trim() === "Closed")
            return;
        this.page.once("dialog", (dialog) => dialog.accept());
        await this.closeButton.click();
        await expect(this.message).toHaveText("Branch closed");
        await expect(this.state).toHaveText("Closed");
    }
}
