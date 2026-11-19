# Pacific Teller - Playwright TypeScript Framework

A clean, widely-used Playwright + TypeScript framework for a banking **teller** application,
supporting multiple environments and countries, storageState authentication, JSON-driven
data, SQL Server (SSMS) backend assertions, and per-environment reporting.

A small **dummy teller web app** (`dummy-app/`) is included so the whole suite runs end-to-end
out of the box. Point the config at your real URLs to use it for the actual application.

## Supported targets

- **Environments:** `qa`, `uat`, `training` (config in `env/.env.qa` / `env/.env.uat` / `env/.env.training`)
- **Countries:** `FJ, VN, VU, KI, TO, TL, SB, PNG, WS, CK`
- **User role keys per country:** `superUser, branchManager, branchSupervisor, backOffice, enquiry, loanOfficer, loanManager, manager, teller`

User IDs differ per environment and country, e.g. `FJ_SU_BRQA41`, `FJ_SU_BRUAT41`, and
`FJ_SU_BRTR41`. All test data for a country — user IDs, single `password`, customers, transactions and negative-login cases —
lives in one file: `src/data/<env>/<COUNTRY>.json`. Complete country entry URLs live in `env/.env.<env>`.

## Structure

```
env/
  .env.qa / .env.uat / .env.training  # complete entry URL per country
.env                                  # shared secrets e.g. SQL Server (git-ignored)
config/
  env.config.ts            # loads one env/country data file and builds URLs, auth paths, DB config
src/
  pages/                   # Page Objects (Login, Customer, Transaction)
  fixtures/test.fixtures.ts # POM Playwright Test fixtures
  fixtures/bdd.fixture.ts  # BDD fixtures and auth-tag handling
  schemas/test-data.schema.ts # validates and types environment/country JSON data
  types/                   # shared database and runtime-data contracts
  utils/                   # database (mssql) and report date helper
  data/
    qa/ uat/ training/     # one <COUNTRY>.json per country: users + password + all spec data
tests/                     # Teller, user-specific, multi-user, and manual-login examples
  01-branch-open.setup.ts  # SU opens the branch before authentication
  02-auth.setup.ts         # logs in each userId and saves its storageState
  03-customer-create.spec.ts  # SU creates a customer and publishes its generated ID
  04-deposit.spec.ts       # Teller deposit UI cases plus generated-customer DB verification
  05-withdrawal.spec.ts    # Teller withdrawal UI cases plus generated-customer DB verification
  06-dialogs.spec.ts
  07-manual-login.spec.ts
  08-multi-user.spec.ts
  09-statement.spec.ts
  10-teller-customer.spec.ts
  11-user-specific.spec.ts
  99-branch-close.teardown.ts # SU closes the branch after all tests
features/                  # Numbered Playwright-BDD features, matching step files in features/steps/
dummy-app/                 # launch.html (bank info), login.html popup, customer.html, transaction.html
reports/<env>/<country>/<DD-MM-YYYY>/ # reports and test artifacts
auth/<env>/<userId>.json     # saved storageState sessions
```

## Setup

```powershell
npm install
npx playwright install
```

## Running

Select the target with env vars. Playwright chooses the local worker count automatically; CI uses
one worker. Cross-spec ordering is defined with Playwright project dependencies rather than
filename order.

```powershell
# default environment and country (qa / FJ)
npm test

# run a specific environment + country (30 combos available)
npm run test:qa-FJ
npm run test:uat-PNG
npm run test:training-CK

# run headed (append :headed to any POM or BDD target)
npm run test:training-FJ:headed

# run the BDD feature suite for an environment and country
npm run bdd:training-FJ
npm run bdd:qa-PNG
npm run bdd:uat-CK
npm run bdd:training-FJ:headed

# whole environment (all-country default FJ unless COUNTRY set)
npm run test:qa

# fully explicit
$env:TEST_ENV="uat"; $env:COUNTRY="PNG"; npx playwright test

# SU creates a Training/FJ customer and verifies it in the database
npm run test:customer-create

# create customer, deposit, withdraw, and verify each operation in the database
npm run test:customer-transactions
```

### POM and BDD

