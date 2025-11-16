# AI Conversation Navigator 🚀

A professional-grade Chrome extension built with TypeScript and React that provides advanced navigation and analytics for AI conversations across ChatGPT, Claude, and Gemini.

## ✨ Features

### 🎯 Core Navigation
- **Smart Message Navigation**: Jump between AI responses with intelligent direction control
- **Visual Feedback**: Smooth scrolling with temporary message highlighting
- **Auto-positioning**: Automatically detects and starts from the closest visible message
- **Multi-platform Support**: Works seamlessly on ChatGPT, Claude, and Gemini

### 📊 Analytics & Statistics
- **Message Counter**: Real-time count of total messages in conversation
- **Character Counting**: Track total characters across all messages
- **Token Estimation**: Approximate token usage with platform-specific calculations
- **Context Warning**: Visual alerts when approaching model context limits
- **Conversation Stats Panel**: Live statistics overlay with key metrics

### 🔍 Enhanced Search
- **Message-level Search**: Search within individual AI responses (not entire DOM)
- **Smart Result Navigation**: Jump between search results across messages
- **Match Counting**: See total matches per message
- **Context Previews**: View snippet previews of search matches

### ⚙️ Customization
- **Theme Support**: Dark, light, and auto themes
- **Configurable Warnings**: Adjustable token warning thresholds (50-95%)
- **Toggle Stats Display**: Show/hide statistics panel
- **Enable/Disable Controls**: Quick toggle from popup

## 🏗️ Architecture

### Tech Stack
- **Framework**: [Plasmo](https://www.plasmo.com/) - Modern Chrome extension framework
- **Language**: TypeScript (strict mode)
- **UI**: React 18 with hooks
- **Testing**: Jest + Testing Library
- **Build**: Plasmo build system with HMR

### Project Structure
```
src/
├── types/                 # TypeScript type definitions
│   └── index.ts          # Core types and interfaces
├── services/             # Business logic layer
│   ├── platformDetector.ts    # Platform detection (ChatGPT/Claude/Gemini)
│   ├── messageService.ts      # Message scanning and analysis
│   ├── navigationService.ts   # Navigation state and control
│   ├── searchService.ts       # Enhanced search functionality
│   └── storageService.ts      # Chrome storage API wrapper
├── utils/                # Utility functions
│   └── tokenEstimator.ts # Token estimation algorithms
├── contents/             # Content scripts
│   └── main.tsx          # Main content script with UI
└── popup.tsx             # Extension popup React component

tests/                    # Test suite
├── setup.ts             # Test environment configuration
├── platformDetector.test.ts
└── tokenEstimator.test.ts
```

### Design Patterns
- **Singleton Pattern**: All services use singleton instances for state management
- **Service Layer Architecture**: Clear separation between UI and business logic
- **Observer Pattern**: MutationObserver for DOM change detection
- **Strategy Pattern**: Platform-specific message selectors

## 🚀 Development

### Prerequisites
- Node.js 18+ and npm 8+
- Chrome/Chromium-based browser

### Setup
```bash
# Install dependencies
npm install

# Start development server with HMR
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Package extension
npm run package
```

### Loading in Chrome
1. Run `npm run dev`
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `build/chrome-mv3-dev` directory

### Testing
```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm test -- --coverage
```

## 📦 Installation

### From Source
1. Clone the repository:
   ```bash
   git clone https://github.com/YosefHayim/chatgpt-message-jumper-extension.git
   cd chatgpt-message-jumper-extension
   ```

2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```

3. Load in Chrome:
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `build/chrome-mv3-prod` directory

## 🎯 Usage

### Navigation
1. Open any conversation on ChatGPT, Claude, or Gemini
2. The navigation button appears in the bottom-right corner
3. Click to jump between AI responses
4. Direction automatically switches at conversation boundaries

### Statistics Panel
- View real-time conversation metrics
- Monitor token usage and context consumption
- Track message count and character totals

### Settings
1. Click the extension icon in the toolbar
2. Configure preferences:
   - Enable/disable extension
   - Choose theme (dark/light/auto)
   - Toggle statistics display
   - Set token warning threshold

### Search (Ctrl+F)
1. Use browser's Ctrl+F (Cmd+F on Mac)
2. Search within individual AI responses
3. Navigate between matches across messages

## 🔧 Configuration

### Default Settings
```typescript
{
  enabled: true,
  theme: 'dark',
  showStats: true,
  showTokenWarning: true,
  tokenWarningThreshold: 80  // Warn at 80% context usage
}
```

### Platform Context Limits
- **ChatGPT (GPT-4 Turbo)**: 128,000 tokens
- **Claude 3**: 200,000 tokens
- **Gemini 1.5 Pro**: 1,000,000 tokens

## 🧪 Testing Coverage

- Platform detection across all supported sites
- Token estimation accuracy
- Navigation state management
- Storage service persistence
- Utility function edge cases

Target coverage: 70%+ across all metrics

## 📝 API Reference

### Services

#### PlatformDetector
```typescript
const detector = PlatformDetector.getInstance();
detector.getPlatform();     // Returns: Platform enum
detector.getConfig();       // Returns: PlatformConfig
detector.isSupported();     // Returns: boolean
```

#### MessageService
```typescript
const messageService = MessageService.getInstance();
messageService.scanMessages();           // Scan and collect messages
messageService.getConversationStats();   // Get analytics
messageService.estimateTokens();         // Token estimation
```

#### NavigationService
```typescript
const navService = NavigationService.getInstance();
navService.initialize();        // Initialize navigation
navService.navigateNext();      // Jump to next message
navService.getPositionInfo();   // Get current position
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with tests
4. Ensure tests pass: `npm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style
- TypeScript strict mode enabled
- Prettier for formatting
- ESLint for linting
- Follow existing patterns

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [Plasmo](https://www.plasmo.com/)
- Icons and design inspired by modern web standards
- Community feedback and contributions

## 📧 Contact

**Author**: YosefHayim
**Repository**: [GitHub](https://github.com/YosefHayim/chatgpt-message-jumper-extension)

## 🗺️ Roadmap

- [ ] Firefox support
- [ ] Keyboard shortcuts customization
- [ ] Export conversation statistics
- [ ] Custom message filters
- [ ] Conversation bookmarking
- [ ] Multi-language support

---

**Version**: 2.0.0
**Last Updated**: 2025-01-16
**Status**: Active Development
