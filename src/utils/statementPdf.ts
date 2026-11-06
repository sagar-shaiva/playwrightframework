import { Download, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { COUNTRY, ENV } from "../../config/env.config";
import { getDateFolder } from "./dateHelper";

function preparePdfFilePath(fileName: string): string {
  const directory = path.resolve(process.cwd(), "reports", ENV, COUNTRY, getDateFolder(), "downloads");
  fs.mkdirSync(directory, { recursive: true });
  return path.join(directory, fileName);
}

export async function saveBrowserDownload(download: Download): Promise<string> {
  const filePath = preparePdfFilePath(download.suggestedFilename());
  await download.saveAs(filePath);
  return filePath;
}

export async function generatePdfFromPage(page: Page, fileName: string): Promise<string> {
  const filePath = preparePdfFilePath(fileName);
  await page.pdf({ path: filePath, format: "A4", printBackground: true });
  return filePath;
}

export function savePdfResponseBody(pdfBody: Buffer, fileName: string): string {
  const filePath = preparePdfFilePath(fileName);
  fs.writeFileSync(filePath, pdfBody);
  return filePath;
}
