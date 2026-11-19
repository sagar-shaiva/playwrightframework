import { Dialog, Page, expect } from "@playwright/test";

/** Accepts every browser dialog so the app never blocks, and records the messages for assertions. */
export class DialogHandler {
  private readonly messages: string[] = [];

  constructor(private readonly page: Page) {
    page.on("dialog", this.accept);
  }

  /** Waits until a dialog with this exact message has been shown. */
  async expectShown(message: string) {
    await expect.poll(() => this.messages, { message: `Expected dialog "${message}"` }).toContain(message);
    this.messages.splice(this.messages.indexOf(message), 1);
  }

  printUnexpectedMessages() {
    if (this.messages.length > 0) {
      console.info("Unexpected application dialog(s):", this.messages.join(" | "));
    }
  }

  dispose() {
    this.page.off("dialog", this.accept);
  }

  private readonly accept = async (dialog: Dialog) => {
    this.messages.push(dialog.message());
    await dialog.accept();
  };
}