POM commands such as `npm run test:training-FJ` and BDD commands such as
`npm run bdd:training-FJ` both use `playwright.config.ts`. The `FRAMEWORK=bdd` flag selects the BDD
projects; without it, the POM projects are selected. BDD commands run their own branch-open,
per-user auth, and branch-close feature projects; they do not depend on POM setup projects. BDD
logs in and saves a session for each configured role, then customer-create, deposit, and withdrawal
run in dependency order; other BDD scenarios run afterward. Append `:headed` to any target command to
open the browser, for example `npm run bdd:training-FJ:headed`; commands without that suffix run
headless.

Numbered `.feature` and `features/steps/` files reuse the same page objects and JSON test data.
Step texts are unique, so step definitions are shared by every feature; steps used by several
features live in `features/steps/00-common.ts`. Each BDD scenario has a matching POM test with the
same name and the same data keys.

Authenticated BDD scenarios use the same states saved by `tests/02-auth.setup.ts`: tag scenarios
with `@auth-superUser`, `@auth-teller`, `@auth-branchManager`, or another role key from `users`. POM
tests select the same session with `test.use({ authRole: "teller" })`. BDD projects depend on the
existing branch/auth setup. Use `@noauth` only for scenarios that intentionally test manual login.
BDD HTML and JSON reports are written under `bdd-html` and `bdd-results`; POM reports stay under
`html` and `results`.

Use the same environment and country matrix for both lanes: `test:<env>-<country>` for POM and
`bdd:<env>-<country>` for BDD, with `:headed` variants for either lane. Each BDD command runs
generation and execution directly, for example `npm run bdd:training-FJ` or
`npm run bdd:training-FJ:headed`.

### Dependent workflows

File number prefixes (`01`, `02`, ...) are only for navigation. POM execution order comes from the
project `dependencies` in `playwright.config.ts`; BDD uses the corresponding workflow dependencies
in the same config. Each UI test verifies backend state right after the UI action, in a
`DB:` test step:

```text
POM: branch-open -> setup -> customer-create -> customer-deposit -> customer-withdrawal -> normal specs
BDD: branch-open -> auth -> customer-create -> customer-deposit -> customer-withdrawal -> normal scenarios
  branch-close runs as teardown after the selected workflow
```

1. `branch-open` signs in as SU and ensures the branch is open.
2. `setup` creates authenticated storage states for every configured user.
3. `customer-create`, `customer-deposit`, and `customer-withdrawal` form the generated-customer workflow.
4. Each workflow spec performs its UI action, then verifies the customer and exact transaction row in a `DB:` step.
5. Normal specs depend only on `setup`, so a customer workflow failure never skips them.
6. The `branch-close` teardown signs in as SU and closes the branch after all branches finish.

The producer stores its generated ID under its test name in
`runtime-data/<env>/<country>/<date>/runtime.json`. Runtime data is git-ignored. The `UI:` step checks the screen; the `DB:` step then runs a read-only,
parameterized `SELECT` through the `db` fixture, so data is asserted at the moment it is produced.
The DB step is skipped when DB credentials are absent. The branch teardown runs after its dependent
projects complete, including when a middle project fails and downstream projects are skipped.

Runtime values are grouped by spec file. Every runtime key must be unique across the workflow:

```json
{
  "03-customer-create.spec.ts": {
    "customerId": "FJ100029"
  }
}
```

Specs use the same two methods for every runtime value:

```ts
saveRuntimeData(testInfo, "customerId", customerId);
const customerId = getRuntimeData<string>("customerId");
```

The save method derives the spec file from Playwright's `testInfo`. Specs can store any future value
without adding another save or read function. Because reads search by key, use descriptive unique
keys.

Database row types live in `src/types/database.types.ts`; generated-value contracts live in
`src/types/runtimeData.types.ts`. Transaction DB steps use one simple query for the transaction row
and one simple query for the customer balance instead of joining tables.

For larger suites, group only genuinely dependent specs into a workflow project chain. Keep
independent specs in separate projects so they can run in parallel. Within one spec, use
`test.describe.serial` only when tests truly share mutable state; prefer independent tests whenever
the application can create state through supported UI or API setup.

