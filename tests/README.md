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
- **utils.test.ts** - Tests for utility functions (path normalization, filename sanitization, etc.)
- **camera-modal.test.ts** - Tests for camera modal functionality (path resolution, file operations, platform detection)

## Test Coverage

Current test coverage focuses on:
- Settings validation and defaults
- Path normalization and resolution
- Filename sanitization (security)
- Unique filename generation (conflict handling)
- Timestamp generation
- Platform detection logic
- File operations (mocked)

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
- jsdom environment is used to simulate browser APIs
- Obsidian APIs are mocked to allow testing without the full Obsidian environment
- Platform and navigator globals are mocked in `setup.ts`
