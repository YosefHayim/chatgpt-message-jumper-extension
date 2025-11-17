# AI Conversation Navigator

A professional-grade Chrome extension for power users of AI platforms, providing advanced navigation, analytics, and productivity tools across ChatGPT, Claude, and Gemini.

## Overview

AI Conversation Navigator is a TypeScript-based Chrome extension that addresses the productivity challenges faced by developers and researchers who rely heavily on AI assistants. The extension transforms basic chat interfaces into powerful, analytics-driven workspaces with intelligent navigation, bookmarking, and cross-platform comparison capabilities.

## Problem Statement

Modern AI chat interfaces present several friction points for power users:

- **Navigation inefficiency**: Long conversations become difficult to navigate, requiring excessive scrolling to revisit specific AI responses
- **Context loss**: No built-in way to track token usage or conversation length, leading to unexpected context limit errors
- **Information retrieval**: Lack of granular search within AI responses, making it difficult to locate specific code snippets or explanations
- **Cross-platform comparison**: No native ability to compare responses from different AI models on the same prompt
- **Knowledge preservation**: Important AI responses are lost when conversations are closed or deleted

## Solution & Value Proposition

This extension delivers measurable productivity improvements through:

### 1. Intelligent Navigation System
- **Keyboard-driven message jumping** with automatic boundary detection and direction reversal
- **Visual feedback** with smooth scrolling and temporary highlighting
- **Auto-positioning** from the closest visible message for context-aware navigation

### 2. Real-Time Analytics & Context Management
- **Token estimation** with platform-specific calculations (GPT-4: 128K, Claude: 200K, Gemini: 1M tokens)
- **Context usage warnings** at configurable thresholds (50-95%)
- **Live statistics panel** showing message counts, character totals, and estimated costs

### 3. Enhanced Search & Filtering
- **Message-level search** that queries AI responses only (not entire DOM)
- **Code-only filtering** to isolate responses containing code blocks
- **Match counting** with context previews and smart result navigation

### 4. Knowledge Management
- **Bookmark system** with custom tagging for important responses
- **Persistent storage** across browser sessions using Chrome Storage API
- **Platform-specific tracking** of conversation history and usage patterns

### 5. Cross-Platform Comparison
- **Message extraction** to re-ask prompts on different AI platforms
- **Batch copy** of all user messages for comprehensive model comparison
- **Quick links** to ChatGPT, Claude, and Gemini with clipboard integration

## Engineering Value

### Technical Excellence
- **95% test coverage** enforced via CI/CD pipeline (Jest + Testing Library)
- **TypeScript strict mode** with comprehensive type safety
- **Service-oriented architecture** with singleton pattern for state management
- **Performance-optimized** using MutationObserver for efficient DOM monitoring
- **Platform-agnostic design** with strategy pattern for multi-platform support

### Maintainability
- **Clear separation of concerns**: UI layer, service layer, utility layer
- **Modular service design**: Each service manages a single domain (navigation, search, storage, etc.)
- **Comprehensive documentation**: Architecture guides, release notes, and deployment procedures
- **Build automation**: esbuild-based bundling with Chrome and Firefox build targets

## Technical Architecture

### Tech Stack
- **Language**: TypeScript 5.3+ (strict mode)
- **Bundler**: esbuild (fast, zero-config bundling)
- **Testing**: Jest 29 with jsdom environment
- **Extension API**: Chrome Manifest V3
- **UI**: Vanilla TypeScript (no framework dependencies)

### Project Structure
```
src/
├── services/              # Business logic layer (singleton services)
│   ├── platformDetector.ts    # Multi-platform detection & configuration
│   ├── messageService.ts      # Message scanning & analytics
│   ├── navigationService.ts   # Navigation state management
│   ├── searchService.ts       # Enhanced search functionality
│   ├── bookmarkService.ts     # Bookmark persistence & retrieval
│   ├── conversationTrackerService.ts  # Usage tracking
│   └── storageService.ts      # Chrome Storage API wrapper
├── utils/                 # Utility layer
│   ├── tokenEstimator.ts      # Platform-specific token estimation
│   └── logger.ts              # Structured logging utility
├── types/                 # TypeScript definitions
│   └── index.ts               # Core types & interfaces
├── content.ts             # Main content script (orchestrator)
└── popup.ts               # Extension popup (settings UI)
```