### Where credentials live (non-production best practice)

- **`src/data/<env>/<COUNTRY>.json`** — committed, per-country test data: named users,
  a single `password`, and each spec's data. Recommended
  because these are non-secret, shared test accounts the team reads/edits per environment.
- **`env/.env.<env>`** — complete `BASE_URL_<COUNTRY>` entry URLs and SQL Server credentials.

`BASE_URL_<COUNTRY>` must be the full URL to open. The framework appends no query string or route.
The dummy app uses opaque entry paths and generates new customer/transaction paths internally;
page objects navigate by UI elements and do not depend on those paths.

Keep test inputs and expected business values in these JSON files, including amounts, reasons,
messages, and the database values to assert. Tests contain only flow and assertion logic. Add every
new field to `src/schemas/test-data.schema.ts` so missing or invalid data fails during configuration
loading.

Every collection is keyed by a readable name. Features and tests refer to items by that key:

```json
{
  "password": "Password1",
  "users": { "teller": "FJ_T_BRQA41", "branchManager": "FJ_BM_BRQA41" },
  "customers": {
    "retail": { "id": "1001", "name": "John Doe", "balance": 5000 },
    "corporate": { "id": "1003", "name": "Acme Corporation", "balance": 250000 }
  },
  "unknownCustomers": { "notRegistered": { "id": "9999" } },
  "newCustomers": { "retail": { "name": "Playwright Customer", "type": "Retail", "openingBalance": 0 } },
  "deposits": {
    "salary": { "amount": 1000, "reason": "Salary credit" },
    "standard": { "amount": 500, "reason": "Cash deposit" },
    "decimal": { "amount": 250.75, "reason": "Cash deposit" }
  },
  "withdrawals": {
    "cash": { "amount": 250, "reason": "Cash withdrawal" },
    "standard": { "amount": 200, "reason": "Cash withdrawal" },
    "farAboveBalance": { "amount": 999999, "reason": "Cash withdrawal" }
  },
  "amountsAboveBalance": { "oneCent": 0.01 },
  "invalidAmounts": { "zero": 0, "negative": -50 },
  "depositReasons": { "cash": "Cash deposit", "cheque": "Cheque deposit", "salary": "Salary credit", "transfer": "Transfer received", "refund": "Refund" },
  "withdrawalReasons": { "cash": "Cash withdrawal", "billPayment": "Bill payment", "transferSent": "Transfer sent", "serviceFee": "Service fee", "loanRepayment": "Loan repayment" },
  "transactionTypes": { "deposit": "Deposit", "withdrawal": "Withdrawal" },
  "invalidPasswords": { "wrongPassword": "WrongPass@000" },
  "messages": {
    "invalidPassword": "Invalid password",
    "transactionSuccess": "Transaction is successful",
    "customerNotFound": "Customer not found",
    "customerNotSelected": "Please search and select a customer first",
    "invalidAmount": "Enter a valid amount greater than 0",
    "insufficientFunds": "Insufficient funds for this withdrawal",
    "tellerOnly": "Only Teller users can post transactions"
  }
}
```

`transactionTypes` holds the values expected in the `TransactionType` column of `dbo.Transactions`.
Expected balances are not stored: each test reads the balance before the transaction and adds or
subtracts the amount.

### Writing features with key-based data

POM tests and BDD steps read data the same way: ask for the `testData` fixture and look values up
by key. Feature steps name the data they use in double quotes; the value behind each key lives in
the JSON file, so the same feature runs in every environment and country.

```gherkin
Scenario: A withdrawal far above the balance is rejected
  Given I am signed in as "teller"
  And I open customer "retail" on the transaction page
  When I withdraw "farAboveBalance"
  Then I see the transaction error "insufficientFunds"
```

```ts
When("I withdraw {string}", async ({ transactionPage, testData }, withdrawalKey: string) => {
  const withdrawal = testData.withdrawals[withdrawalKey];
  await transactionPage.submitTransaction("withdraw", withdrawal.amount, withdrawal.reason);
});
```

The matching POM test uses the same keys:

