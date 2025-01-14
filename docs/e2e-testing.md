# End-to-End Testing Documentation

This document outlines the end-to-end (e2e) testing setup for the Slack Clone project using Playwright.

## Setup

The e2e testing infrastructure is built using Playwright, which allows testing across multiple browser engines (Chromium, Firefox, and WebKit).

### Installation

```bash
pnpm add -D @playwright/test
pnpm exec playwright install
```

### Test Scripts

Available npm scripts for running tests:
- `pnpm test:e2e` - Run all tests headlessly
- `pnpm test:e2e:ui` - Run tests with UI mode for debugging
- `pnpm test:e2e:debug` - Run tests in debug mode

## Project Structure

```
e2e/
├── utils/
│   └── test-utils.ts    # Shared test utilities and helpers
├── auth.spec.ts         # Authentication tests
├── channels.spec.ts     # Channel operations tests
└── direct-messages.ts   # Direct messaging tests
```

## Test Utilities

Located in `e2e/utils/test-utils.ts`, these utilities provide reusable functions for common operations:

### Configuration
- `TEST_USER`: Default test credentials (configurable via environment variables)
- `DEFAULT_TIMEOUT`: Standard timeout for async operations (10 seconds)

### Core Functions

1. **Authentication**
   ```typescript
   signIn(page: Page, email?: string, password?: string)
   ```
   - Signs in a user with provided or default credentials
   - Verifies successful sign-in

2. **Channel Operations**
   ```typescript
   createChannel(page: Page, channelName: string)
   ```
   - Creates a new channel
   - Verifies channel creation

3. **Messaging**
   ```typescript
   sendMessage(page: Page, message: string)
   waitForMessage(page: Page, message: string, timeout?: number)
   ```
   - Send messages in channels or DMs
   - Wait for message delivery with configurable timeout

4. **Direct Messages**
   ```typescript
   startDM(page: Page, username: string)
   ```
   - Initiates a DM conversation
   - Verifies conversation creation

## Test Coverage

### Authentication Tests (`auth.spec.ts`)
- Successful sign in
- Invalid credentials handling
- Sign out functionality

### Channel Tests (`channels.spec.ts`)
- Channel creation
- Joining existing channels
- Real-time message sending/receiving
- Message history persistence
- Multi-user interactions

### Direct Message Tests (`direct-messages.spec.ts`)
- Starting new DM conversations
- Real-time message exchange
- Message history
- Online status indicators

## Configuration (`playwright.config.ts`)

Key configuration features:
- Parallel test execution
- Automatic test retries in CI
- Screenshots on test failure
- Cross-browser testing (Chrome, Firefox, Safari)
- Development server auto-start

```typescript
webServer: {
  command: 'pnpm dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
}
```

## Error Handling

All test utilities include:
- Comprehensive error messages
- Automatic timeout handling
- Graceful failure reporting
- Type-safe error handling

## Best Practices

1. **Test Independence**
   - Each test should be self-contained
   - Use `beforeEach` for setup
   - Clean up test data after tests

2. **Reliable Selectors**
   - Use role-based selectors (`getByRole`)
   - Use label-based selectors (`getByLabel`)
   - Use regular expressions for flexible text matching

3. **Timeouts**
   - Default timeout of 10 seconds
   - Configurable per operation
   - Explicit timeout handling

4. **Error Messages**
   - Descriptive error messages
   - Context-specific failure information
   - Clear action descriptions

## Future Improvements

Potential enhancements to consider:
1. Test data cleanup implementation
2. Visual regression testing
3. API mocking capabilities
4. CI/CD pipeline integration
5. Performance testing metrics 