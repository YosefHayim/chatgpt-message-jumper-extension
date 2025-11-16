# Release Notes

All notable changes to the AI Conversation Navigator extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Publication guide for Chrome Web Store, Firefox Add-ons, and Microsoft Edge
- Build scripts for Chrome and Firefox-specific builds
- CI/CD workflow with automated testing and coverage requirements

---

## [2.0.0] - 2025-11-16

This is a major release with significant new features for power users who frequently interact with LLMs.

### Added

#### Power User Features
- **Bookmark System with Custom Tags** 🔖
  - Bookmark important AI responses with hover button
  - Add custom tags (e.g., "working code", "good explanation")
  - Bookmarks panel showing all saved messages
  - Quick jump navigation to bookmarked responses
  - Persistent storage across browser sessions
  - New service: `src/services/bookmarkService.ts`

- **Code-Only Filter** 💻
  - Filter conversations to show only AI responses containing code
  - Toggle button in actions panel
  - Real-time count of code responses
  - Preserves navigation state when filtering

- **Conversation Tracking** 📊
  - Track total conversations across all platforms
  - Display "This week" and "This month" statistics
  - Platform-specific tracking (ChatGPT, Claude, Gemini)
  - Automatic cleanup of data older than 6 months
  - New service: `src/services/conversationTrackerService.ts`

- **Re-ask with Different Platform** 🔄
  - Copy user messages to compare responses across AI platforms
  - Options: Copy last message or all user messages
  - Quick links to open ChatGPT, Claude, or Gemini
  - Shows current platform for context
  - Facilitates A/B testing between different AI models

#### Quick Win Features
- **Jump to First/Last Message** ⬆️⬇️
  - Instant navigation to conversation endpoints
  - Keyboard-friendly quick access

- **Copy All AI Responses** 📋
  - Single click to copy all AI responses
  - Formatted with separators for easy parsing

- **Export to Markdown** 💾
  - Export entire conversation to Markdown file
  - Includes metadata (date, stats, platform)
  - Well-formatted for documentation

- **Collapse Long Messages** 📏
  - Toggle to collapse messages over 1000 characters
  - "Show more" indicator on collapsed messages
  - Click to expand individual messages
  - Better scanning of long conversations

- **Message Count in Title** 📊
  - Page title shows message count: "ChatGPT (45 messages)"
  - Helps track conversation length at a glance

#### Search Enhancements
- **AI-Only Search** 🔍
  - Custom search panel (Ctrl+F) that only searches AI responses
  - Prevents searching entire page including UI elements
  - Real-time result count
  - Navigate results with Enter/Shift+Enter
  - Shows match statistics

#### Contact & Support
- **Professional Contact Icons** 📧
  - Email, GitHub Issues, and LinkedIn icons in popup
  - Hover effects and professional styling
  - Easy access to support channels

### Changed
- Enhanced stats panel with conversation activity tracking
- Improved messageService with `getAllMessages()` method
- Updated UI with 8 new action buttons
- Better visual hierarchy in stats display

### Technical Improvements
- Added `bookmarkService` singleton for bookmark management
- Added `conversationTrackerService` for usage analytics
- Enhanced message detection for user vs. assistant messages
- Improved service layer architecture
- Better separation of concerns

---

## [1.2.0] - 2025-11-16

### Added
- **Comprehensive Documentation** 📚
  - CONTRIBUTING.md with contribution guidelines
  - CODE_OF_CONDUCT.md for community standards
  - TESTING.md with testing best practices
  - ARCHITECTURE.md with system design documentation
  - SUPPORT.md with user support guide

### Tests
- **Extensive Test Coverage** ✅
  - 1000+ lines of test code added
  - navigationService.test.ts (200+ lines)
  - messageService.test.ts (400+ lines)
  - searchService.test.ts (400+ lines)
  - storageService.test.ts (400+ lines)
  - 70%+ overall coverage
  - 80%+ service coverage

### Fixed
- Contact information integration
- Popup HTML path issue (was using root instead of assets/)

---

## [1.1.0] - 2025-11-16

### Added
- **Search Service** 🔍
  - Search within individual messages
  - Case-insensitive search with regex support
  - Match counting and preview generation
  - Navigate through search results
  - Search statistics (total results, matches)

