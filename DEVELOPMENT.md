# Development Guide

## Quick Start

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Development mode (watch for changes)
npm run dev
```

## Loading the Extension in Chrome

1. Build the extension: `npm run build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `dist/` directory

## Project Structure

```
chatgpt-message-jumper-extension/
├── src/                    # TypeScript source code
│   ├── types/             # Type definitions
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   ├── content.ts         # Content script entry point
│   └── popup.ts           # Popup script entry point
├── assets/                # Static assets
│   ├── manifest.json      # Extension manifest
│   ├── popup.html         # Popup HTML
│   ├── popup.css          # Popup styles
│   └── styles.css         # Content script styles
├── icons/                 # Extension icons
├── tests/                 # Test files
├── dist/                  # Build output (generated)
└── old_version/           # Original vanilla JS version
```

## Development Workflow

### Making Changes

1. Edit TypeScript files in `src/`
2. Run `npm run build` to compile
3. Reload extension in Chrome (`chrome://extensions/` → click reload icon)
4. Test changes on ChatGPT/Claude/Gemini

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

### Adding New Features

1. Define types in `src/types/index.ts`
2. Create service in `src/services/`
3. Add tests in `tests/`
4. Update content script or popup as needed
5. Build and test

## Architecture

### Service Layer

All core functionality is organized into services:

- **PlatformDetector**: Detects which AI platform (ChatGPT/Claude/Gemini)
- **MessageService**: Scans and analyzes messages
- **NavigationService**: Handles message navigation
- **SearchService**: Enhanced search functionality
- **StorageService**: Chrome storage API wrapper

### Singleton Pattern

Services use the singleton pattern for state management:

```typescript
const detector = PlatformDetector.getInstance();
```

### Type Safety

Strict TypeScript configuration ensures type safety:

```typescript
// tsconfig.json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true
}
```

## Adding Support for New Platforms

1. Add platform to `Platform` enum in `src/types/index.ts`:
```typescript
export enum Platform {
  CHATGPT = 'chatgpt',
  CLAUDE = 'claude',
  GEMINI = 'gemini',
  NEW_PLATFORM = 'new_platform',
}
```

2. Add configuration in `src/services/platformDetector.ts`:
```typescript
const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  [Platform.NEW_PLATFORM]: {
    name: 'New Platform',
    platform: Platform.NEW_PLATFORM,
    messageSelector: '.message-selector',
    maxContextTokens: 100000,
  },
  // ...
};
```

3. Add hostname detection:
```typescript
private detectPlatform(): void {
  if (hostname.includes('newplatform.com')) {
    this.currentPlatform = Platform.NEW_PLATFORM;
  }
  // ...
}
```

4. Update manifest permissions:
```json
{
  "host_permissions": [
    "https://newplatform.com/*"
  ]
}
```

## Code Style

- Use Prettier for formatting
- Follow TypeScript strict mode
- Use functional programming where possible
- Prefer const over let
- Use descriptive variable names
- Add JSDoc comments for public APIs

## Common Issues

### Build Errors

If you encounter build errors:

```bash
# Clean and rebuild
npm run clean
npm run build
```

### Extension Not Loading

1. Check console for errors in `chrome://extensions/`
2. Verify manifest.json is valid
3. Ensure all files are in dist/
4. Try removing and re-adding the extension

### TypeScript Errors

```bash
# Check for errors
npx tsc --noEmit

# Fix automatically where possible
npx prettier --write src/**/*.ts
```

## Debugging

### Content Script

1. Open ChatGPT/Claude/Gemini
2. Open DevTools (F12)
3. Check Console for errors
4. Use `debugger;` statements in code

### Popup

1. Right-click extension icon
2. Select "Inspect popup"
3. Debug in popup DevTools

### Background Script

(Not used in this extension, but for future reference)

1. Go to `chrome://extensions/`
2. Click "Inspect views: background page"

## Performance

- Services use singleton pattern (created once)
- DOM queries are cached where possible
- MutationObserver throttling for DOM changes
- Lazy loading of stats panel

## Security

- No external API calls
- No data sent to servers
- All data stored locally (Chrome Storage API)
- CSP-compliant code (no eval, inline scripts)

## Building for Production

```bash
# Clean build
npm run clean
npm run build

# The dist/ folder contains the production-ready extension
```

## Publishing

1. Update version in `package.json` and `assets/manifest.json`
2. Run `npm run build`
3. Zip the `dist/` folder
4. Upload to Chrome Web Store

## License

MIT - see LICENSE file
