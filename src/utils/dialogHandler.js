export class DialogHandler {
    page;
    expectedMessage;
    expectedDialogErrors = [];
    unexpectedMessages = [];
    constructor(page) {
        this.page = page;
        page.on("dialog", this.acceptUnexpectedDialog);
    }
    expectNext(message) {
        if (this.expectedMessage) {
            throw new Error(`Still waiting for expected dialog: ${this.expectedMessage}`);
        }
        this.expectedMessage = message;
    }
    printUnexpectedMessages() {
        if (this.unexpectedMessages.length > 0) {
            console.info("Unexpected application dialog(s):", this.unexpectedMessages.join(" | "));
        }
    }
    verifyExpectedDialogs() {
        if (this.expectedMessage) {
            this.expectedDialogErrors.push(`Expected dialog did not appear: "${this.expectedMessage}"`);
        }
        if (this.expectedDialogErrors.length > 0) {
            throw new Error(this.expectedDialogErrors.join("\n"));
        }
    }
    dispose() {
        this.page.off("dialog", this.acceptUnexpectedDialog);
    }
    acceptUnexpectedDialog = async (dialog) => {
        const actualMessage = dialog.message();
        await dialog.accept();
        if (this.expectedMessage) {
            if (actualMessage !== this.expectedMessage) {
                this.expectedDialogErrors.push(`Expected dialog "${this.expectedMessage}", received "${actualMessage}"`);
            }
            this.expectedMessage = undefined;
            return;
        }
        this.unexpectedMessages.push(actualMessage);
    };
}
