---
description: "Use when creating or reviewing API tests using Playwright's request fixture. Covers APIRequestContext patterns, response assertions, authentication headers, schema validation, and API test guard rails."
applyTo: "tests/api/**/*.ts"
---

# API Testing Standards

## API Test File Structure

```typescript
// tests/api/<resource>.api.spec.ts
import { test, expect } from '@playwright/test';
import { ENV } from '../../utils/env.utils';

test.describe('API: <Resource Name>', () => {

  test('@api should return 200 with valid response schema for GET /<endpoint>', async ({ request }) => {
    const response = await request.get(`${ENV.API_BASE_URL}/<endpoint>`);

    expect(response.status()).toBe(200);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toMatchObject({
      id: expect.any(Number),
      name: expect.any(String),
    });
  });

  test('@api should return 401 when no authentication token', async ({ request }) => {
    const response = await request.get(`${ENV.API_BASE_URL}/protected-endpoint`);
    expect(response.status()).toBe(401);
  });

});
```

---

## APIRequestContext Rules

- **Use `request` fixture** built into Playwright — NOT `axios`, `fetch`, or `supertest`
- **Set global headers** in `playwright.config.ts`:
  ```typescript
  use: {
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  }
  ```
- **Auth tokens** go in test fixtures or `test.beforeAll()` — NOT global variables
- **Isolated contexts** for tests that need different auth:
  ```typescript
  const apiContext = await request.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
  ```

---

## HTTP Method Patterns

```typescript
// GET
const response = await request.get(`${ENV.API_BASE_URL}/products`);

// POST with body
const response = await request.post(`${ENV.API_BASE_URL}/auth/login`, {
  data: { username: 'user', password: 'pass' },
});

// PUT
const response = await request.put(`${ENV.API_BASE_URL}/users/1`, {
  data: { name: 'Updated Name' },
});

// DELETE
const response = await request.delete(`${ENV.API_BASE_URL}/users/1`);

// With query params
const response = await request.get(`${ENV.API_BASE_URL}/products`, {
  params: { category: 'electronics', limit: '10' },
});
```

---

## Response Assertion Patterns

```typescript
// Status code
expect(response.status()).toBe(200);
expect(response.ok()).toBeTruthy();   // status 200-299

// Body structure (schema validation)
const body = await response.json();
expect(body).toHaveProperty('token');
expect(body).toMatchObject({
  id: expect.any(Number),
  username: expect.any(String),
  email: expect.stringContaining('@'),
});

// Array responses
expect(Array.isArray(body)).toBeTruthy();
expect(body.length).toBeGreaterThan(0);

// Headers
expect(response.headers()['content-type']).toContain('application/json');

// Text response
const text = await response.text();
expect(text).toContain('expected string');
```

---

## Authentication Flow Pattern

```typescript
test.describe('API: Authenticated Endpoints', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const loginResponse = await request.post(`${ENV.API_BASE_URL}/auth/login`, {
      data: {
        username: ENV.STANDARD_USER,
        password: ENV.STANDARD_PASSWORD,
      },
    });
    expect(loginResponse.ok()).toBeTruthy();
    const body = await loginResponse.json();
    authToken = body.token;
  });

  test('@api should access protected resource with valid token', async ({ request }) => {
    const response = await request.get(`${ENV.API_BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(response.status()).toBe(200);
  });
});
```

---

## API Test Coverage Matrix

For every endpoint, cover:

| Scenario | Status | Test |
|----------|--------|------|
| Happy path (valid request) | 200/201 | Schema + data validation |
| Missing auth | 401 | Error message check |
| Invalid data | 400 | Validation error message |
| Resource not found | 404 | Error structure check |
| Unauthorized role | 403 | Access denied message |

---

## Guard Rails

- ❌ NEVER log response bodies containing passwords or tokens
- ❌ NEVER hardcode base URLs — use `ENV.API_BASE_URL`
- ❌ NEVER share auth tokens via global variables between tests
- ✅ ALWAYS validate both status code AND response schema
- ✅ ALWAYS use `test.describe` per endpoint/resource group
- ✅ ALWAYS test error cases alongside happy paths
- ✅ Tag all API tests with `@api`
