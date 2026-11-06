import * as fs from "fs";
import * as path from "path";
import type { TestInfo } from "@playwright/test";
import { COUNTRY, ENV } from "../../config/env.config";
import type { RuntimeDataStore } from "../types/runtimeData.types";

const runtimeFile = path.resolve(process.cwd(), "runtime-data", ENV, `${COUNTRY}.json`);

function readRuntimeData(): RuntimeDataStore {
  if (!fs.existsSync(runtimeFile)) return {};
  return JSON.parse(fs.readFileSync(runtimeFile, "utf-8")) as RuntimeDataStore;
}

export function saveRuntimeData(testInfo: TestInfo, key: string, value: unknown) {
  const data = readRuntimeData();
  const fileName = path.basename(testInfo.file);
  data[fileName] ??= {};
  data[fileName][key] = value;

  fs.mkdirSync(path.dirname(runtimeFile), { recursive: true });
  fs.writeFileSync(runtimeFile, JSON.stringify(data, null, 2));
}

export function getRuntimeData<T>(key: string): T {
  for (const fileData of Object.values(readRuntimeData())) {
    if (key in fileData) return fileData[key] as T;
  }
  throw new Error(`Runtime data was not saved for key: ${key}`);
}
