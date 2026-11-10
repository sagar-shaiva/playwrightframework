import { test, expect } from "../src/fixtures/test.fixture";
import * as fs from "fs";
import { data, getAuthFile } from "../config/env.config";
import { generatePdfFromPage, saveBrowserDownload, savePdfResponseBody } from "../src/utils/statementPdf";

const customer = data.customers.valid;

test.use({ storageState: getAuthFile(data.userIds.T) });

test.describe.serial("Customer statement", () => {
  test.beforeEach(async ({ customerPage }) => {
    await customerPage.expectLoaded();
    await customerPage.searchCustomer(customer.id);
    await customerPage.expectCustomerFound(customer.name);
    await customerPage.expectStatementActionsVisible();
  });

  test("views the statement in a new page in the same context", async ({ customerPage, context }) => {
    const { popup, pdfUrl } = await customerPage.openStatement();

    expect(popup.context()).toBe(context);
    const response = await popup.request.get(pdfUrl);
    expect(response.headers()["content-type"]).toContain("application/pdf");
    const filePath = savePdfResponseBody(await response.body(), `statement-${customer.id}-view.pdf`);
    expect(fs.readFileSync(filePath).subarray(0, 5).toString()).toBe("%PDF-");
    await popup.close();
  });

  test("opens Print to PDF in a new page", async ({ customerPage, context }) => {
    const { popup, pdfUrl } = await customerPage.openPrintToPdf();

    expect(popup.context()).toBe(context);
    const response = await popup.request.get(pdfUrl);
    expect(response.headers()["content-type"]).toContain("application/pdf");
    const filePath = savePdfResponseBody(await response.body(), `statement-${customer.id}-preview.pdf`);
    expect(fs.readFileSync(filePath).subarray(0, 5).toString()).toBe("%PDF-");
    await popup.close();
  });

  test("downloads only PDF content to the environment folder", async ({ customerPage }) => {
    const download = await customerPage.downloadStatementPdf();
    const filePath = await saveBrowserDownload(download);

    expect(download.suggestedFilename()).toBe(`statement-${customer.id}.pdf`);
    expect(fs.readFileSync(filePath).subarray(0, 5).toString()).toBe("%PDF-");
  });

  test("saves the printable page as PDF after clicking Print", async ({ customerPage, context }) => {
    await context.addInitScript(() => {
      window.print = () => {};
      window.close = () => {};
    });

    const popup = await customerPage.openPrintPreview();
    await popup.waitForLoadState("networkidle");

    const filePath = await generatePdfFromPage(popup, `statement-${customer.id}-print.pdf`);
    expect(fs.readFileSync(filePath).subarray(0, 5).toString()).toBe("%PDF-");
    await popup.close();
  });

  test("saves the printable page as PDF after clicking Print no close", async ({ customerPage, context }) => {
    await context.addInitScript(() => {
      window.print = () => {};
    });

    const popup = await customerPage.openPrintNoClosePreview();
    await popup.waitForLoadState("networkidle");

    const filePath = await generatePdfFromPage(popup, `statement-${customer.id}-print-no-close.pdf`);
    expect(fs.readFileSync(filePath).subarray(0, 5).toString()).toBe("%PDF-");
    await popup.close();
  });
});
