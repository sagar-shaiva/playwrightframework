import * as fs from "fs";
import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";
import { generatePdfFromPage, saveBrowserDownload, savePdfResponseBody } from "../../src/utils/statementPdf";
import type { Download, Page } from "@playwright/test";

const { Given, When, Then } = createBdd(test);
let statementPopup: Page | undefined;
let statementDownload: Download | undefined;
let statementFilePath = "";

Given("I have the {string} customer selected with statement actions available", async ({ customerPage, testData, scenario }, customerKey: string) => {
  const customer = testData.customers[customerKey];
  await customerPage.searchCustomer(customer.id);
  await customerPage.expectCustomerFound(customer.name);
  await customerPage.expectStatementActionsVisible();
  scenario.customerId = customer.id;
});

When("I open the customer's statement", async ({ customerPage, context, scenario }) => {
  const { popup, pdfUrl } = await customerPage.openStatement();
  expect(popup.context()).toBe(context);
  const response = await popup.request.get(pdfUrl);
  expect(response.headers()["content-type"]).toContain("application/pdf");
  statementFilePath = savePdfResponseBody(await response.body(), `bdd-statement-${scenario.customerId}-view.pdf`);
  statementPopup = popup;
});

Then("I see the statement as a PDF in the same browser context", async ({ context }) => {
  expect(statementPopup?.context()).toBe(context);
  expect(fs.readFileSync(statementFilePath).subarray(0, 5).toString()).toBe("%PDF-");
  await statementPopup?.close();
});

When("I download the customer's statement", async ({ customerPage }) => {
  statementDownload = await customerPage.downloadStatementPdf();
  statementFilePath = await saveBrowserDownload(statementDownload);
});

Then("I see the downloaded file is a PDF named after the customer", async ({ scenario }) => {
  expect(statementDownload?.suggestedFilename()).toBe(`statement-${scenario.customerId}.pdf`);
  expect(fs.readFileSync(statementFilePath).subarray(0, 5).toString()).toBe("%PDF-");
});

When("I open Print to PDF", async ({ customerPage, context, scenario }) => {
  const { popup, pdfUrl } = await customerPage.openPrintToPdf();
  expect(popup.context()).toBe(context);
  const response = await popup.request.get(pdfUrl);
  expect(response.headers()["content-type"]).toContain("application/pdf");
  statementFilePath = savePdfResponseBody(await response.body(), `bdd-statement-${scenario.customerId}-preview.pdf`);
  statementPopup = popup;
});

Then("I see the print-to-PDF response as a PDF in the same browser context", async ({ context }) => {
  expect(statementPopup?.context()).toBe(context);
  expect(fs.readFileSync(statementFilePath).subarray(0, 5).toString()).toBe("%PDF-");
  await statementPopup?.close();
});

When("I open the print preview", async ({ customerPage, context, scenario }) => {
  await context.addInitScript(() => {
    window.print = () => {};
    window.close = () => {};
  });
  statementPopup = await customerPage.openPrintPreview();
  await statementPopup.waitForLoadState("networkidle");
  statementFilePath = await generatePdfFromPage(statementPopup, `bdd-statement-${scenario.customerId}-print.pdf`);
});

When("I open the print preview without automatic closing", async ({ customerPage, context, scenario }) => {
  await context.addInitScript(() => {
    window.print = () => {};
  });
  statementPopup = await customerPage.openPrintNoClosePreview();
  await statementPopup.waitForLoadState("networkidle");
  statementFilePath = await generatePdfFromPage(statementPopup, `bdd-statement-${scenario.customerId}-print-no-close.pdf`);
});

Then("I see the print preview saved as a PDF", async () => {
  expect(fs.readFileSync(statementFilePath).subarray(0, 5).toString()).toBe("%PDF-");
  await statementPopup?.close();
});
