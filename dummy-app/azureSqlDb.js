const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const sql = require("mssql");

const pools = new Map();
const initializedEnvironments = new Set();

function readDatabaseConfig(environment) {
  const envPath = path.resolve(__dirname, "..", "env", `.env.${environment}`);
  const values = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};
  const server = process.env.DB_SERVER || values.DB_SERVER;
  const database = process.env.DB_NAME || values.DB_NAME;
  const user = process.env.DB_USER || values.DB_USER;
  const password = process.env.DB_PASSWORD || values.DB_PASSWORD;
  const port = Number(process.env.DB_PORT || values.DB_PORT || 1433);

  if (!server || !database || !user || !password) {
    throw new Error(`Azure SQL is not configured for ${environment}`);
  }

  return {
    server,
    database,
    user,
    password,
    port,
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
  };
}

async function getPool(environment) {
  if (!pools.has(environment)) {
    const pool = await new sql.ConnectionPool(readDatabaseConfig(environment)).connect();
    pools.set(environment, pool);
  }
  return pools.get(environment);
}

async function ensureSchema(environment) {
  if (initializedEnvironments.has(environment)) return;

  const pool = await getPool(environment);
  await pool.request().query(`
    IF OBJECT_ID('dbo.Customers', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Customers (
        Environment NVARCHAR(20) NOT NULL,
        Country NVARCHAR(10) NOT NULL,
        CustomerId NVARCHAR(50) NOT NULL,
        CustomerName NVARCHAR(100) NOT NULL,
        CustomerType NVARCHAR(30) NOT NULL,
        Balance DECIMAL(18, 2) NOT NULL,
        CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Customers_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_Customers PRIMARY KEY (Environment, Country, CustomerId)
      );
    END

    IF OBJECT_ID('dbo.CustomerNumberSequence', 'SO') IS NULL
      EXEC('CREATE SEQUENCE dbo.CustomerNumberSequence AS BIGINT START WITH 10001 INCREMENT BY 1');

    IF OBJECT_ID('dbo.Transactions', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Transactions (
        TransactionId BIGINT IDENTITY(1, 1) NOT NULL,
        Environment NVARCHAR(20) NOT NULL,
        Country NVARCHAR(10) NOT NULL,
        CustomerId NVARCHAR(50) NOT NULL,
        TransactionType NVARCHAR(10) NOT NULL,
        Amount DECIMAL(18, 2) NOT NULL,
        BalanceBefore DECIMAL(18, 2) NOT NULL,
        BalanceAfter DECIMAL(18, 2) NOT NULL,
        ReasonCode NVARCHAR(30) NOT NULL,
        Reason NVARCHAR(200) NOT NULL,
        TransactionDateTime DATETIME2(3) NOT NULL CONSTRAINT DF_Transactions_DateTime DEFAULT SYSUTCDATETIME(),
        CreatedBy NVARCHAR(50) NOT NULL,
        CONSTRAINT PK_Transactions PRIMARY KEY (TransactionId),
        CONSTRAINT CK_Transactions_Type CHECK (TransactionType IN ('Deposit', 'Withdrawal')),
        CONSTRAINT CK_Transactions_Amount CHECK (Amount > 0),
        CONSTRAINT FK_Transactions_Customers FOREIGN KEY (Environment, Country, CustomerId)
          REFERENCES dbo.Customers (Environment, Country, CustomerId) ON DELETE CASCADE
      );
      CREATE INDEX IX_Transactions_Customer ON dbo.Transactions (Environment, Country, CustomerId, TransactionDateTime DESC);
    END
  `);
  initializedEnvironments.add(environment);
}

function mapCustomer(row) {
  return {
    customerId: row.CustomerId,
    name: row.CustomerName,
    type: row.CustomerType,
    balance: Number(row.Balance),
    country: row.Country,
    environment: row.Environment,
    createdAt: row.CreatedAt,
  };
}

async function createCustomer(environment, country, customer) {
  await ensureSchema(environment);
  const pool = await getPool(environment);
  const result = await pool
    .request()
    .input("environment", sql.NVarChar(20), environment)
    .input("country", sql.NVarChar(10), country)
    .input("name", sql.NVarChar(100), customer.name)
    .input("type", sql.NVarChar(30), customer.type)
    .input("balance", sql.Decimal(18, 2), customer.balance).query(`
      DECLARE @nextNumber BIGINT;
      SELECT @nextNumber = ISNULL(MAX(TRY_CONVERT(BIGINT, SUBSTRING(CustomerId, LEN(@country) + 1, 50))), 100000) + 1
      FROM dbo.Customers WITH (UPDLOCK, HOLDLOCK)
      WHERE Environment = @environment
        AND Country = @country
        AND CustomerId LIKE @country + '%';

      DECLARE @customerId NVARCHAR(50) = @country + CONVERT(NVARCHAR(20), @nextNumber);

      INSERT INTO dbo.Customers (Environment, Country, CustomerId, CustomerName, CustomerType, Balance)
      OUTPUT INSERTED.*
      VALUES (@environment, @country, @customerId, @name, @type, @balance)
    `);
  return mapCustomer(result.recordset[0]);
}

