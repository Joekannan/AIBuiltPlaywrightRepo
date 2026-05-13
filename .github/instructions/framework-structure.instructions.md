---
description: "Use when creating, extending, reviewing, or scaffolding the Playwright TypeScript automation framework. Covers the canonical folder layout, naming conventions, import rules, configuration standards, and file placement for all framework artifacts."
applyTo: ["tests/**", "pages/**", "helpers/**", "utils/**", "fixtures/**", "data/**", "*.config.ts"]
---

# Framework Structure

## Canonical Folder Layout

```
playwright-swaglabs/
├── .github/
│   ├── agents/
│   │   └── playwright-qa.agent.md        # Orchestrator agent
│   ├── instructions/
│   │   ├── framework-structure.instructions.md
│   │   ├── page-objects.instructions.md
│   │   ├── test-patterns.instructions.md
│   │   ├── api-testing.instructions.md
│   │   └── ci-cd.instructions.md
│   ├── prompts/
│   │   ├── scaffold-framework.prompt.md
│   │   ├── add-e2e-test.prompt.md
│   │   ├── add-api-test.prompt.md
│   │   ├── run-fix-tests.prompt.md
│   │   └── generate-readme.prompt.md
│   ├── skills/
│   │   ├── add-playwright-test/SKILL.md
│   │   └── run-and-fix-tests/SKILL.md
│   └── workflows/
│       └── playwright.yml
├── pages/
│   ├── base.page.ts                      # Abstract base — shared navigation/wait methods
│   ├── login.page.ts                     # Login page POM
│   └── inventory.page.ts                 # Inventory/products POM
├── tests/
│   ├── e2e/
│   │   ├── login/
│   │   │   └── login.spec.ts
│   │   └── inventory/
│   │       └── inventory.spec.ts
│   └── api/
│       └── auth.api.spec.ts
├── fixtures/
│   └── base.fixture.ts                   # Extended test — all POMs injected here
├── helpers/
│   ├── test.helper.ts                    # Reusable test utilities
│   └── auth.helper.ts                    # Auth state management
├── utils/
│   ├── env.utils.ts                      # Environment variable helpers
│   ├── logger.ts                         # Structured logging
│   └── date.utils.ts                     # Date/time utilities
├── data/
│   └── test-data/
│       ├── users.json                    # User credentials (non-production)
│       └── products.json                 # Product test data
├── playwright.config.ts
├── .env.example                          # Template — never commit .env
├── .gitignore
└── README.md
```

---

## Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| Spec files (UI) | `*.spec.ts` | `login.spec.ts` |
| Spec files (API) | `*.api.spec.ts` | `auth.api.spec.ts` |
| Page Objects | `<page>.page.ts` | `login.page.ts` |
| Fixture file | `base.fixture.ts` | always `base.fixture.ts` |
| Helper files | `<domain>.helper.ts` | `auth.helper.ts` |
| Utility files | `<name>.utils.ts` | `env.utils.ts` |
| Test data | `<entity>.json` | `users.json` |
| Classes | PascalCase | `LoginPage`, `InventoryPage` |
| Methods | camelCase | `fillCredentials()`, `submit()` |
| Test names | Sentence, descriptive | `'should login with valid credentials'` |
| Locator properties | camelCase + `private readonly` | `private readonly loginButton` |

---

## Import Rules

- **Tests** always import from fixtures:
  ```typescript
  import { test, expect } from '../../fixtures/base.fixture';
  ```
- **Page objects** are injected via fixtures — never `new LoginPage(page)` in test files
- **Test data** imported directly from JSON:
  ```typescript
  import users from '../../data/test-data/users.json';
  ```
- **ENV config** imported from utils:
  ```typescript
  import { ENV } from '../../utils/env.utils';
  ```

---

## Configuration Standards

### playwright.config.ts must include:
- `baseURL` read from `process.env.BASE_URL`
- `screenshot: 'only-on-failure'`
- `trace: 'on-first-retry'`
- `retries: process.env.CI ? 2 : 0`
- `reporter: [['html'], ['github']]` for CI compatibility
- Projects for at minimum: chromium, firefox, webkit

### Environment Variables (.env.example)
```
BASE_URL=https://www.saucedemo.com
API_BASE_URL=https://www.saucedemo.com/api
STANDARD_USER=standard_user
STANDARD_PASSWORD=secret_sauce
```

---

## Guard Rails

- **NEVER** commit `.env` — only `.env.example`
- **NEVER** put test logic in `pages/` — only user action methods
- **NEVER** put assertions in `pages/` — only in `tests/`
- **NEVER** create a new fixture file — extend `base.fixture.ts`
- **ALWAYS** place new features in their own subfolder under `tests/e2e/`
- **ALWAYS** run tests after any structural change to validate nothing broke
