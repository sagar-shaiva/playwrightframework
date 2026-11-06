const pad = (value: number) => String(value).padStart(2, "0");

/** Returns the date as DD-MM-YYYY, used for grouping reports/screenshots by day. */
export function getDateFolder(d: Date = new Date()): string {
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

/** Returns DD-MM-YYYY-HH-MM-SS for artifact filenames. */
export function getFileTimestamp(d: Date = new Date()): string {
  return `${getDateFolder(d)}-${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}
