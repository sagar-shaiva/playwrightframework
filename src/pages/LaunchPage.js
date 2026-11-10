import { expect } from "@playwright/test";
import { getAppUrl } from "../../config/env.config";
/** Main browser window: shows bank info and opens the application in a popup. */
export class LaunchPage {
    page;
    bankName;
    constructor(page) {
        this.page = page;
        this.bankName = page.locator("#bankName");
    }
    /** Opens the env/country URL and returns the popup page where login and the application run. */
    async openLoginPopup() {
        const popupPromise = this.page.waitForEvent("popup");
        await this.page.goto(getAppUrl());
        await expect(this.bankName).toBeVisible();
        return popupPromise;
    }
}