### Key Design Patterns
- **Singleton Pattern**: All services use `getInstance()` for centralized state
- **Strategy Pattern**: Platform-specific configurations for ChatGPT, Claude, Gemini
- **Observer Pattern**: MutationObserver for reactive DOM change detection
- **Service Layer**: Clear separation between UI and business logic

## Development Workflow

### Setup
```bash
# Install dependencies
npm install

# Run tests with 95% coverage requirement
npm test

# Watch mode for test-driven development
npm run test:watch

# Development build with hot reload
npm run dev
```

### Building
```bash
# Production build (bundles + assets)
npm run build

# Browser-specific builds
npm run build:chrome
npm run build:firefox
npm run build:all

# Clean all build artifacts
npm run clean
```

### Testing
```bash
# Run full test suite
npm test

# Coverage report (must meet 95% threshold)
npm run test:coverage

# Run specific test file
npm test -- platformDetector.test.ts
```

### Loading in Chrome
1. Build the extension: `npm run build`
2. Navigate to `chrome://extensions`
3. Enable "Developer mode" (top-right toggle)
4. Click "Load unpacked" and select the `dist/` directory

## Platform Support

### Supported AI Platforms
- **ChatGPT** (OpenAI) - `chatgpt.com`, `chat.openai.com`
- **Claude** (Anthropic) - `claude.ai`
- **Gemini** (Google) - `gemini.google.com`

### Platform-Specific Configurations
Each platform has unique DOM selectors and context limits defined in `src/services/platformDetector.ts`:

```typescript
{
  messageSelector: '[data-message-author-role="assistant"]',  // ChatGPT
  maxContextTokens: 128000,  // GPT-4 Turbo
  // ... additional platform-specific configs
}
```

## Configuration

### Default Settings
```typescript
{
  enabled: true,
  theme: 'dark',                   // 'dark' | 'light' | 'auto'
  showStats: true,                 // Display statistics panel
  showTokenWarning: true,          // Enable context warnings
  tokenWarningThreshold: 80        // Warn at 80% context usage
}
```

Settings are persisted via Chrome Storage API and synchronized across browser sessions.

## Performance Characteristics

- **Bundle size**: ~150KB (content script + popup, minified)
- **Memory footprint**: ~5-10MB typical usage
- **DOM mutation handling**: Debounced message scanning (300ms delay)
- **Search performance**: O(n) message scanning with early termination

## Security Considerations

- **No external network requests**: All processing happens locally
- **No data transmission**: Bookmarks and settings stored in Chrome Storage API only
- **Minimal permissions**: `storage`, `activeTab`, `scripting`, and platform-specific host permissions
- **Content Security Policy**: Strict CSP for Manifest V3 compliance

## Quality Assurance

### Test Coverage Requirements
- **Global threshold**: 95% for all metrics (branches, functions, lines, statements)
- **Service layer**: Strict 95% coverage enforced
- **CI/CD integration**: Automated testing on every commit

### Code Quality Standards
- **TypeScript strict mode**: All strict checks enabled
- **Linting**: ESLint with recommended rules
- **Unused code detection**: `noUnusedLocals`, `noUnusedParameters` enforced
- **Return type checking**: `noImplicitReturns` required

## Documentation

- **ARCHITECTURE.md**: Comprehensive system design documentation
- **RELEASES.md**: Version history and changelog
- **CLAUDE.md**: AI agent guidance for codebase navigation
- **docs/guide-to-publish-extension.md**: Internal deployment procedures

## System Requirements

- **Node.js**: 18.x or higher
- **npm**: 8.x or higher
- **Browser**: Chrome 90+ or Chromium-based browsers
- **Development OS**: macOS, Linux, or Windows

## Project Metadata

- **Version**: 2.0.0
- **License**: MIT
- **TypeScript**: 5.3.3
- **Build Tool**: esbuild 0.19.11
- **Test Framework**: Jest 29.7.0
