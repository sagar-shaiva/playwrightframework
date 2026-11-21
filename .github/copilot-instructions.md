# Playwright framework rules

These rules describe the framework, not the application under test. Parts marked **App-specific** are
replaced for each new application; everything else is reused as is.

## Stack

Playwright Test, `playwright-bdd`, TypeScript, `zod`, `dotenv`, `cross-env`, `allure-playwright`; `mssql` only when backend checks are needed.

## Folder layout

```
features/   NN-name.feature          Gherkin only
steps/      NN-name.steps.ts         one step file per feature, same name, tagged @bddNN
tests/      NN-name.spec.ts          POM specs; 01-*.setup.ts, 02-auth.setup.ts, 99-*.teardown.ts
config/     env.config.ts            env/country selection, env loading, data validation, URL/auth/DB helpers
env/        .env.<env>               BASE_URL_<COUNTRY> only (committed)
            .env.<env>.local         secrets such as DB_* (git-ignored)
src/pages/       page objects        src/fixtures/test.fixtures.ts (POM)   src/fixtures/bdd.fixture.ts (BDD)
src/schemas/     test-data.schema.ts src/data/<env>/<COUNTRY>.json         src/utils/  src/types/
auth/<env>/<userId>.json             saved sessions (git-ignored)
reports/ runtime-data/ .features-gen/ are git-ignored
```

## Selecting the target

- `TEST_ENV` (qa|uat|training) and `COUNTRY` come from env vars; npm scripts are `test:<env>-<COUNTRY>` (POM) and `bdd:<env>-<COUNTRY>` (BDD, sets `FRAMEWORK=bdd` and runs `bddgen` first), each with a `:headed` variant.
- `config/env.config.ts` loads `env/.env.<env>.local`, then `env/.env.<env>`, then root `.env`. dotenv never overrides a set variable, so CI secrets and shell variables always win.
- It loads `src/data/<env>/<COUNTRY>.json`, validates it with the zod schema, and exports `data`, `ENV`, `COUNTRY`, `getAppUrl()`, `getAuthFile()`, `getDbConfig()`, `isDbConfigured()`.

## Test data

- One JSON file per env and country, validated by one strict zod schema. Every collection is a keyed record (`z.record`), so tests look values up by key: `testData.deposits["standard"]`. No `as` casts, no key unions.
- Names describe the business meaning: `deposits.salary`, `amountsAboveBalance.oneCent`, `transactionTypes.deposit`. Never abbreviations or vague words such as `valid`, `type`, `databaseType`.
- Expected values that can be calculated (balances) are calculated in the test, not stored.
- Messages, roles, customers, amounts, reasons and database values live in the JSON only.
- Specs and steps read data only through the `testData` fixture. Setup and teardown files may import `data`.
- Write JSON as UTF-8 without BOM.

## Fixtures (POM and BDD expose the same ones)

`testData`, page objects (one fixture each, built from `appPage`), `db`, `dialogs` (auto), `asUser(role)`, `takeScreenshot(name)`.

- POM selects a saved session with `test.use({ authRole: "teller" })`; BDD uses the tag `@auth-teller`; `@noauth` starts logged out. Roles are camelCase keys of `users` in the data file.
- `asUser(role)` opens a second session with that role's saved state and returns its page object.
- Do not add a per-scenario state fixture.

## Page objects

- Actions are verbs (`login`, `searchCustomer`, `submitTransaction`); navigation starts with `goTo`; `open*` only when a new window opens; assertions start with `expect`.
- Locators use roles, labels and test ids. No sleeps; wait on a condition.
- A page object never installs its own dialog handlers; the `dialogs` fixture owns them.

## Dialogs

The `dialogs` fixture accepts every browser dialog and records the message. Tests assert after the action with `dialogs.expectShown(message)`. Unchecked messages are printed as unexpected.

## Runtime data

`saveRuntimeData(testInfo, key, value)` / `getRuntimeData<T>(key)` share generated values (for example a created customer ID) between dependent specs. Keys are unique: `customerId` for POM, `bddCustomerId` for BDD.

## Database checks

- Each stateful test has a UI step, then a DB step that runs read-only parameterised SELECTs.
- The DB step returns immediately when `Database.isAvailable()` is false, so tests pass without database credentials.

## Project dependencies (playwright.config.ts)

- Order: branch/setup open -> auth setup (one saved session per role) -> create -> deposit -> withdrawal -> independent specs; the teardown project runs last. BDD mirrors this with `@bdd01` ... `@bdd99` projects and one `bdd-independent` project.
- Independent specs run in parallel; leave `workers` unset (Playwright default) and `fullyParallel: false`.
- Reports go to `reports/<env>/<country>/<date>/` (html, json, allure; BDD uses a `bdd-` prefix).

## Writing features

- Every step starts with "I". Checks read "I see ..." or "I am ...".
- Data keys are always in double quotes and match `{string}` in the step definition; placeholders `<name>` are used only in a Scenario Outline and are also quoted, including in the title.
- Scenario Outline when only the keys differ (reasons, invalid amounts, customer kinds, roles); plain Scenario when the steps differ.
- No literal values (amounts, names, messages) in features. Avoid the word "configured". Avoid `/` and `()` in step text.
- Prefer many small When/Then steps over one big step.

## Writing steps

- File `steps/NN-name.steps.ts` for `features/NN-name.feature`, created with `createBdd(test, { tags: "@bddNN" })`. No shared step file; repeating a sign-in step per file is accepted.
- Steps call the same fixtures, page methods and data lookups as the POM specs. Values passed between steps use a variable at the top of the file only when unavoidable (popup, download, second session).
- Use `{string}` parameters typed `string`; never cast.

## POM specs

- Test names equal the scenario names; the same data keys appear in the same order; loops mirror the Examples tables.
- Use `test.step("UI: ...")` and `test.step("DB: ...")` for stateful tests.

## Secrets and CI

- Credentials never go in committed files. Local: `env/.env.<env>.local`. GitHub: Settings > Environments (`training`, `qa`, `uat`), each with a secret `DB_PASSWORD` and variables `DB_SERVER`, `DB_NAME`, `DB_USER`.
- The workflow is manual (`workflow_dispatch`) with inputs framework (pom|bdd), environment, country, database_checks; it runs the same npm script as a local run and uploads `reports/`.
- The job runs in `mcr.microsoft.com/playwright:v<version>-noble` so browsers need no install; the tag must equal the `@playwright/test` version, so update both together.

## Reliability lessons

- Attach event handlers before the first `await` in application scripts; tests can click before a late handler exists.
- Wait for `load` before filling a form that depends on page scripts.
- A popup listener must not carry its own timeout that starts before `goto()`; use `{ timeout: 0 }` and let the test timeout bound it.
- Remote hosts on free plans cold-start; allow for a slow first request and use CI `retries: 1`.

## Done checklist for any change

`npx tsc --noEmit`, `npx bddgen` (no missing or duplicate steps), then both full suites for one env and country must pass.

## App-specific (replace for each application)

`src/pages/*`, `src/schemas/test-data.schema.ts` sections, `src/data/**`, the launch/login flow in `LaunchPage`/`LoginPage`, the setup and teardown specs, `features/*`, `steps/*`, `tests/*`, DB table names and row types, and the `webServer` block (remove it when the application is already hosted).
