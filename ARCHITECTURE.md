# Architecture Documentation

Comprehensive architecture guide for AI Conversation Navigator. This document explains the design decisions, patterns, and structure of the codebase.

## Table of Contents

- [Overview](#overview)
- [Design Principles](#design-principles)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [Design Patterns](#design-patterns)
- [Data Flow](#data-flow)
- [Platform Integration](#platform-integration)
- [Extension Lifecycle](#extension-lifecycle)
- [Performance Considerations](#performance-considerations)
- [Security](#security)

## Overview

AI Conversation Navigator is a Chrome extension built with TypeScript that provides navigation, analytics, and search functionality for AI conversation platforms (ChatGPT, Claude, and Gemini).

### Technology Stack

- **Language**: TypeScript 5.3+ (strict mode)
- **Bundler**: esbuild (fast, minimal configuration)
- **Testing**: Jest with Testing Library
- **UI**: Vanilla JavaScript/TypeScript (no framework)
- **APIs**: Chrome Extension APIs (Manifest V3)

### Key Features

1. Smart message navigation with visual feedback
2. Real-time conversation statistics and analytics
3. Token estimation and context warnings
4. Enhanced search within messages
5. Multi-platform support (ChatGPT, Claude, Gemini)
6. Persistent settings via Chrome storage

## Design Principles

### 1. Separation of Concerns

The codebase is organized into distinct layers:

```
UI Layer (content.ts, popup.ts)
       ↓
Service Layer (services/)
       ↓
Utility Layer (utils/)
       ↓
Platform Layer (DOM)
```

**Benefits:**
- Easy to test services independently
- UI can change without affecting logic
- Clear responsibility boundaries

### 2. Singleton Pattern for Services

All services use singleton instances:

```typescript
export class NavigationService {
  private static instance: NavigationService;

  public static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }
}
```

**Benefits:**
- Consistent state across the application
- Single source of truth
- Easy dependency management

### 3. Type Safety

Strict TypeScript configuration ensures type safety:

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true
}
```

**Benefits:**
- Catch errors at compile time
- Better IDE support
- Self-documenting code

### 4. Immutability

Services return new objects rather than mutating state:

```typescript
public getState(): NavigationState {
  return { ...this.state }; // Return copy, not reference
}
```

**Benefits:**
- Prevents accidental mutations
- Easier to debug
- Predictable behavior

## Project Structure

```
ai-extension-conversation-navigator/
├── src/
│   ├── types/
│   │   └── index.ts              # All TypeScript interfaces and types
│   ├── services/
│   │   ├── platformDetector.ts   # Platform detection service
│   │   ├── messageService.ts     # Message scanning and analysis
│   │   ├── navigationService.ts  # Navigation state and control
│   │   ├── searchService.ts      # Search functionality
│   │   └── storageService.ts     # Settings persistence
│   ├── utils/
│   │   └── tokenEstimator.ts     # Token estimation utilities
│   ├── content.ts                # Main content script
│   └── popup.ts                  # Extension popup
├── tests/
│   ├── platformDetector.test.ts
│   ├── tokenEstimator.test.ts
│   ├── navigationService.test.ts
│   ├── messageService.test.ts
│   ├── searchService.test.ts
│   └── storageService.test.ts
├── assets/
│   ├── manifest.json             # Extension manifest
│   ├── popup.html                # Popup UI
│   └── *.css                     # Stylesheets
├── icons/                        # Extension icons
└── dist/                         # Build output (generated)
```

### Directory Responsibilities

**src/types/**: Type definitions
- Interfaces for all data structures
- Enums for constants
- Type aliases for complex types

**src/services/**: Business logic
- Singleton service classes
- State management
- Core functionality

**src/utils/**: Pure utility functions
- Stateless helper functions
- Calculations and transformations
- No side effects

**tests/**: Test files
- Mirrors src/ structure
- Unit tests for all services and utils
- Integration tests where needed

## Core Components

### 1. PlatformDetector

**Purpose**: Detect and configure platform-specific behavior

```typescript
class PlatformDetector {
  // Detects current platform (ChatGPT, Claude, Gemini)
  getPlatform(): Platform

  // Returns platform-specific configuration
  getConfig(): PlatformConfig

  // Check if current platform is supported
  isSupported(): boolean
}
```

**Key Features:**
- URL-based platform detection
- Platform-specific CSS selectors
- Context token limits
- Content extraction rules

**Configuration Example:**
```typescript
const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  [Platform.CHATGPT]: {
    platform: Platform.CHATGPT,
    messageSelector: '[data-message-author-role="assistant"]',
    contentSelector: '.markdown',
    maxContextTokens: 128000,
  },
  // ...
};
```

### 2. MessageService

**Purpose**: Scan, analyze, and provide statistics for messages

```typescript
class MessageService {
  // Scan DOM and collect messages
  scanMessages(): Message[]

  // Get conversation statistics
  getConversationStats(): ConversationStats

  // Estimate token usage
  estimateTokens(): TokenEstimation

  // Find closest visible message
  findClosestVisibleMessage(): number
}
```

**Responsibilities:**
- DOM traversal and message extraction
- Character and word counting
- Token estimation
- Viewport calculations

**Data Flow:**
```
DOM → scanMessages() → Message[]
                          ↓
                   getConversationStats()
                          ↓
                   ConversationStats
```

### 3. NavigationService

**Purpose**: Handle navigation between messages

```typescript
class NavigationService {
  // Initialize navigation state
  initialize(): void

  // Navigate to next message
  navigateNext(): void

  // Jump to specific message
  jumpToMessage(index: number): void

  // Get current navigation state
  getState(): NavigationState
}
```

**State Management:**
```typescript
interface NavigationState {
  currentIndex: number;
  direction: NavigationDirection;
  totalMessages: number;
  enabled: boolean;
}
```

**Navigation Flow:**
```
initialize() → scanMessages() → set initial position
                                        ↓
navigateNext() → determine direction → move index
                                        ↓
scrollToCurrentMessage() → smooth scroll → highlight
```

### 4. SearchService

**Purpose**: Search within messages and navigate results

```typescript
class SearchService {
  // Search for term in messages
  search(term: string): SearchResult[]

  // Navigate to next result
  nextResult(): void

  // Get search statistics
  getSearchStats(): SearchStats
}
```

**Search Algorithm:**
1. Convert search term to lowercase (case-insensitive)
2. Scan all messages for matches
3. Count matches per message
4. Generate context previews
5. Return sorted results

### 5. StorageService

**Purpose**: Persist settings via Chrome Storage API

```typescript
class StorageService {
  // Load settings from storage
  loadSettings(): Promise<ExtensionSettings>

  // Save settings to storage
  saveSettings(settings: Partial<ExtensionSettings>): Promise<void>

  // Get current settings (from memory)
  getSettings(): ExtensionSettings

  // Listen for storage changes
  onSettingsChanged(callback: Function): void
}
```

**Storage Strategy:**
- Use `chrome.storage.sync` for cross-device sync
- Cache settings in memory for fast access
- Merge with defaults on load
- Graceful error handling

## Design Patterns

### 1. Singleton Pattern

**Used In**: All services

**Rationale:**
- Single source of truth for application state
- Prevents multiple instances with conflicting state
- Easy to access from anywhere in the code

**Implementation:**
```typescript
private constructor() {} // Prevent external instantiation

public static getInstance(): ServiceName {
  if (!ServiceName.instance) {
    ServiceName.instance = new ServiceName();
  }
  return ServiceName.instance;
}
```

### 2. Service Layer Pattern

**Structure:**
```
UI (Presentation) → Services (Business Logic) → Utils (Helpers)
```

**Benefits:**
- Clear separation of concerns
- Easy to test services in isolation
- Reusable business logic

### 3. Observer Pattern

**Used In**:
- DOM change detection (MutationObserver)
- Settings synchronization (chrome.storage.onChanged)

**Example:**
```typescript
const observer = new MutationObserver((mutations) => {
  // React to DOM changes
  messageService.refresh();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
```

### 4. Strategy Pattern

**Used In**: Platform-specific behavior

**Example:**
```typescript
// Different strategies for different platforms
const config = platformDetector.getConfig();
const elements = document.querySelectorAll(config.messageSelector);
```

### 5. Facade Pattern

**Used In**: Service interfaces simplify complex operations

**Example:**
```typescript
// Complex internal logic hidden behind simple interface
public getConversationStats(): ConversationStats {
  // Internal: count characters, words, estimate tokens
  // Returns: Simple stats object
}
```

## Data Flow

### Initialization Flow

```
Extension Load
      ↓
content.ts executes
      ↓
Initialize Services
      ├→ PlatformDetector.detect()
      ├→ StorageService.loadSettings()
      ├→ MessageService.scanMessages()
      └→ NavigationService.initialize()
      ↓
Attach Event Listeners
      ↓
Ready for User Interaction
```

### Navigation Flow

```
User clicks nav button
         ↓
NavigationService.navigateNext()
         ↓
Determine direction (up/down)
         ↓
Update currentIndex
         ↓
Check boundaries → Switch direction if needed
         ↓
Get message at currentIndex
         ↓
Scroll to message (smooth)
         ↓
Highlight message (800ms)
```

### Search Flow

```
User types in search
         ↓
SearchService.search(term)
         ↓
Get all messages from MessageService
         ↓
For each message:
    ├→ Convert content to lowercase
    ├→ Count matches
    ├→ Generate preview
    └→ Add to results if matches > 0
         ↓
Return sorted results
         ↓
User navigates results
         ↓
ScrollToResult() + Highlight
```

### Settings Flow

```
User changes setting in popup
         ↓
popup.ts calls StorageService.saveSettings()
         ↓
chrome.storage.sync.set()
         ↓
Chrome syncs across devices
         ↓
chrome.storage.onChanged fires
         ↓
content.ts receives update
         ↓
Apply new settings
```

## Platform Integration

### Platform Detection

```typescript
// URL-based detection
const hostname = window.location.hostname;

if (hostname.includes('chatgpt.com')) {
  return Platform.CHATGPT;
} else if (hostname.includes('claude.ai')) {
  return Platform.CLAUDE;
} else if (hostname.includes('gemini.google.com')) {
  return Platform.GEMINI;
}
```

### Platform Configurations

Each platform has unique characteristics:

**ChatGPT:**
- Message selector: `[data-message-author-role="assistant"]`
- Context limit: 128K tokens
- Token ratio: ~4 chars/token

**Claude:**
- Message selector: `.font-claude-message`
- Context limit: 200K tokens
- Token ratio: ~3.5 chars/token

**Gemini:**
- Message selector: `.model-response`
- Context limit: 1M tokens
- Token ratio: ~4 chars/token

### DOM Interaction

```typescript
// Safe DOM querying with fallbacks
private extractContent(element: HTMLElement): string {
  const config = platformDetector.getConfig();

  if (config.contentSelector) {
    const contentElement = element.querySelector(config.contentSelector);
    return contentElement?.innerText.trim() || element.innerText.trim();
  }

  return element.innerText.trim();
}
```

## Extension Lifecycle

### 1. Installation

```
Extension installed
       ↓
chrome.runtime.onInstalled
       ↓
Set default settings
       ↓
Show welcome page (optional)
```

### 2. Page Load

```
Supported page detected
       ↓
Inject content.ts
       ↓
Initialize services
       ↓
Observe DOM for changes
       ↓
Ready for interaction
```

### 3. Runtime

```
User interacts
       ↓
Event handlers fire
       ↓
Services update state
       ↓
UI reflects changes
       ↓
Settings persist to storage
```

### 4. Unload

```
Page navigation/close
       ↓
Cleanup event listeners
       ↓
Save state if needed
       ↓
Disconnect observers
```

## Performance Considerations

### 1. Lazy Initialization

Services initialize only when needed:

```typescript
// Don't scan messages until user needs them
public initialize(): void {
  if (this.messages.length === 0) {
    this.scanMessages();
  }
}
```

### 2. Debouncing

Expensive operations are debounced:

```typescript
const debouncedRefresh = debounce(() => {
  messageService.refresh();
}, 500);

observer.observe(document.body, {
  // Will refresh max once per 500ms
});
```

### 3. Caching

Computed values are cached:

```typescript
private cachedStats: ConversationStats | null = null;

public getConversationStats(): ConversationStats {
  if (this.cachedStats && !this.isDirty) {
    return this.cachedStats;
  }

  this.cachedStats = this.computeStats();
  this.isDirty = false;
  return this.cachedStats;
}
```

### 4. Efficient DOM Queries

```typescript
// Query once, cache results
const messages = document.querySelectorAll(selector);

// Reuse cached elements instead of re-querying
this.assistantMessages = Array.from(messages);
```

## Security

### 1. Content Security Policy

Defined in manifest.json:

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### 2. Input Validation

All user inputs are validated:

```typescript
public setThreshold(value: number): void {
  if (value < 50 || value > 95) {
    throw new Error('Threshold must be between 50 and 95');
  }
  this.threshold = value;
}
```

### 3. Safe DOM Manipulation

```typescript
// Use textContent, not innerHTML
element.textContent = userInput; // Safe from XSS

// Validate elements before use
if (element && element instanceof HTMLElement) {
  // Safe to use
}
```

### 4. Minimal Permissions

Request only necessary permissions in manifest.json:

```json
{
  "permissions": ["storage"],
  "host_permissions": [
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*"
  ]
}
```

## Extension Points

### Adding a New Platform

1. Add to Platform enum in `types/index.ts`
2. Add configuration in `platformDetector.ts`
3. Test message detection
4. Update documentation

### Adding a New Service

1. Create service file in `services/`
2. Implement singleton pattern
3. Define interface in `types/`
4. Write tests in `tests/`
5. Update documentation

### Adding a New Feature

1. Plan the architecture
2. Update types if needed
3. Implement in appropriate service
4. Add tests
5. Update UI if needed
6. Document the feature

## Best Practices

1. **Keep services focused**: One responsibility per service
2. **Use TypeScript strictly**: No `any` types
3. **Write tests first**: TDD when possible
4. **Document complex logic**: JSDoc for public APIs
5. **Handle errors gracefully**: Never crash silently
6. **Validate inputs**: Defensive programming
7. **Optimize performance**: Profile and optimize hot paths
8. **Maintain security**: Validate, sanitize, minimize permissions
9. **Keep dependencies minimal**: Avoid unnecessary libraries
10. **Follow existing patterns**: Consistency is key

## Future Improvements

### Planned Architecture Changes

1. **Event Bus**: Centralized event system for service communication
2. **State Management**: Consider lightweight state management library
3. **Modular UI**: Component-based UI system
4. **Plugin System**: Allow third-party extensions
5. **Web Worker**: Offload heavy computations
6. **IndexedDB**: Store conversation history locally

### Performance Optimizations

1. Virtual scrolling for long conversations
2. Web Workers for token estimation
3. Request Animation Frame for smooth animations
4. Intersection Observer for lazy loading

## Resources

- [Chrome Extension Architecture](https://developer.chrome.com/docs/extensions/mv3/architecture-overview/)
- [TypeScript Design Patterns](https://www.typescriptlang.org/docs/handbook/2/classes.html)
- [Performance Best Practices](https://web.dev/fast/)
- [Security Best Practices](https://developer.chrome.com/docs/extensions/mv3/security/)

## Contact

For architecture questions or suggestions:

- **Email**: [yosefisabag@gmail.com](mailto:yosefisabag@gmail.com)
- **LinkedIn**: [Yosef Hayim Sabag](https://www.linkedin.com/in/yosef-hayim-sabag/)

---

**Last Updated**: 2025-01-16

This architecture is designed to be scalable, maintainable, and performant while keeping the codebase simple and easy to understand.
