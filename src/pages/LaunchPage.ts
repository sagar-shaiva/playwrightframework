import { Page, Locator, expect } from "@playwright/test";
import { getAppUrl } from "../../config/env.config";

/** Main browser window: shows bank info and opens the application in a popup. */
export class LaunchPage {
  readonly bankName: Locator;

  constructor(private readonly page: Page) {
    this.bankName = page.getByRole("heading", { name: "Pacific Bank" });
  }

  /** Opens the env/country URL and returns the popup page where login and the application run. */
  async openLoginPopup(): Promise<Page> {
    const popupPromise = this.page.waitForEvent("popup");
    await this.page.goto(getAppUrl());
    await expect(this.bankName).toBeVisible();

    // The page opens the popup itself; the button is the fallback when a slow host delays it.
    const popup = await Promise.race([popupPromise, this.page.waitForTimeout(5_000)]);
    if (popup) return popup;
    await this.page.getByRole("button", { name: "Open sign-in window" }).click();
    return popupPromise;
  }
}
