---
description: "Add a new Playwright API test for a REST endpoint. Creates the test file using Playwright's request fixture, covers success and error scenarios, and runs to verify."
name: "Add API Test"
agent: "Playwright QA Architect"
argument-hint: "API endpoint and behavior to test (e.g. 'POST /auth/login returns token', 'GET /products returns list')"
tools: [read, edit, search, execute, todo]
---

Add a new Playwright API test for: **$input**

## Your Process

Use a todo list to track each step.

### Step 1: Read context
- Read `utils/env.utils.ts` for ENV configuration
- List `tests/api/` for existing API test patterns
- Read any existing API spec to understand the test structure used

### Step 2: Identify test scope
From the user's input, determine:
- HTTP method: GET, POST, PUT, DELETE, PATCH
- Endpoint path (relative to API_BASE_URL)
- Expected success response: status code + schema
- Expected error cases: 401, 400, 404, etc.
- Authentication required? If yes, get token in `beforeAll`

### Step 3: Create API test file

Create or update `tests/api/<resource>.api.spec.ts`:

Structure to follow:
```typescript
import { test, expect } from '@playwright/test';
import { ENV } from '../../utils/env.utils';

test.describe('API: <Resource>', () => {

  test('@api should return <status> with valid <data> for <method> /<endpoint>', async ({ request }) => {
    const response = await request.<method>(`${ENV.API_BASE_URL}/<endpoint>`, { ... });
    expect(response.status()).toBe(<status>);
    const body = await response.json();
    // schema assertions
  });

  test('@api should return 401 when no authentication', async ({ request }) => { ... });

  test('@api should return 400 when invalid data', async ({ request }) => { ... });

});
```

Cover at minimum:
- ✅ Success case (200/201) with response schema validation
- ✅ Authentication failure (401) if endpoint is protected
- ✅ Validation error (400) if endpoint takes a request body
- ✅ Not found (404) if applicable

### Step 4: Run and verify
```bash
npx playwright test tests/api/ --project=chromium --reporter=list
```

Fix any failures before completing.

### Step 5: Report
Summarize:
- File created/updated
- Tests added (count, names)  
- Test results (X passed)

Follow rules in `.github/instructions/api-testing.instructions.md`.
