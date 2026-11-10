import * as sql from "mssql";
import { getDbConfig, isDbConfigured } from "../../config/env.config";
export class Database {
    pool;
    static isAvailable() {
        return isDbConfigured();
    }
    async connect() {
        if (!this.pool) {
            this.pool = await new sql.ConnectionPool(getDbConfig()).connect();
        }
        return this.pool;
    }
    async query(queryText, params = {}) {
        const pool = await this.connect();
        const request = pool.request();
        for (const [key, value] of Object.entries(params)) {
            request.input(key, value);
        }
        const result = await request.query(queryText);
        return result.recordset;
    }
    async close() {
        if (this.pool) {
            await this.pool.close();
        }
    }
}
