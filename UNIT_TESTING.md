# Unit Testing in Commuto

This document describes the unit testing strategy, setup, and conventions for both the frontend (React) and backend (NestJS) of the Commuto project.

---

## Table of Contents

- [Overview](#overview)
- [Frontend (React) Testing](#frontend-react-testing)
  - [Setup](#setup)
  - [Running Tests](#running-tests)
  - [Writing Tests](#writing-tests)
  - [Example Tests](#example-tests)
- [Backend (NestJS) Testing](#backend-nestjs-testing)
  - [Setup](#setup-1)
  - [Running Tests](#running-tests-1)
  - [Writing Tests](#writing-tests-1)
  - [Example Tests](#example-tests-1)
- [Best Practices](#best-practices)

---

## Overview

- **Frontend**: Uses [Jest](https://jestjs.io/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for unit and component tests.
- **Backend**: Uses [Jest](https://jestjs.io/) (already integrated with NestJS) for unit and integration tests.

---

## Frontend (React) Testing

### Setup

Dependencies (already installed):

- `jest`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- `ts-jest`
- `@types/jest`

Add the following to your `package.json` (if not present):

```json
"scripts": {
  "test": "jest"
}
```

Add a `jest.config.js` in the `app/` directory:

```js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  setupFilesAfterEnv: ["@testing-library/jest-dom/extend-expect"],
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(test).[jt]s?(x)"],
};
```

### Running Tests

From the `app/` directory:

```bash
pnpm test
```

### Writing Tests

- Place tests in `src/__tests__/` or alongside components as `.test.tsx`/`.test.ts` files.
- Use [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for component tests.
- Use Jest for utility and logic tests.

### Example Tests

- `src/__tests__/App.test.tsx`: Renders the main app and checks for Navbar/Footer.
- `src/__tests__/functions.test.ts`: Tests utility functions.

---

## Backend (NestJS) Testing

### Setup

- Jest is already configured in `server/package.json` with a `jest` section.
- All backend unit tests are organized in the `server/__tests__/` directory, outside of the main `src/` codebase for clarity and maintainability.
- The Jest configuration uses `testMatch` to look for tests in `__tests__` only. No `.spec.ts` files should exist in `src/`.

**Example Jest config in `server/package.json`:**

```json
"jest": {
  "preset": "ts-jest",
  "testEnvironment": "node",
  "moduleFileExtensions": ["ts", "js", "json"],
  "testMatch": ["<rootDir>/__tests__/**/*.spec.ts"]
}
```

### Directory Structure

```
server/
  __tests__/
    controllers/
      karma.controller.spec.ts
      ...
    root/
      app.module.spec.ts
      app.service.spec.ts
      env.service.spec.ts
      logger.config.spec.ts
      prisma.service.spec.ts
      ...
    utils/
      timeWindow.util.spec.ts
      ...
```

### Running Tests

From the `server/` directory:

```bash
pnpm test
```

### Writing Tests

- Place all backend unit tests in the `server/__tests__/` directory, mirroring the structure of your codebase (e.g., `controllers/`, `root/`, `utils/`).
- Use `.spec.ts` files for all test files.
- Use NestJS testing utilities (`@nestjs/testing`) for controllers and services.
- Use proper type-safe mocks for dependencies (e.g., `as unknown as ConfigService`).
- Keep tests isolated, deterministic, and independent of external systems (mock Prisma, DB, etc.).
- Use fixed dates/times in tests for deterministic results.

### Example Tests

- `__tests__/controllers/karma.controller.spec.ts`: Tests controller-service interaction for karma redemption.
- `__tests__/root/app.service.spec.ts`: Tests `AppService` logic.
- `__tests__/root/prisma.service.spec.ts`: Tests PrismaService instantiation and connection.
- `__tests__/root/logger.config.spec.ts`: Tests logger config export.
- `__tests__/root/app.module.spec.ts`: Smoke test for module definition.
- `__tests__/utils/timeWindow.util.spec.ts`: Tests time window calculation with a fixed UTC date.

### Additional Recommendations

- All test files should be outside `src/` to keep the codebase clean and maintainable.
- Use descriptive test names and group related tests with `describe`.
- Use mocks for all external dependencies (database, APIs, etc.).
- Run tests in CI/CD for every PR to ensure code quality.

For more advanced mocking and test patterns, see the official [NestJS Testing](https://docs.nestjs.com/fundamentals/testing) documentation.

---

## Best Practices

- Write tests for all business logic, utility functions, and React components.
- Use mocks for external dependencies (API, DB, etc.).
- Keep tests isolated and deterministic.
- Use descriptive test names and group related tests with `describe`.
- Run tests in CI/CD for every PR.

---

For more details, see the official docs:

- [Jest](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/intro/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