### Fixed
- **DOM Interaction Blocking** 🐛
  - Resolved issue where extension UI blocked page interactions
  - Improved pointer-events handling
  - Better z-index management

### Documentation
- Quick start guide
- Build verification script
- Comprehensive rebuild instructions for users

---

## [1.0.0] - 2025-11-16

Initial release - Complete TypeScript rewrite from scratch.

### Added

#### Core Features
- **Smart Navigation** 🧭
  - Navigate between AI responses with visual indicators
  - Auto-direction switching at conversation endpoints
  - Position tracking (current/total)
  - Smooth scrolling to messages

- **Platform Support** 🌐
  - ChatGPT (OpenAI)
  - Claude (Anthropic)
  - Gemini (Google)
  - Extensible platform detection system

- **Conversation Analytics** 📊
  - Real-time message counting
  - Character and word counting
  - Token estimation (4 chars ≈ 1 token)
  - Stats panel with formatted numbers
  - Context warning system

- **Modern UI** 🎨
  - Glass morphism design
  - Floating action button with gradient
  - Non-intrusive positioning
  - Smooth animations
  - Responsive stats panel

#### Architecture
- **TypeScript** with strict mode
- **Service Layer Pattern**
  - platformDetector - Platform detection
  - messageService - Message management
  - navigationService - Navigation logic
  - searchService - Search functionality
  - storageService - Settings persistence
- **esbuild** bundler for fast builds
- **Jest** testing framework

#### Build System
- Modern npm scripts
- Hot reload in development
- Production-ready builds
- Asset copying automation

### Technical
- ES6 modules with tree shaking
- Chrome storage API integration
- MutationObserver for DOM changes
- Debounced refresh for performance
- Memory-efficient message caching

---

## [0.x.x] - 2025-10-29 to 2025-10-30

### Initial Development
- Proof of concept
- Basic message detection
- Simple navigation prototype
- Early platform support experiments

---

## Version History Summary

| Version | Date | Key Features |
|---------|------|--------------|
| 2.0.0 | 2025-11-16 | Bookmarks, Code Filter, Conversation Tracking, Re-ask, Quick Wins |
| 1.2.0 | 2025-11-16 | Documentation & Comprehensive Test Coverage |
| 1.1.0 | 2025-11-16 | Search Service & Bug Fixes |
| 1.0.0 | 2025-11-16 | Initial TypeScript Release |
| 0.x.x | 2025-10-29 | Prototype & POC |

---

## Upgrade Guide

### From 1.x.x to 2.0.0

New features are automatically available. No breaking changes.

**New keyboard shortcuts:**
- `Ctrl+F` - Custom search (AI responses only)
- `Escape` - Close search/bookmarks panels

**New actions available:**
- Bookmark any AI response with custom tags
- Filter to show code-only responses
- View conversation statistics (week/month)
- Re-ask questions on different platforms
- Quick export and copy functions

**Storage:**
- Bookmarks are stored locally using Chrome storage API
- Conversation history tracked automatically
- All data remains on your device

### From 0.x.x to 1.0.0

Complete rewrite. Recommended to:
1. Uninstall old version
2. Install new version
3. Reconfigure settings in popup

---

## Upcoming Features

See our [GitHub Issues](https://github.com/YosefHayim/ai-extension-conversation-navigator/issues) for planned features and improvements.

**Potential future additions:**
- Custom keyboard shortcuts
- Conversation templates
- Export to multiple formats (PDF, TXT, JSON)
- Conversation comparison side-by-side
- AI response rating system
- Advanced filtering (by date, length, tags)
- Conversation search across sessions
- Browser sync for bookmarks and settings

---

## Support

For bug reports, feature requests, or support:

- 📧 **Email:** yosefisabag@gmail.com
- 🐛 **GitHub Issues:** https://github.com/YosefHayim/ai-extension-conversation-navigator/issues
- 💼 **LinkedIn:** https://www.linkedin.com/in/yosef-hayim-sabag/

---

## Contributors

- **YosefHayim** - Creator and Lead Developer

## License

MIT License - see [LICENSE](LICENSE) file for details

---

**Thank you for using AI Conversation Navigator! 🚀**
