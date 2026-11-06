import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { testDataSchema } from "../src/schemas/test-data.schema";

type EnvName = "qa" | "uat" | "training";
type CountryCode = "FJ" | "VN" | "VU" | "KI" | "TO" | "TL" | "SB" | "PNG" | "WS" | "CK";

export const COUNTRIES: readonly CountryCode[] = ["FJ", "VN", "VU", "KI", "TO", "TL", "SB", "PNG", "WS", "CK"];

export interface DbConfig {
  server: string;
  database: string;
  user: string;
  password: string;
  port: number;
  options: { encrypt: boolean; trustServerCertificate: boolean };
}

/** Active environment, selected via TEST_ENV (default: qa). */
export const ENV = (process.env.TEST_ENV ?? "qa").toLowerCase() as EnvName;

// Load the per-environment dotenv file from env/.env.<ENV>, then an optional base .env.
// dotenv never overrides already-set vars.
const envFilePath = path.resolve(__dirname, "..", "env", `.env.${ENV}`);
if (fs.existsSync(envFilePath)) {
  dotenv.config({ path: envFilePath });
}
dotenv.config();

/** Active country selected via COUNTRY (default: FJ). */
export const COUNTRY = (process.env.COUNTRY ?? "FJ").toUpperCase() as CountryCode;

if (!COUNTRIES.includes(COUNTRY)) {
  throw new Error(`Unknown COUNTRY "${COUNTRY}". Valid: ${COUNTRIES.join(", ")}`);
}

/** One data file is selected for the active environment and country. */
export const DATA_FILE = path.resolve(__dirname, "..", "src", "data", ENV, `${COUNTRY}.json`);

if (!fs.existsSync(DATA_FILE)) {
  throw new Error(`Data file not found: ${DATA_FILE}`);
}

/** Specs import this object directly: data.userIds.T, data.customers, etc. */
const testDataResult = testDataSchema.safeParse(JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")));

if (!testDataResult.success) {
  const issues = testDataResult.error.issues.map((issue) => `  ${issue.path.join(".")}: ${issue.message}`).join("\n");
  throw new Error(`Invalid test data file: ${DATA_FILE}\n${issues}`);
}

export const data = testDataResult.data;

/** Complete application entry URL for the active country. */
export function getAppUrl() {
  const url = process.env[`BASE_URL_${COUNTRY}`];
  if (!url) {
    throw new Error(`BASE_URL_${COUNTRY} is not configured in env/.env.${ENV}`);
  }
  return url;
}

/** Saved authentication file for an actual user ID from data.userIds. */
export function getAuthFile(userId: string): string {
  return path.resolve(__dirname, "..", "auth", ENV, `${userId}.json`);
}

/** SQL Server (SSMS) connection details. Values come from env/.env.<env>; DB name defaults per env/country. */
export function getDbConfig(): DbConfig {
  return {
    server: process.env.DB_SERVER ?? "localhost",
    database: process.env.DB_NAME ?? `Teller_${ENV.toUpperCase()}_${COUNTRY}`,
    user: process.env.DB_USER ?? "",
    password: process.env.DB_PASSWORD ?? "",
    port: Number(process.env.DB_PORT ?? 1433),
    options: { encrypt: true, trustServerCertificate: false },
  };
}

/** True only when SQL Server credentials are provided, so DB tests can be skipped otherwise. */
export function isDbConfigured(): boolean {
  return Boolean(process.env.DB_SERVER && process.env.DB_USER && process.env.DB_PASSWORD);
}