async function findCustomer(environment, country, customerId) {
  await ensureSchema(environment);
  const pool = await getPool(environment);
  const result = await pool.request().input("environment", sql.NVarChar(20), environment).input("country", sql.NVarChar(10), country).input("customerId", sql.NVarChar(50), customerId).query(`
      SELECT Environment, Country, CustomerId, CustomerName, CustomerType, Balance, CreatedAt
      FROM dbo.Customers
      WHERE Environment = @environment AND Country = @country AND CustomerId = @customerId
    `);
  return result.recordset[0] ? mapCustomer(result.recordset[0]) : undefined;
}

async function listCustomers(environment, country, offset, limit) {
  await ensureSchema(environment);
  const pool = await getPool(environment);
  const result = await pool.request().input("environment", sql.NVarChar(20), environment).input("country", sql.NVarChar(10), country).input("offset", sql.Int, offset).input("limit", sql.Int, limit)
    .query(`
      SELECT COUNT(*) AS Total
      FROM dbo.Customers
      WHERE Environment = @environment AND Country = @country;

      SELECT Environment, Country, CustomerId, CustomerName, CustomerType, Balance, CreatedAt
      FROM dbo.Customers
      WHERE Environment = @environment AND Country = @country
      ORDER BY CustomerId
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `);
  return {
    total: Number(result.recordsets[0][0].Total),
    customers: result.recordsets[1].map(mapCustomer),
  };
}

async function deleteCustomer(environment, country, customerId) {
  await ensureSchema(environment);
  const pool = await getPool(environment);
  const result = await pool.request().input("environment", sql.NVarChar(20), environment).input("country", sql.NVarChar(10), country).input("customerId", sql.NVarChar(50), customerId).query(`
      DELETE FROM dbo.Customers
      WHERE Environment = @environment AND Country = @country AND CustomerId = @customerId
    `);
  return result.rowsAffected[0] > 0;
}

async function postTransaction(environment, country, customerId, transaction) {
  await ensureSchema(environment);
  const pool = await getPool(environment);
  const isWithdrawal = transaction.type === "withdraw";
  const result = await pool
    .request()
    .input("environment", sql.NVarChar(20), environment)
    .input("country", sql.NVarChar(10), country)
    .input("customerId", sql.NVarChar(50), customerId)
    .input("type", sql.NVarChar(10), isWithdrawal ? "Withdrawal" : "Deposit")
    .input("amount", sql.Decimal(18, 2), transaction.amount)
    .input("change", sql.Decimal(18, 2), isWithdrawal ? -transaction.amount : transaction.amount)
    .input("reasonCode", sql.NVarChar(30), transaction.reasonCode)
    .input("reason", sql.NVarChar(200), transaction.reason)
    .input("createdBy", sql.NVarChar(50), transaction.createdBy).query(`
      SET XACT_ABORT ON;
      BEGIN TRANSACTION;

      DECLARE @balances TABLE (BalanceBefore DECIMAL(18, 2), BalanceAfter DECIMAL(18, 2));

      UPDATE dbo.Customers
      SET Balance = Balance + @change
      OUTPUT DELETED.Balance, INSERTED.Balance INTO @balances
      WHERE Environment = @environment
        AND Country = @country
        AND CustomerId = @customerId
        AND Balance + @change >= 0;

      INSERT INTO dbo.Transactions
        (Environment, Country, CustomerId, TransactionType, Amount, BalanceBefore, BalanceAfter, ReasonCode, Reason, CreatedBy)
      OUTPUT INSERTED.TransactionId, INSERTED.TransactionDateTime
      SELECT @environment, @country, @customerId, @type, @amount, BalanceBefore, BalanceAfter, @reasonCode, @reason, @createdBy
      FROM @balances;

      COMMIT TRANSACTION;
    `);

  const posted = result.recordset[0];
  if (posted) {
    const customer = await findCustomer(environment, country, customerId);
    return { customer, transactionId: Number(posted.TransactionId), transactionDateTime: posted.TransactionDateTime };
  }
  const customer = await findCustomer(environment, country, customerId);
  if (!customer) throw new Error("Customer not found");
  throw new Error("Insufficient funds for this withdrawal");
}

module.exports = { createCustomer, findCustomer, listCustomers, deleteCustomer, postTransaction };
