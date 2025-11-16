# Testing Guide

Comprehensive testing guide for AI Conversation Navigator. This document covers testing philosophy, best practices, and detailed examples.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Mocking Strategies](#mocking-strategies)
- [Coverage Goals](#coverage-goals)
- [Manual Testing](#manual-testing)
- [Troubleshooting](#troubleshooting)

## Testing Philosophy

### What We Test

**Priority 1: Business Logic** (Must have 80%+ coverage)
- Service methods and state management
- Utility functions and calculations
- Data transformations and validations
- Error handling and edge cases

**Priority 2: Integration Points** (70%+ coverage)
- Platform detection and configuration
- Chrome API interactions
- DOM queries and manipulation
- Cross-service communication

**What We Don't Test**
- UI rendering and visual appearance (we use vanilla JS)
- Third-party libraries (trust their tests)
- Chrome API implementations (use mocks)
- Simple getters/setters without logic

### Testing Principles

1. **Tests should be fast**: All unit tests should run in under 5 seconds
2. **Tests should be isolated**: No dependencies between tests
3. **Tests should be deterministic**: Same input = same output, always
4. **Tests should be readable**: Clear arrange-act-assert structure
5. **Tests should test behavior**: Focus on what, not how

## Test Structure

### File Organization

```
tests/
├── setup.ts                      # Global test configuration
├── platformDetector.test.ts      # Service tests
├── tokenEstimator.test.ts        # Utility tests
├── navigationService.test.ts     # Service tests
├── messageService.test.ts        # Service tests
├── searchService.test.ts         # Service tests
└── storageService.test.ts        # Service tests
```

### Test File Template

```typescript
/**
 * Service Name Tests
 * Description of what's being tested
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ServiceName } from '~/src/services/serviceName';

describe('ServiceName', () => {
  let service: ServiceName;

  beforeEach(() => {
    // Arrange: Set up fresh state before each test
    service = ServiceName.getInstance();
  });

  afterEach(() => {
    // Clean up after each test if needed
  });

  describe('methodName', () => {
    test('should do something when condition is met', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = service.methodName(input);

      // Assert
      expect(result).toBe('expected');
    });

    test('should handle edge case', () => {
      // Test implementation
    });
  });
});
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (reruns on file changes)
npm run test:watch

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test -- platformDetector.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="navigation"

# Run tests in verbose mode
npm test -- --verbose

# Update snapshots (if we use them in future)
npm test -- --updateSnapshot
```

### Coverage Reports

After running `npm test -- --coverage`, you'll see:

```
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
All files             |   78.45 |    72.15 |   82.50 |   78.12 |
services/             |   82.30 |    75.40 |   85.70 |   81.90 |
  messageService.ts   |   85.20 |    78.60 |   88.90 |   84.80 |
  navigationService.ts|   88.50 |    82.30 |   91.20 |   87.90 |
```

**Coverage Targets:**
- Overall: 70%+
- Services: 80%+
- Critical paths: 100%

## Writing Tests

### The Arrange-Act-Assert Pattern

```typescript
test('should navigate to next message', () => {
  // Arrange: Set up test data and preconditions
  const navService = NavigationService.getInstance();
  navService.initialize();
  const initialState = navService.getState();

  // Act: Execute the code under test
  navService.navigateNext();

  // Assert: Verify the expected outcome
  const newState = navService.getState();
  expect(newState.currentIndex).toBe(initialState.currentIndex + 1);
});
```

### Testing Services

#### Example: NavigationService

```typescript
describe('NavigationService', () => {
  let navService: NavigationService;
  let mockMessages: Message[];

  beforeEach(() => {
    navService = NavigationService.getInstance();

    // Mock message service
    mockMessages = [
      { index: 0, content: 'Message 1', element: document.createElement('div') },
      { index: 1, content: 'Message 2', element: document.createElement('div') },
      { index: 2, content: 'Message 3', element: document.createElement('div') },
    ];

    jest.spyOn(messageService, 'getAssistantMessages').mockReturnValue(mockMessages);
  });

  test('should initialize with correct message count', () => {
    navService.initialize();

    const state = navService.getState();
    expect(state.totalMessages).toBe(3);
  });

  test('should navigate down through messages', () => {
    navService.initialize();

    navService.navigateNext();
    expect(navService.getPositionInfo().current).toBe(2);

    navService.navigateNext();
    expect(navService.getPositionInfo().current).toBe(3);
  });

  test('should switch direction at end of conversation', () => {
    navService.initialize();

    // Navigate to end
    navService.navigateNext();
    navService.navigateNext();
    navService.navigateNext(); // Should switch direction

    const state = navService.getState();
    expect(state.direction).toBe(NavigationDirection.UP);
  });

  test('should not navigate when disabled', () => {
    navService.initialize();
    navService.setEnabled(false);

    const initialPosition = navService.getPositionInfo().current;
    navService.navigateNext();

    expect(navService.getPositionInfo().current).toBe(initialPosition);
  });
});
```

#### Example: MessageService

```typescript
describe('MessageService', () => {
  let messageService: MessageService;

  beforeEach(() => {
    messageService = MessageService.getInstance();

    // Mock DOM
    document.body.innerHTML = `
      <div class="message assistant">Hello world</div>
      <div class="message assistant">How can I help?</div>
    `;
  });

  test('should scan and count messages correctly', () => {
    const messages = messageService.scanMessages();

    expect(messages).toHaveLength(2);
    expect(messages[0].content).toBe('Hello world');
  });

  test('should calculate conversation statistics', () => {
    messageService.scanMessages();
    const stats = messageService.getConversationStats();

    expect(stats.assistantMessages).toBe(2);
    expect(stats.totalCharacters).toBeGreaterThan(0);
    expect(stats.totalWords).toBeGreaterThan(0);
  });

  test('should estimate tokens accurately', () => {
    messageService.scanMessages();
    const estimation = messageService.estimateTokens();

    expect(estimation.tokens).toBeGreaterThan(0);
    expect(estimation.percentOfContext).toBeLessThan(100);
  });
});
```

### Testing Utilities

#### Example: Token Estimator

```typescript
describe('tokenEstimator', () => {
  describe('estimateTokens', () => {
    test('should estimate tokens for short text', () => {
      const tokens = estimateTokens('Hello world', Platform.CHATGPT);
      expect(tokens).toBe(2); // ~4 chars per token
    });

    test('should handle empty string', () => {
      const tokens = estimateTokens('', Platform.CHATGPT);
      expect(tokens).toBe(0);
    });

    test('should handle special characters', () => {
      const tokens = estimateTokens('!@#$%^&*()', Platform.CHATGPT);
      expect(tokens).toBeGreaterThan(0);
    });

    test('should vary by platform', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const gptTokens = estimateTokens(text, Platform.CHATGPT);
      const claudeTokens = estimateTokens(text, Platform.CLAUDE);

      // Different platforms may have different estimation algorithms
      expect(gptTokens).toBeGreaterThan(0);
      expect(claudeTokens).toBeGreaterThan(0);
    });
  });

  describe('formatTokenCount', () => {
    test('should format small numbers without suffix', () => {
      expect(formatTokenCount(999)).toBe('999');
    });

    test('should format thousands with K suffix', () => {
      expect(formatTokenCount(5000)).toBe('5.0K');
      expect(formatTokenCount(12500)).toBe('12.5K');
    });

    test('should format millions with M suffix', () => {
      expect(formatTokenCount(1000000)).toBe('1.0M');
      expect(formatTokenCount(2500000)).toBe('2.5M');
    });
  });
});
```

### Testing Edge Cases

Always test edge cases:

```typescript
describe('edge cases', () => {
  test('should handle empty input', () => {
    const result = service.process('');
    expect(result).toBe(defaultValue);
  });

  test('should handle null/undefined', () => {
    expect(() => service.process(null)).not.toThrow();
    expect(() => service.process(undefined)).not.toThrow();
  });

  test('should handle very large input', () => {
    const largeString = 'a'.repeat(1000000);
    const result = service.process(largeString);
    expect(result).toBeDefined();
  });

  test('should handle special characters', () => {
    const special = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\';
    expect(() => service.process(special)).not.toThrow();
  });

  test('should handle negative numbers', () => {
    const result = service.calculate(-100);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  test('should handle boundary values', () => {
    expect(service.jumpToMessage(-1)).toBeUndefined();
    expect(service.jumpToMessage(999999)).toBeUndefined();
  });
});
```

### Testing Error Handling

```typescript
describe('error handling', () => {
  test('should handle storage errors gracefully', async () => {
    // Mock storage failure
    jest.spyOn(chrome.storage.sync, 'get').mockRejectedValue(new Error('Storage error'));

    const settings = await storageService.loadSettings();

    // Should return defaults instead of throwing
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  test('should log errors appropriately', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    service.performRiskyOperation();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('should validate input and reject invalid values', () => {
    expect(() => service.setThreshold(-10)).toThrow('Invalid threshold');
    expect(() => service.setThreshold(150)).toThrow('Invalid threshold');
  });
});
```

## Mocking Strategies

### Mocking Chrome APIs

```typescript
// Mock Chrome storage
beforeEach(() => {
  global.chrome = {
    storage: {
      sync: {
        get: jest.fn((keys) => Promise.resolve({ settings: DEFAULT_SETTINGS })),
        set: jest.fn(() => Promise.resolve()),
      },
      onChanged: {
        addListener: jest.fn(),
      },
    },
  } as any;
});
```

### Mocking DOM

```typescript
beforeEach(() => {
  // Set up DOM
  document.body.innerHTML = `
    <div class="conversation">
      <div class="message assistant">Message 1</div>
      <div class="message user">Message 2</div>
      <div class="message assistant">Message 3</div>
    </div>
  `;
});

afterEach(() => {
  // Clean up
  document.body.innerHTML = '';
});
```

### Mocking Services

```typescript
// Mock dependency
jest.mock('~/src/services/messageService', () => ({
  getInstance: jest.fn(() => ({
    scanMessages: jest.fn(() => mockMessages),
    getMessageCount: jest.fn(() => 5),
  })),
}));
```

### Spying on Methods

```typescript
test('should call helper method', () => {
  const spy = jest.spyOn(service, 'privateHelperMethod');

  service.publicMethod();

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith('expected-argument');

  spy.mockRestore();
});
```

## Coverage Goals

### Target Metrics

| Component | Coverage Target | Current |
|-----------|----------------|---------|
| Services  | 80%+           | 85%     |
| Utils     | 80%+           | 92%     |
| Overall   | 70%+           | 78%     |

### Critical Paths (100% Required)

- Navigation logic (navigateNext, navigateDown, navigateUp)
- Message detection and counting
- Token estimation
- Platform detection
- Storage persistence

### How to Improve Coverage

1. **Run coverage report**: `npm test -- --coverage`
2. **Identify gaps**: Look for uncovered lines in the report
3. **Add tests**: Write tests for uncovered code
4. **Verify**: Rerun coverage to confirm improvement

```bash
# View detailed coverage
npm test -- --coverage --verbose

# See coverage for specific file
npm test -- --coverage --collectCoverageFrom='src/services/navigationService.ts'
```

## Manual Testing

Automated tests don't cover everything. Manual testing is required for:

### Platform Testing Checklist

Test on each platform before releasing:

#### ChatGPT (chatgpt.com)
- [ ] Navigation works correctly
- [ ] Message counting is accurate
- [ ] Token estimation is reasonable
- [ ] Search functionality works
- [ ] Settings persist correctly
- [ ] Theme switching works
- [ ] No console errors

#### Claude (claude.ai)
- [ ] Navigation works correctly
- [ ] Message counting is accurate
- [ ] Token estimation is reasonable
- [ ] Search functionality works
- [ ] Settings persist correctly
- [ ] Theme switching works
- [ ] No console errors

#### Gemini (gemini.google.com)
- [ ] Navigation works correctly
- [ ] Message counting is accurate
- [ ] Token estimation is reasonable
- [ ] Search functionality works
- [ ] Settings persist correctly
- [ ] Theme switching works
- [ ] No console errors

### Test Scenarios

1. **Short Conversation** (1-5 messages)
   - Navigate up and down
   - Check statistics
   - Test search

2. **Medium Conversation** (10-50 messages)
   - Scroll behavior
   - Performance
   - Memory usage

3. **Long Conversation** (100+ messages)
   - Performance impact
   - Scroll smoothness
   - Token warning triggers

4. **Edge Cases**
   - Empty conversation
   - Single message
   - Mixed user/assistant messages
   - Code blocks and special formatting

### Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Edge (latest)
- [ ] Brave (latest)
- [ ] Opera (latest)

## Troubleshooting

### Common Issues

**Tests fail with "Cannot find module"**
```bash
# Clear Jest cache
npm test -- --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Tests timeout**
```typescript
// Increase timeout for slow tests
test('slow operation', async () => {
  // test implementation
}, 10000); // 10 second timeout
```

**Mocks not working**
```typescript
// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Reset modules
beforeEach(() => {
  jest.resetModules();
});
```

**Coverage not accurate**
```json
// Update jest.config.js
{
  "collectCoverageFrom": [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.ts"
  ]
}
```

### Debugging Tests

```typescript
// Add console.log for debugging
test('debugging example', () => {
  console.log('Debug info:', variable);
  expect(variable).toBe(expected);
});

// Use debugger
test('with debugger', () => {
  debugger; // Will pause here when running with --inspect
  service.method();
});

// Run specific test in debug mode
npm test -- --testNamePattern="specific test" --detectOpenHandles
```

## Best Practices Summary

1. **Write tests first** (TDD) when possible
2. **Keep tests simple** - one assertion per test when possible
3. **Use descriptive names** - test names should explain what's being tested
4. **Mock external dependencies** - don't test third-party code
5. **Test behavior, not implementation** - test what, not how
6. **Clean up after tests** - reset state, restore mocks
7. **Run tests often** - catch regressions early
8. **Maintain high coverage** - aim for 80%+ on critical code
9. **Manual test before release** - automated tests don't catch everything
10. **Update tests with code** - never let tests fall behind

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/)
- [TypeScript and Jest](https://kulshekhar.github.io/ts-jest/)
- [Chrome Extension Testing](https://developer.chrome.com/docs/extensions/mv3/tut_testing/)

---

**Questions?** Contact [yosefisabag@gmail.com](mailto:yosefisabag@gmail.com)

**Happy Testing!**
