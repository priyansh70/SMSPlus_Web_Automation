# Playwright JavaScript Automation Skill (Page Object Model)

## Purpose

Use this skill to create, maintain, debug, and review browser automation
tests using **Playwright with JavaScript** and the **Page Object Model
(POM)**. Produce maintainable, deterministic tests that follow the
existing repository conventions.

## Core Rules

1.  **Inspect the repository first.** Review `package.json`,
    `playwright.config.js`/`playwright.config.ts`, existing page
    objects, fixtures, authentication setup, and nearby tests before
    changing anything.
2.  **Follow existing patterns.** Reuse the project's naming, folder
    structure, fixtures, login flow, environment variables, and
    test-data strategy. Do not introduce a second framework or duplicate
    helpers.
3.  **Use JavaScript** unless the repository is explicitly
    TypeScript-based.
4.  **Use POM.** Put page locators and page-level actions in page-object
    classes. Keep test intent, setup, and assertions in spec files where
    practical.
5.  **Do not guess selectors or application behavior.** Inspect the UI,
    existing tests, accessible names, or application source where
    available. If uncertain, clearly identify the assumption.
6.  **Keep credentials and secrets out of source control.** Read them
    from environment variables or the project's existing secret
    mechanism.
7.  **Make the smallest focused change** that solves the requested task.
8.  **Run the relevant tests** after editing and report the exact
    command and outcome. Never claim a test passed if it was not run.

## Recommended Project Structure

Adapt this to the repository rather than moving files unnecessarily.

``` text
project-root/
├── pages/
│   ├── LoginPage.js
│   └── AutoReplyPage.js
├── tests/
│   ├── login.spec.js
│   └── autoReply.spec.js
├── fixtures/
│   └── testFixtures.js
├── utils/
│   └── testData.js
├── auth/
│   └── adminStorage.json
├── .env
├── .gitignore
├── playwright.config.js
└── package.json
```

Keep generated authentication state, reports, traces, videos,
screenshots, and local environment files out of version control unless
the repository intentionally tracks a sanitized artifact.

## Page Object Model Guidelines

-   Create one class per meaningful page or page-level component.
-   Accept Playwright's `page` in the constructor and store it as
    `this.page`.
-   Define locators in the constructor or in focused locator methods.
-   Add methods that represent user actions, such as `open()`,
    `saveRule()`, or `deleteRule()`.
-   Keep business assertions in the spec unless an assertion is an
    established part of a reusable page workflow.
-   Avoid giant page objects, generic catch-all helpers, duplicated
    selectors, and methods that hide multiple unrelated actions.
-   Prefer accessible locators: `getByRole()`, `getByLabel()`,
    `getByPlaceholder()`, and `getByText()` when the UI supports them.
-   Use CSS/XPath only when a stable accessible locator is unavailable.
    Avoid brittle selectors tied to generated classes or DOM depth.
-   Do not use fixed sleeps (`waitForTimeout`) as a synchronization
    strategy. Wait for a meaningful state, URL, response, or visible
    element.

### Example page object

``` js
// pages/LoginPage.js
class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
  }

  async open() {
    await this.page.goto('/login');
  }

  async signIn(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}

module.exports = { LoginPage };
```

Adapt labels, routes, exports, and module style to the existing
application and repository. Do not copy example selectors without
verifying them.

## Test Authoring Guidelines

-   Use `test()` and `expect()` from `@playwright/test`.
-   Give each test a clear, behavior-focused title.
-   Keep each test focused on one scenario or closely related assertion
    set.
-   Cover positive, negative, boundary, validation, permission, and
    state-transition cases when relevant.
-   Assert observable outcomes, not only that a click completed.
-   Use unique test data when parallel execution or repeated runs could
    cause collisions.
-   Clean up test-created data when safe and supported. Cleanup should
    not conceal the original test failure.
-   Avoid order-dependent tests. Each test should establish its own
    prerequisites or use an explicit, documented fixture.
-   Do not disable tests merely to get a green run. If a skip is
    necessary, document why and report it.
-   Prefer deterministic API or fixture setup when the project already
    supports it; use UI setup when the UI flow itself is under test.

### Example spec

``` js
// tests/login.spec.js
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');

test('user can sign in with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.open();
  await loginPage.signIn(
    process.env.TEST_USER_EMAIL,
    process.env.TEST_USER_PASSWORD
  );

  await expect(page).not.toHaveURL(/\/login(?:$|[?#])/);
});
```

The route and expected post-login behavior above are illustrative.
Confirm the real application behavior before using them.

## Authentication and Fixtures

-   Check whether the repository already uses `storageState`, setup
    projects, fixtures, or a shared login helper.
