import * as fs from "fs";
import { createBdd } from "playwright-bdd";
import { test, expect } from "../../src/fixtures/bdd.fixture";
import { data } from "../../config/env.config";
import { generatePdfFromPage, saveBrowserDownload, savePdfResponseBody } from "../../src/utils/statementPdf";
import type { Page } from "@playwright/test";

const { Given, When, Then } = createBdd(test, { tags: "@bdd09" });
let statementPopup: Page | undefined;
let statementFilePath = "";

Given("statement actions are available for the configured customer", async ({ customerPage }) => {
  await customerPage.expectLoaded();
  await customerPage.searchCustomer(data.customers.valid.id);
  await customerPage.expectCustomerFound(data.customers.valid.name);
  await customerPage.expectStatementActionsVisible();
});

When("the Teller opens the customer statement", async ({ customerPage, context }) => {
  const { popup, pdfUrl } = await customerPage.openStatement();
  expect(popup.context()).toBe(context);
  const response = await popup.request.get(pdfUrl);
  expect(response.headers()["content-type"]).toContain("application/pdf");
  statementFilePath = savePdfResponseBody(await response.body(), `bdd-statement-${data.customers.valid.id}.pdf`);
  statementPopup = popup;
});

Then("the statement is a PDF in the same browser context", async ({ context }) => {
  if (!statementPopup) throw new Error("Statement popup was not opened");
  expect(statementPopup.context()).toBe(context);
  expect(fs.readFileSync(statementFilePath).subarray(0, 5).toString()).toBe("%PDF-");
  await statementPopup.close();
});

When("the Teller downloads the customer statement", async ({ customerPage }) => {
  const download = await customerPage.downloadStatementPdf();
  statementFilePath = await saveBrowserDownload(download);
});

Then("the downloaded file is a PDF", async () => {
  expect(fs.readFileSync(statementFilePath).subarray(0, 5).toString()).toBe("%PDF-");
});

When("the Teller opens Print to PDF", async ({ customerPage, context }) => {
  const { popup, pdfUrl } = await customerPage.openPrintToPdf();
  expect(popup.context()).toBe(context);
  const response = await popup.request.get(pdfUrl);
  expect(response.headers()["content-type"]).toContain("application/pdf");
  statementFilePath = savePdfResponseBody(await response.body(), `bdd-print-${data.customers.valid.id}.pdf`);
  statementPopup = popup;
});

Then("the print-to-PDF response is a PDF in the same context", async ({ context }) => {
  if (!statementPopup) throw new Error("Print-to-PDF popup was not opened");
  expect(statementPopup.context()).toBe(context);
  expect(fs.readFileSync(statementFilePath).subarray(0, 5).toString()).toBe("%PDF-");
  await statementPopup.close();
});

When("the Teller opens the print preview", async ({ customerPage, context }) => {
  await context.addInitScript(() => {
    window.print = () => {};
    window.close = () => {};
  });
  statementPopup = await customerPage.openPrintPreview();
  await statementPopup.waitForLoadState("networkidle");
  statementFilePath = await generatePdfFromPage(statementPopup, `bdd-print-preview-${data.customers.valid.id}.pdf`);
});

When("the Teller opens the print preview without auto-close", async ({ customerPage, context }) => {
  await context.addInitScript(() => {
    window.print = () => {};
  });
  statementPopup = await customerPage.openPrintNoClosePreview();
  await statementPopup.waitForLoadState("networkidle");
  statementFilePath = await generatePdfFromPage(statementPopup, `bdd-print-no-close-${data.customers.valid.id}.pdf`);
});

Then("the print preview is saved as a PDF", async () => {
  expect(fs.readFileSync(statementFilePath).subarray(0, 5).toString()).toBe("%PDF-");
  await statementPopup?.close();
});
