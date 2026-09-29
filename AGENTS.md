# AGENTS.md — SMS Plus Web Automation

## What this repo is

Playwright E2E test harness for the SMS Plus Extension Web app. No application source code lives here — this is purely a test automation project using Page Object Model.

## Commands

```bash
npm test                    # local env (reads .env)
npm run test:dev            # .env.dev
npm run test:staging        # .env.staging
npm run test:production     # .env.production
npx playwright test tests/plans.spec.ts          # single file
npx playwright test -g "test name pattern"       # grep by title
```

No lint, typecheck, or formatter is configured. No `tsconfig.json`. There is nothing to run between edits — just run the relevant test.

Allure is installed (`allure-playwright`) but **not wired into `playwright.config.ts`** — the reporter is `'html'`. `npm run test:allure` produces no Allure results as-is.

## Environment files

- `.env` (local default), `.env.dev`, `.env.staging`, `.env.production` — all gitignored.
- `playwright.config.ts` **throws** if the resolved env file is missing.
- Must contain: `EXTENSION_WEB_URL`, `USER_X_PHONE`, `USER_Y_PHONE`, `OTP`.
- Optional: `ADMIN_PANEL_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (only in `.env.example`; `loginAdmin.js` references these but they are unused/untested).

## Project structure

```
playwright.config.ts        # Config: 60s timeout, workers=1, 3 browsers, html reporter
tests/                      # Spec files (*.spec.ts)
  fixtures/                 # sample.jpg, sample.mp3, sample.mp4, contact.vcf
pages/                      # Page Object Model (JS classes extending BasePage)
helpers/
  appFlow.js                # Composite flows: registration → plan → payment
  utils.js                  # Data gen (faker + libphonenumber), xlsx/CSV loading, purchase log
  loginAdmin.js             # BROKEN — imports missing page object, dead code
data/
  users.csv                 # Excel/CSV-backed user data (opt-in via USE_EXCEL_USERS env)
```

## Language notes

- **Mixed TS + JS**: test specs are `.ts`, page objects and helpers are `.js` (ESM `import`/`export` syntax).
- `package.json` declares `"type": "commonjs"` — Playwright transpiles the ESM imports in page/helper files.
- No TypeScript strict config. No ESLint/Prettier.

## Test architecture

- **Page Object Model**: every page class extends `BasePage.js` which provides `goto()` (with retry), `waitForURL()`, and `wait()`.
- **Navigation**: no `baseURL` in config — all flows use full URLs from `process.env.EXTENSION_WEB_URL`. Tests assert URL regexes (`.*/chats`, `.*/plans-and-subscription`, etc.).
- **Data generation**: default mode creates random valid US phone numbers via `google-libphonenumber` + faker emails. Opt-in Excel mode reads `data/users.csv` when `USE_EXCEL_USERS=true`.
- **Workers**: pinned to 1 in all environments. Retries: 0 locally, 2 on CI.

## Known issues (do not fix without understanding)

- `helpers/loginAdmin.js` imports `../pages/AdminPanel-Page/LoginPage` which does not exist. No spec imports it — it is dead code.
- `pages/ArchivePage.js` is empty (0 lines).
- `tests/chatFeature.spec.ts` has `test.only` on two tests — will skip other tests in that file locally. `forbidOnly` is only enforced on CI.
- CI workflow (`.github/workflows/playwright.yml`) is gitignored (`.github/` is in `.gitignore`) and would fail anyway: runs `npx playwright test` without `TEST_ENV`, and `.env` is also gitignored.
- `device.spec.ts` test 1.3 passes `"android7"` to `selectOSVersion()` which only handles `"lower"`/`"higher"` — falls through to default branch.

## Running a single test or focused verification

```bash
# Single file
npx playwright test tests/payment.spec.ts

# Single test by name
npx playwright test -g "should display plan options"

# Specific browser only
npx playwright test --project=chromium

# Debug mode (headed, step through)
npx playwright test --debug

# Show HTML report after run
npx playwright show-report
```

## Conventions

- Tests are numbered by feature flow: 1.x device, 2.x registration, 3.x plans, 4.x payment, 5.x e2e.
- Page objects use class-based inheritance from `BasePage`.
- Helpers in `helpers/` compose multi-page flows; `utils.js` handles data.
- Env vars are accessed via `process.env.*` directly (loaded by `dotenv` in config).
