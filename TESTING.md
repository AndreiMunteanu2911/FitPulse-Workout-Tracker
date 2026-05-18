# Testing

This project uses a headless Vitest suite. It does not use Playwright, Cypress, or a real browser window.

Tests live in the top-level `tests/` folder and import the real app code from `src/` through the `@/` alias.

## Commands

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

## Test Layers

- `tests/lib/**/*.test.ts`: pure business logic and validation tests.
- `tests/stores/**/*.test.ts`: Zustand state transition tests.
- `tests/hooks/**/*.test.tsx`: hook tests with MSW request handlers.
- `tests/components/**/*.test.tsx`: React component behavior in `jsdom`.
- `tests/app/api/**/*.test.ts`: API route tests with mocked Supabase, Stripe, and app config modules.

## Mocking Policy

External services are mocked at module boundaries:

- Supabase is mocked to assert auth checks, table names, filters, inserts, updates, and error handling.
- Stripe is mocked to assert checkout session parameters and failure handling.
- HTTP requests from hooks and client services can be mocked with MSW via `tests/mocks/server.ts`.
- Browser-only APIs are provided by `jsdom` and `tests/setup.ts`.

These tests verify this app's behavior around external systems. They are not intended to prove Supabase, Stripe, or a browser implementation works.