```ts
test("A withdrawal far above the balance is rejected", async ({ transactionPage, dialogs, testData }) => {
  await transactionPage.submitTransaction("withdraw", testData.withdrawals.farAboveBalance.amount, testData.withdrawals.farAboveBalance.reason);
  await dialogs.expectShown(testData.messages.insufficientFunds);
  await transactionPage.expectError(testData.messages.insufficientFunds);
});
```

Rules:

- Every step starts with "I"; checks start with "I see" or "I am".
- Data keys are always in double quotes and match `{string}` in the step definition. Literal values
  (amounts, names, messages) never appear in features.
- Use a **Scenario Outline** when the same steps run with different keys; the Examples table lists
  keys and the POM test loops over the same list. Use a **Scenario** when the steps differ.
- Use the same scenario and test names in both lanes.

Open the last HTML report:

```powershell
npm run report
```

## Authentication (storageState)

Opening an env/country URL shows a launch page with the bank name and info. That page opens a
popup with the login form, and the whole application (customer, transaction pages) runs inside
the popup. `launchPage.openLoginPopup()` opens the URL and returns the popup page; the `appPage` fixture
passes that popup to `loginPage`, `customerPage`, `transactionPage`, `dialogs`, and screenshots,
so specs do not deal with the popup themselves.

`tests/01-branch-open.setup.ts` runs before authentication and ensures the branch is open using SU.
Then `tests/02-auth.setup.ts` logs in every configured user ID and saves each session to
`auth/<env>/<userId>.json`. `tests/99-branch-close.teardown.ts` closes the branch after all dependent
projects finish.

POM specs import `test` from `src/fixtures/test.fixtures.ts`; BDD steps import it from
`src/fixtures/bdd.fixture.ts`. Both expose the same page objects, database, dialogs, screenshots,
and `asUser` fixtures. POM tests start logged out unless the spec explicitly selects a user:

```ts
import { test } from "../src/fixtures/test.fixtures";

test.use({ authRole: "teller" });

test("opens customer search", async ({ customerPage }) => {
  await customerPage.expectLoaded();
});
```

For a whole test block that uses another user, override the role:

```ts
test.describe("Branch Manager", () => {
  test.use({ authRole: "branchManager" });

  test("approves a request", async ({ customerPage }) => {
    await customerPage.expectLoaded();
  });
});
```

When one test needs another user in addition to its selected session, use `asUser`:

```ts
test("teller submits and manager reviews", async ({ customerPage, asUser, testData }) => {
  await customerPage.expectLoaded();

  const managerCustomerPage = await asUser("manager");
  await managerCustomerPage.expectLoggedInAs(testData.users.manager);
});
```

`asUser` returns the additional user's `CustomerPage`; the regular page fixtures continue
to use the test's primary session.

Login scenarios use `test` without a `storageState` override, so they start logged out:

```ts
import { test } from "../src/fixtures/test.fixtures";

test("logs in manually", async ({ loginPage }) => {
  await loginPage.expectLoaded();
  await loginPage.login("username", "password");
});
```

Page-object naming: actions are verbs (`login`, `searchCustomer`, `submitTransaction`),
navigation starts with `goTo` (`goToTransactionPage`), `open*` is used only when a new window
opens (`openLoginPopup`, `openStatement`), and assertions start with `expect`
(`expectLoaded`, `expectLoggedInAs`, `expectCustomerFound`).

## SQL Server (SSMS) assertions

Set `DB_SERVER`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`, and optionally `DB_NAME` in the respective
`env/.env.<env>` file.
Use the `db` fixture to query and assert backend state:

```ts
type BalanceRow = { Balance: number };