-   Reuse existing authentication setup rather than logging in
    independently in every test.
-   Keep authenticated and unauthenticated tests separate when they
    require different state.
-   Never commit live tokens, passwords, or user data in `storageState`
    files. Treat storage-state files as credentials.
-   If authentication expires, refresh state using the project's
    documented setup flow; do not hard-code session tokens.
-   Ensure tests that need a clean session explicitly use an empty or
    unauthenticated state, according to the project's configuration.

## Configuration and Environment

-   Read the current Playwright configuration before editing it.
-   Preserve existing browser projects, base URL, retries, workers,
    reporters, traces, screenshots, and videos unless the task requires
    a change.
-   Use environment variables for environment-specific URLs and
    credentials.
-   Validate required environment variables early and provide a clear
    error when one is missing.
-   Do not overwrite `.env` or configuration files wholesale to make a
    small change.
-   Keep local `.env` files and sensitive authentication state in
    `.gitignore`.

## Waiting, Reliability, and Debugging

-   Use Playwright's auto-waiting and web-first assertions.
-   Prefer `await expect(locator).toBeVisible()`, `toHaveText()`,
    `toBeEnabled()`, and `toHaveURL()` over manual polling.
-   For navigation, wait for the expected URL or page state rather than
    assuming a click guarantees navigation.
-   For network-dependent behavior, wait for a relevant response only
    when the request can be identified reliably.
-   Avoid broad exception handling that swallows failures.
-   When a test fails, inspect the error, trace, screenshot, video, and
    relevant application state before changing the test.
-   Fix the root cause; do not add arbitrary delays, retries, or
    weakened assertions to hide flakiness.
-   Use retries as a diagnostic/CI policy, not as a substitute for
    stable test design.

## Test Data

-   Use the project's existing test-data utilities where available.
-   Generate unique emails, names, or identifiers when duplicate data
    can affect results.
-   Keep test data valid for the application's actual validation rules.
-   Do not use real customer or production data.
-   Avoid destructive operations against production environments.
-   Make cleanup idempotent where possible so a failed test can be rerun
    safely.

## Reporting and Artifacts

-   Preserve the repository's configured reporters (for example, HTML or
    Allure) and artifact policies.
-   Capture traces, screenshots, or videos on failure according to the
    existing configuration.
-   Do not add a new reporter or dependency without a clear reason.
-   Do not include passwords, access tokens, personal data, or
    confidential message content in logs or attachments.

## Commands

Check `package.json` and the installed Playwright version first. Typical
commands include:

``` bash
# Run all tests
npx playwright test

# Run a specific spec
npx playwright test tests/autoReply.spec.js

# Run a specific browser project
npx playwright test tests/autoReply.spec.js --project=chromium

# Run tests matching a title or regular expression
npx playwright test tests/autoReply.spec.js --grep "temporary cleanup"

# Open the HTML report, if configured
npx playwright show-report
```

Use the actual spec path, project name, and reporter configured in the
repository. A grep expression filters test titles; it does not change
the test implementation.

## Workflow for Every Task

1.  **Understand:** Restate the requested behavior and identify the
    affected page, feature, and tests.
2.  **Inspect:** Read configuration and nearby page objects/specs;
    identify existing reusable helpers.
3.  **Plan:** Decide the smallest changes and list any assumptions.
4.  **Implement:** Add or update page-object methods and focused tests
    following existing conventions.
5.  **Review:** Check selectors, assertions, data uniqueness, cleanup,
    and secret handling.
6.  **Run:** Execute the narrowest relevant test command first, then
    broader tests when appropriate.
7.  **Report:** Summarize changed files, scenarios covered, command run,
    pass/fail status, and any remaining blockers.

## Completion Checklist

-   [ ] Existing repository conventions were followed.
-   [ ] Locators are stable and verified.
-   [ ] Page-object methods represent clear user actions.
-   [ ] Assertions validate actual outcomes.
-   [ ] No fixed sleeps were added as a workaround.
-   [ ] Test data is safe, valid, and repeatable.
-   [ ] Secrets and authentication state are protected.
-   [ ] Relevant tests were executed, or inability to run them is
    stated.
-   [ ] Results and remaining limitations are reported accurately.

## Expected Assistant Output

For code changes, report:

1.  **Summary** --- what changed and why.
2.  **Files changed** --- paths and purpose.
3.  **Scenarios covered** --- concise list.
4.  **Validation** --- exact test command and actual result.
5.  **Follow-ups** --- only genuine blockers, assumptions, or risks.

Do not claim that tests, builds, or checks passed unless their execution
confirms it.
