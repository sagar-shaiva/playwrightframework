import * as sql from "mssql";
import { getDbConfig, isDbConfigured } from "../../config/env.config";

export class Database {
  private pool: sql.ConnectionPool | undefined;

  static isAvailable(): boolean {
    return isDbConfigured();
  }

  private async connect(): Promise<sql.ConnectionPool> {
    if (!this.pool) {
      this.pool = await new sql.ConnectionPool(getDbConfig()).connect();
    }
    return this.pool;
  }

  async query<T>(queryText: string, params: Record<string, unknown> = {}): Promise<T[]> {
    const pool = await this.connect();
    const request = pool.request();

    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }

    const result = await request.query(queryText);
    return result.recordset as T[];
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
    }
  }
}