const rows = await db.query<BalanceRow>("SELECT Balance FROM dbo.Accounts WHERE CustomerId = @id", { id: "1001" });
expect(rows).toHaveLength(1);
expect(rows[0].Balance).toBe(5000);
```

DB steps are skipped automatically when credentials are absent. Update table/column names to match
your schema.

### Transactions table

The dummy app creates `dbo.Transactions` automatically (next to `dbo.Customers`) and writes one row
per Teller deposit or withdrawal, in the same SQL transaction as the balance update. Deleting a
customer also deletes their transactions.

| Column                                 | Meaning                                                         |
| -------------------------------------- | --------------------------------------------------------------- |
| `TransactionId`                        | Identity primary key (`BIGINT`; `mssql` returns it as a string) |
| `Environment`, `Country`, `CustomerId` | Foreign key to `dbo.Customers`                                  |
| `TransactionType`                      | `Deposit` or `Withdrawal`                                       |
| `Amount`                               | Always positive                                                 |
| `BalanceBefore`, `BalanceAfter`        | Customer balance around the transaction                         |
| `ReasonCode`, `Reason`                 | Code and label chosen in the **Reason** dropdown                |
| `TransactionDateTime`                  | UTC timestamp, set by the database                              |
| `CreatedBy`                            | Teller user ID that posted it                                   |

The Reason dropdown on the transaction page depends on the type (deposit and withdrawal have
different lists), and the server rejects a reason that does not belong to the type. Pass the label to
`transactionPage.submitTransaction(type, amount, reason)`; if omitted, the first reason is used. After a
successful posting the page shows `Transaction ID: <n>` (`transactionPage.transactionId`), which the
DB step uses to look up the exact row. Dummy customers (1001 to 1003) have no DB row, so no ID is shown.

## Reports & screenshots

- HTML report: `reports/<env>/<country>/<date>/html`
- JSON report: `reports/<env>/<country>/<date>/results/results.json`
- Allure results: `reports/<env>/<country>/<date>/allure-results`
- Generated Allure 3 report: `reports/<env>/<country>/<date>/allure-report`
- Traces for every test, plus failure videos and screenshots: `reports/<env>/<country>/<date>/test-results`
- Workflow screenshots: `reports/<env>/<country>/<date>/screenshots/<spec>/<test>`
- Statement PDFs: `reports/<env>/<country>/<date>/downloads`

Call `takeScreenshot("01.loginpage")` from a spec after a meaningful workflow checkpoint. The supplied name
is saved with a timestamp, for example `01.loginpage-DD-MM-YYYY-HH-MM-SS.png`. Screenshots are also
attached to the HTML and Allure reports.

Open an HTML report or trace by passing its environment/country/date path:

```powershell
npm run report -- reports/training/FJ/31-10-2026/html
npm run trace -- reports/training/FJ/31-10-2026/test-results/<test-folder>/trace.zip
```

Delete one environment/country/date run or delete all report artifacts:

```powershell
npm run clean:run -- reports/training/FJ/31-10-2026
npm run clean:all
```

Tracing is enabled for every test. The exact trace path is also linked from each test in the HTML report.

Generate and open an Allure 3 report after a test run by passing the matching environment, country, and date paths:

```powershell
npm run allure:generate -- reports/training/FJ/01-11-2026/allure-results --output reports/training/FJ/01-11-2026/allure-report
npm run allure:open -- reports/training/FJ/01-11-2026/allure-report
```

Use the same commands with `qa`, `uat`, any configured country, and the required run date.

## Statements and PDFs

After selecting a customer, the dummy teller app provides View statement, Print to PDF,
Download PDF, and Print actions. `tests/09-statement.spec.ts` covers five scenarios: statement
popup, PDF preview popup, PDF-only download, browser print request, and Playwright-generated
print PDF. Run them in either mode:

```powershell
npx playwright test tests/09-statement.spec.ts
npx playwright test tests/09-statement.spec.ts --headed
```

## Browser dialogs

The automatic `dialogs` fixture accepts every browser dialog so a popup can never leave Playwright
blocked, and records each message. Assert a dialog after the action that opens it; messages no test
checked are printed at the end of the test as unexpected:

```ts
await transactionPage.submitTransaction("deposit", testData.deposits.standard.amount, testData.deposits.standard.reason);
await dialogs.expectShown(testData.messages.transactionSuccess);
```

## Pointing at the real application

Edit `src/data/<env>/<COUNTRY>.json` with each country's real `password` and user IDs,
set base URLs in `env/.env.<env>`, then remove the `webServer` block in `playwright.config.ts`
(or keep it only for local runs against `dummy-app/`).
