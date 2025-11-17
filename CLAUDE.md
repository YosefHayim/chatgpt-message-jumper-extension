# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Conversation Navigator is a Chrome extension built with TypeScript that provides advanced navigation, analytics, and search functionality for AI conversations across ChatGPT, Claude, and Gemini platforms. The extension uses vanilla TypeScript (no React framework) with esbuild for bundling.

## Development Commands

### Building
```bash
# Clean build (removes dist and .zip files)
npm run clean

# Development build with watch mode (rebuilds on file changes)
npm run dev

# Production build (bundles and copies assets)
npm run build

# Build browser-specific versions
npm run build:chrome
npm run build:firefox
npm run build:all
```

### Testing
```bash
# Run all tests once
npm test

# Watch mode for TDD
npm run test:watch

# Coverage report (95% threshold required)
npm run test:coverage
```

### Loading Extension in Chrome
1. Run `npm run build`
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select `dist/` directory

## Architecture Overview

### Service Layer Pattern
All core functionality is encapsulated in singleton service classes located in `src/services/`. Each service manages a specific domain:

- **PlatformDetector** (`platformDetector.ts`): Detects which AI platform (ChatGPT/Claude/Gemini) by URL and provides platform-specific selectors and configuration
- **MessageService** (`messageService.ts`): Scans DOM for messages, calculates statistics, and estimates token usage
- **NavigationService** (`navigationService.ts`): Manages navigation state and controls jumping between messages
- **SearchService** (`searchService.ts`): Implements message-level search with match counting
- **BookmarkService** (`bookmarkService.ts`): Handles conversation bookmarking functionality
- **ConversationTrackerService** (`conversationTrackerService.ts`): Tracks conversation history and state
- **StorageService** (`storageService.ts`): Wrapper around Chrome Storage API for settings persistence

All services follow the singleton pattern: use `ServiceName.getInstance()` to access them.

### Entry Points
- **`src/content.ts`**: Main content script, creates `AIConversationNavigator` class which orchestrates all services and UI
- **`src/popup.ts`**: Extension popup for settings management

### Platform Detection Strategy
The extension uses a strategy pattern for platform-specific behavior. Each platform has a `PlatformConfig` with:
- Message selectors (different DOM structures per platform)
- Context token limits (128K for ChatGPT, 200K for Claude, 1M for Gemini)
- Optional role attributes and content selectors

When adding platform support, update `PLATFORM_CONFIGS` in `src/services/platformDetector.ts`.

### DOM Interaction Pattern
The extension heavily relies on MutationObserver to detect new messages and DOM changes. The `AIConversationNavigator` class in `content.ts` sets up observers to:
- Re-scan messages when new content appears
- Update statistics in real-time
- Maintain navigation state

### Type System
All shared types are defined in `src/types/index.ts`, including:
- `Platform` enum for AI platforms
- `Message` interface for parsed messages
- `ConversationStats` for analytics
- `PlatformConfig` for platform-specific settings
- `ExtensionSettings` for user preferences

## Key Implementation Details

### Token Estimation
Token estimation uses platform-specific heuristics in `src/utils/tokenEstimator.ts`:
- Characters / 4 (approximate tokens per character ratio)
- Compares against platform's max context tokens
- Provides percentage calculations and warnings

### Message Scanning
Messages are scanned using platform-specific CSS selectors. The `MessageService`:
1. Queries DOM using `PlatformDetector.getConfig().messageSelector`
2. Extracts content and role from each message element
3. Calculates character/word counts
4. Stores references to DOM elements for navigation

### Navigation Logic
Navigation maintains a `currentIndex` and `direction` state. When navigating:
1. Checks bounds (top/bottom of conversation)
2. Automatically reverses direction at boundaries
3. Scrolls to element with smooth behavior
4. Temporarily highlights target message

## Testing Strategy

- **Coverage target**: 95% for all metrics (branches, functions, lines, statements)
- **Service layer**: Extra strict 95% coverage required
- **Test environment**: jsdom with ts-jest
- **Setup**: Global test setup in `tests/setup.ts`
- Module path aliasing: Use `~/src/...` imports (mapped via jest.config.js)

### Running Specific Tests
```bash
# Single test file
npm test -- platformDetector.test.ts

# Test pattern
npm test -- --testNamePattern="should detect ChatGPT"

# Watch specific file
npm test -- --watch navigationService.test.ts
```

## Build System

### esbuild Configuration
The project uses esbuild (not Plasmo or webpack) for bundling:
- Two entry points: `src/content.ts` and `src/popup.ts`
- Output format: IIFE (Immediately Invoked Function Expression)
- Target: Chrome 90+
- Bundle mode: Bundles all dependencies into single files

### Asset Pipeline
```bash
npm run copy-assets
```
Copies static assets (icons, manifest, HTML, CSS) to `dist/` using cpy-cli.

### Build Scripts
- `scripts/build-chrome.sh`: Creates Chrome-specific build
- `scripts/build-firefox.sh`: Creates Firefox-specific build (updates manifest for MV2)
- `scripts/update-firefox-manifest.js`: Converts manifest from MV3 to MV2

## TypeScript Configuration

- **Strict mode**: Enabled with all strict checks
- **Target**: ES2020 with DOM libraries
- **Module resolution**: Node with esModuleInterop
- **Unused checks**: Enforced (noUnusedLocals, noUnusedParameters)
- **Return checks**: Required (noImplicitReturns, noFallthroughCasesInSwitch)
- **Path aliases**: `~/*` maps to project root

## Common Gotchas

### Platform-Specific Selectors
When debugging message detection issues, check if the platform's DOM structure has changed. Use browser DevTools to inspect message elements and update selectors in `PLATFORM_CONFIGS`.

### Service Initialization Order
Services must be initialized in this order:
1. PlatformDetector (detects platform)
2. StorageService (loads settings)
3. MessageService (scans messages)
4. NavigationService (initializes navigation state)

This order is enforced in `AIConversationNavigator.initialize()`.

### Chrome Extension Permissions
The extension requires:
- `activeTab`: For accessing page content
- `scripting`: For injecting content scripts
- `storage`: For persisting settings
- `host_permissions`: Specific to ChatGPT domain in manifest

### MutationObserver Memory Leaks
The extension creates MutationObservers in `content.ts`. Always call `observer.disconnect()` in the cleanup method to prevent memory leaks when the extension is disabled or page changes.

## Debugging

### Logger Utility
Use the logger service from `src/utils/logger.ts`:
```typescript
import logger from './utils/logger';

logger.info('ServiceName', 'Message', { optional: 'data' });
logger.debug('ServiceName', 'Debug info');
logger.warn('ServiceName', 'Warning', { error });
logger.error('ServiceName', 'Error', { error });
```

Logger output includes timestamps, service names, and structured data.

### Common Debug Points
- Check if platform is detected: `platformDetector.getPlatform()`
- Verify messages found: `messageService.getMessages().length`
- Check navigation state: `navigationService.getPositionInfo()`
- Inspect settings: `await storageService.loadSettings()`
