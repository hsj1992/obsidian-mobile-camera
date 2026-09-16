# Tests

This directory contains unit tests for the Mobile Camera & QR Scanner plugin.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

- **settings.test.ts** - Tests for plugin settings and configuration
- **file-service.test.ts** - Production folder resolution, creation, filename conflicts and date templates
- **filename.test.ts** - Production filename sanitization
- **camera-modal.test.ts** - Real modal actions, capture inputs and cancellation
- **main.test.ts** - Plugin loading, command registration, persistence and unloading
- **note-target.test.ts** - Original selection and cursor insertion across view changes
- **production.test.ts** - Async photo and QR flows across note switches and closure
- **clipboard.test.ts** - Copy results, denied access, timeout and cancellation
- **qr-scanner-service.test.ts** - Native, bitmap, pixel-worker and compatibility routing
- **qr-worker-client.test.ts** - Worker transport, timeouts and termination
- **qr-worker.test.ts** - Actual jsQR decoding using a fixed reference matrix
- **rename-modal.test.ts** - Rename, save and cancel behavior

Release validation uses Node's test runner outside Jest:
`npm run test:release`. Run `npm run check` for all quality checks.

## Test Coverage

Current test coverage focuses on:
- Settings validation and defaults
- Path normalization and resolution
- Filename sanitization (security)
- Unique filename generation (conflict handling)
- Timestamp generation
- Actual plugin command registration on mobile and desktop
- Async file-saving and note-insertion behavior

## Mocks

The `mocks/` directory contains mock implementations of Obsidian API:
- `obsidian.ts` - Mock classes for App, Vault, Workspace, Modal, etc.

## Adding New Tests

When adding new functionality:
1. Create or update the relevant test file
2. Add test cases covering:
   - Happy path (expected behavior)
   - Edge cases (empty inputs, special characters, etc.)
   - Error conditions
3. Run tests to ensure they pass
4. Check coverage to ensure adequate testing

## Notes

- Tests use Jest with ts-jest for TypeScript support
- Jest and `@jest/environment-jsdom-abstract` use matching Jest 30 versions;
  ts-jest uses its compatible 29.4 release.
- `environment/jsdom.cjs` composes Jest's official base environment with the project's
  jsdom 29 dependency, avoiding the older built-in environment's deprecated encoding dependency.
  See [Jest environment composition](https://jestjs.io/docs/test-environment#extending-built-in-environments).
- jsdom environment is used to simulate browser APIs
- Obsidian APIs are mocked to allow testing without the full Obsidian environment
- Tests import production modules; do not copy their implementations into tests.
- Mock external Obsidian and browser boundaries only, and restore modified browser APIs.
- Each browser-routing test defines the capabilities it needs. setup.ts only adds DOM matchers.
- Coverage does not replace Android/iOS testing; mock behavior can differ from real Obsidian.
