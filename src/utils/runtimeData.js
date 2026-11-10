import * as fs from "fs";
import * as path from "path";
import { COUNTRY, ENV } from "../../config/env.config";
const runtimeFile = path.resolve(process.cwd(), "runtime-data", ENV, `${COUNTRY}.json`);
function readRuntimeData() {
    if (!fs.existsSync(runtimeFile))
        return {};
    return JSON.parse(fs.readFileSync(runtimeFile, "utf-8"));
}
export function saveRuntimeData(testInfo, key, value) {
    const data = readRuntimeData();
    const fileName = path.basename(testInfo.file);
    data[fileName] ??= {};
    data[fileName][key] = value;
    fs.mkdirSync(path.dirname(runtimeFile), { recursive: true });
    fs.writeFileSync(runtimeFile, JSON.stringify(data, null, 2));
}
export function getRuntimeData(key) {
    for (const fileData of Object.values(readRuntimeData())) {
        if (key in fileData)
            return fileData[key];
    }
    throw new Error(`Runtime data was not saved for key: ${key}`);
}
