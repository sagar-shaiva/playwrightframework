import { test, expect } from "../src/fixtures/test.fixtures";
import * as fs from "fs";
import { generatePdfFromPage, saveBrowserDownload, savePdfResponseBody } from "../src/utils/statementPdf";

test.use({ authRole: "teller" });

test.describe.serial("Customer statements", () => {
  test.beforeEach(async ({ customerPage, testData }) => {
    await customerPage.expectLoaded();
    await customerPage.expectLoggedInAs(testData.users.teller);
    await customerPage.searchCustomer(testData.customers.retail.id);
    await customerPage.expectCustomerFound(testData.customers.retail.name);
    await customerPage.expectStatementActionsVisible();
  });

  test('The statement of customer "retail" opens as a PDF in the same browser context', async ({ customerPage, context, testData }) => {
    const { popup, pdfUrl } = await customerPage.openStatement();
    expect(popup.context()).toBe(context);
    const response = await popup.request.get(pdfUrl);
    expect(response.headers()["content-type"]).toContain("application/pdf");
    const filePath = savePdfResponseBody(await response.body(), `statement-${testData.customers.retail.id}-view.pdf`);

    expect(popup.context()).toBe(context);
    expect(fs.readFileSync(filePath).subarray(0, 5).toString()).toBe("%PDF-");
    await popup.close();
  });

  test('The statement of customer "retail" can be downloaded', async ({ customerPage, testData }) => {
    const download = await customerPage.downloadStatementPdf();
    const filePath = await saveBrowserDownload(download);

    expect(download.suggestedFilename()).toBe(`statement-${testData.customers.retail.id}.pdf`);
    expect(fs.readFileSync(filePath).subarray(0, 5).toString()).toBe("%PDF-");
  });

  test('Print to PDF for customer "retail" opens a PDF in a new page', async ({ customerPage, context, testData }) => {
    const { popup, pdfUrl } = await customerPage.openPrintToPdf();
    expect(popup.context()).toBe(context);
    const response = await popup.request.get(pdfUrl);
    expect(response.headers()["content-type"]).toContain("application/pdf");
    const filePath = savePdfResponseBody(await response.body(), `statement-${testData.customers.retail.id}-preview.pdf`);

    expect(popup.context()).toBe(context);
    expect(fs.readFileSync(filePath).subarray(0, 5).toString()).toBe("%PDF-");
    await popup.close();
  });

  test('The print preview for customer "retail" can be saved as a PDF', async ({ customerPage, context, testData }) => {
    await context.addInitScript(() => {
      window.print = () => {};
      window.close = () => {};
    });
    const popup = await customerPage.openPrintPreview();
    await popup.waitForLoadState("networkidle");
    const filePath = await generatePdfFromPage(popup, `statement-${testData.customers.retail.id}-print.pdf`);

    expect(fs.readFileSync(filePath).subarray(0, 5).toString()).toBe("%PDF-");
    await popup.close();
  });

  test('The print preview for customer "retail" can be saved without closing the page', async ({ customerPage, context, testData }) => {
    await context.addInitScript(() => {
      window.print = () => {};
    });
    const popup = await customerPage.openPrintNoClosePreview();
    await popup.waitForLoadState("networkidle");
    const filePath = await generatePdfFromPage(popup, `statement-${testData.customers.retail.id}-print-no-close.pdf`);

    expect(fs.readFileSync(filePath).subarray(0, 5).toString()).toBe("%PDF-");
    await popup.close();
  });
});
