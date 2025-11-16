# Contributing to AI Conversation Navigator

Thank you for considering contributing to AI Conversation Navigator! This document provides guidelines and best practices for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Architecture Overview](#architecture-overview)
- [Contact](#contact)

## Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

### Prerequisites

- Node.js 18+ and npm 8+
- Chrome/Chromium-based browser for testing
- Git for version control
- TypeScript knowledge
- Familiarity with Chrome Extension APIs

### Initial Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-extension-conversation-navigator.git
   cd ai-extension-conversation-navigator
   ```

3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/YosefHayim/ai-extension-conversation-navigator.git
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Build the project:
   ```bash
   npm run build
   ```

6. Run tests to ensure everything works:
   ```bash
   npm test
   ```

### Development Environment

- **Editor**: VS Code recommended with TypeScript and Prettier extensions
- **Node Version**: Use Node 18+ (consider using nvm for version management)
- **Browser**: Chrome or any Chromium-based browser with Developer Mode enabled

## Development Workflow

### Creating a Feature Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a new feature branch
git checkout -b feature/your-feature-name
```

### Branch Naming Conventions

- `feature/` - New features (e.g., `feature/export-stats`)
- `fix/` - Bug fixes (e.g., `fix/navigation-scroll-issue`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)
- `test/` - Test additions or fixes (e.g., `test/add-search-service-tests`)
- `refactor/` - Code refactoring (e.g., `refactor/simplify-message-parser`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

### Making Changes

1. **Write clean, readable code** following our coding standards
2. **Add tests** for new functionality
3. **Update documentation** if adding new features
4. **Test thoroughly** across all supported platforms (ChatGPT, Claude, Gemini)
5. **Keep commits atomic** - one logical change per commit

### Testing Your Changes

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Generate coverage report
npm test -- --coverage

# Manual testing in browser
npm run build
# Then load the extension in Chrome from the dist/ directory
```

### Manual Testing Checklist

Before submitting a PR, test your changes on:

- [ ] ChatGPT (chatgpt.com)
- [ ] Claude (claude.ai)
- [ ] Gemini (gemini.google.com)
- [ ] Different conversation lengths (short, medium, long)
- [ ] Different viewport sizes
- [ ] Light and dark themes

## Coding Standards

### TypeScript Guidelines

1. **Strict Type Safety**
   - Use TypeScript strict mode (enabled in tsconfig.json)
   - Avoid `any` types - use proper type definitions
   - Define interfaces for complex objects
   - Use enums for fixed sets of values

   ```typescript
   // Good
   interface MessageData {
     content: string;
     role: MessageRole;
     timestamp: number;
   }

   // Avoid
   const data: any = { /* ... */ };
   ```

2. **Naming Conventions**
   - **Classes**: PascalCase (e.g., `NavigationService`)
   - **Interfaces/Types**: PascalCase (e.g., `Message`, `ConversationStats`)
   - **Functions/Methods**: camelCase (e.g., `scanMessages`, `navigateNext`)
   - **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_CONTEXT_TOKENS`)
   - **Private members**: prefix with `private` keyword
   - **Files**: camelCase for utilities, PascalCase for classes

3. **Code Organization**
   - One class per file
   - Group related functions together
   - Keep files under 300 lines when possible
   - Use barrel exports (index.ts) for clean imports

4. **Comments and Documentation**
   - Use JSDoc comments for public methods
   - Explain WHY, not WHAT (code should be self-explanatory)
   - Add inline comments for complex logic
   - Keep comments up-to-date with code changes

   ```typescript
   /**
    * Navigate to the next message based on current direction
    * Automatically switches direction at conversation boundaries
    */
   public navigateNext(): void {
     // Implementation
   }
   ```

### Design Patterns

We follow these patterns throughout the codebase:

1. **Singleton Pattern**
   - All services use singleton instances
   - Ensures consistent state management
   - Example: `NavigationService.getInstance()`

2. **Service Layer Architecture**
   - Clear separation between UI and business logic
   - Services handle all business logic
   - UI components call service methods

3. **Observer Pattern**
   - MutationObserver for DOM change detection
   - Chrome storage listeners for settings sync

4. **Strategy Pattern**
   - Platform-specific implementations
   - Configurable behavior based on context

### Code Style

We use Prettier for code formatting. Configuration is in `.prettierrc`.

```bash
# Format code (happens automatically on save in VS Code)
npm run format
```

**Key Style Points:**
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in multiline structures
- Max line length: 100 characters

### Error Handling

1. **Always handle errors gracefully**
   ```typescript
   try {
     await storageService.saveSettings(settings);
   } catch (error) {
     console.error('Failed to save settings:', error);
     // Show user-friendly error message
   }
   ```

2. **Validate inputs**
   ```typescript
   public jumpToMessage(index: number): void {
     if (index < 0 || index >= this.state.totalMessages) {
       console.warn('Invalid message index:', index);
       return;
     }
     // Continue with valid index
   }
   ```

3. **Provide fallback values**
   ```typescript
   const settings = result.settings || DEFAULT_SETTINGS;
   ```

## Testing Guidelines

### Test Structure

Follow the Arrange-Act-Assert pattern:

```typescript
test('should navigate to next message', () => {
  // Arrange: Set up test data
  const service = NavigationService.getInstance();
  service.initialize();

  // Act: Perform the action
  service.navigateNext();

  // Assert: Verify the outcome
  const position = service.getPositionInfo();
  expect(position.current).toBe(2);
});
```

### What to Test

1. **Logic Components** (Priority)
   - All service methods
   - Utility functions
   - State management
   - Edge cases and error conditions

2. **Integration Points**
   - Platform detection
   - DOM interactions (with mocks)
   - Chrome API interactions (with mocks)

3. **DO NOT Test**
   - UI rendering (we use vanilla JS, not React)
   - Visual appearance
   - Third-party libraries

### Test Coverage Goals

- **Minimum**: 70% overall coverage
- **Target**: 80%+ for service layer
- **Critical paths**: 100% (navigation, message detection)

### Writing Good Tests

```typescript
describe('SearchService', () => {
  let searchService: SearchService;

  beforeEach(() => {
    searchService = SearchService.getInstance();
    // Reset state before each test
  });

  describe('search', () => {
    test('should find matches in message content', () => {
      // Test implementation
    });

    test('should handle empty search term', () => {
      // Test implementation
    });

    test('should be case-insensitive', () => {
      // Test implementation
    });
  });
});
```

### Mocking

Use Jest mocks for external dependencies:

```typescript
// Mock Chrome API
global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
} as any;
```

For more testing guidelines, see [TESTING.md](TESTING.md).

## Pull Request Process

### Before Submitting

1. **Ensure all tests pass**: `npm test`
2. **Build successfully**: `npm run build`
3. **No linting errors**: Code follows style guide
4. **Documentation updated**: If adding features
5. **Manual testing complete**: Tested on all platforms

### PR Title Format

Use conventional commit format:

- `feat: Add conversation export feature`
- `fix: Resolve scroll issue in Claude`
- `docs: Update installation instructions`
- `test: Add tests for NavigationService`
- `refactor: Simplify token estimation logic`
- `chore: Update dependencies`

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing Done
- [ ] Unit tests added/updated
- [ ] Manual testing on ChatGPT
- [ ] Manual testing on Claude
- [ ] Manual testing on Gemini

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests pass locally
- [ ] Documentation updated
```

### Review Process

1. Automated checks must pass (tests, build)
2. At least one maintainer review required
3. Address all review comments
4. Maintain a clean commit history (squash if needed)
5. Keep PR scope focused - one feature/fix per PR

### After Approval

- Maintainers will merge your PR
- Your contribution will be acknowledged in release notes
- Close any related issues

## Architecture Overview

### Project Structure

```
src/
├── types/          # TypeScript type definitions
├── services/       # Business logic (singleton services)
├── utils/          # Utility functions (pure, stateless)
└── content.ts      # Main content script entry point

tests/              # Test files (mirrors src/ structure)
```

### Key Principles

1. **Separation of Concerns**: Services handle business logic, UI handles presentation
2. **Single Responsibility**: Each service has one clear purpose
3. **DRY (Don't Repeat Yourself)**: Shared logic goes in utils/
4. **Immutability**: Return new objects instead of mutating state
5. **Type Safety**: Leverage TypeScript's type system

### Adding New Features

1. **Define types** in `src/types/index.ts`
2. **Create service** in `src/services/` if needed
3. **Add tests** in `tests/`
4. **Update documentation**
5. **Consider platform compatibility**

For detailed architecture documentation, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Best Practices

### Performance

1. **Lazy initialization**: Initialize only when needed
2. **Debounce expensive operations**: DOM queries, calculations
3. **Cache when possible**: Store repeated calculations
4. **Clean up listeners**: Remove event listeners when done

### Security

1. **Validate all inputs**: Never trust external data
2. **Sanitize DOM content**: Prevent XSS vulnerabilities
3. **Use Content Security Policy**: Defined in manifest.json
4. **Minimize permissions**: Request only necessary permissions

### Accessibility

1. **Keyboard navigation**: Support keyboard shortcuts
2. **Screen reader friendly**: Use semantic HTML
3. **Color contrast**: Ensure readable text
4. **Focus indicators**: Clear visual focus states

### Platform Compatibility

1. **Test on all platforms**: ChatGPT, Claude, Gemini
2. **Handle DOM variations**: Different message structures
3. **Graceful degradation**: Work even if some features fail
4. **Platform-specific configs**: Use PlatformDetector service

## Getting Help

### Resources

- **Documentation**: Check README.md, DEVELOPMENT.md, and other docs
- **Issues**: Search existing issues before creating new ones
- **Discussions**: Ask questions in GitHub Discussions

### Contact

If you have questions, encounter bugs, or want to request features:

- **Email**: [yosefisabag@gmail.com](mailto:yosefisabag@gmail.com)
- **LinkedIn**: [Yosef Hayim Sabag](https://www.linkedin.com/in/yosef-hayim-sabag/)
- **GitHub Issues**: [Create an issue](https://github.com/YosefHayim/ai-extension-conversation-navigator/issues)

## Recognition

Contributors will be recognized in:
- Project README
- Release notes
- GitHub contributors page

Thank you for contributing to make AI Conversation Navigator better!

---

**Happy Coding!**
