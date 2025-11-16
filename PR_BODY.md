# Release v2.0.0 - Power User Features, Documentation, and CI/CD

This PR merges all the new features, documentation, and infrastructure improvements into main for the v2.0.0 release.

## 🎉 New Features

### Power User Features

- **🔖 Bookmark System with Custom Tags**
  - Hover over any AI response to bookmark it
  - Add custom tags like "working code" or "good explanation"
  - View all bookmarks in dedicated panel
  - Quick jump to bookmarked messages
  - Persistent storage across sessions

- **💻 Code-Only Filter**
  - Toggle to show only AI responses containing code
  - Visual feedback with response count
  - Perfect for developers looking for code snippets

- **📊 Conversation Tracking**
  - Track conversations per week and month
  - Platform-specific tracking (ChatGPT, Claude, Gemini)
  - Automatic cleanup of old data (6+ months)
  - Stats displayed in the stats panel

- **🔄 Re-ask with Different Platform**
  - Copy user messages to re-ask on different AI platforms
  - Quick links to ChatGPT, Claude, and Gemini
  - Compare responses across different AI models

### Quick Win Features

- **⬆️⬇️ Jump to First/Last** - Instant navigation to conversation endpoints
- **📋 Copy All AI Responses** - Single click to copy all responses
- **💾 Export to Markdown** - Export conversations with metadata
- **📏 Collapse Long Messages** - Toggle for messages over 1000 characters
- **🔍 AI-Only Search** - Custom search (Ctrl+F) for AI responses only
- **📧 Contact Icons** - Professional contact links in popup

## 📚 Documentation

### Publishing Guide
- Complete guide for publishing to Chrome Web Store
- Firefox Add-ons submission process
- Microsoft Edge Add-ons instructions
- Browser compatibility matrix (Chrome, Firefox, Edge, Brave, Opera)
- Pre and post-publication checklists

### Release Notes
- Comprehensive version history from v0.x to v2.0.0
- Detailed changelog for each release
- Upgrade guides between versions
- Future roadmap

## 🚀 CI/CD Infrastructure

### GitHub Actions Workflows

1. **CI/CD Pipeline**
   - Automated testing on Node.js 18.x and 20.x
   - **90% coverage enforcement** for functions/lines/statements
   - Build verification on every PR
   - Automatic Chrome and Firefox package builds
   - Codecov integration
   - PR coverage comments

2. **Release Workflow**
   - Triggers on version tags (v*.*.*)
   - Builds both Chrome and Firefox packages
   - Generates changelog automatically
   - Creates GitHub releases with artifacts

3. **Scheduled Tests**
   - Daily test runs at 00:00 UTC
   - Security audits with npm audit
   - Dependency checks
   - Auto-creates issues on failures

4. **Dependabot**
   - Weekly dependency updates
   - Auto-assigns PRs to maintainer

## 🔧 Build Scripts

- `npm run build:chrome` - Build Chrome/Edge package
- `npm run build:firefox` - Build Firefox package
- `npm run build:all` - Build all packages
- `scripts/build-chrome.sh` - Chrome/Edge build automation
- `scripts/build-firefox.sh` - Firefox build with manifest transformation

## 📊 Test Coverage

Updated coverage thresholds:
- **Global:** 90% functions/lines/statements, 80% branches
- **Services:** 95% functions/lines/statements, 85% branches

## 📁 Files Changed

**New Files:**
- `.github/workflows/ci.yml` - CI/CD pipeline
- `.github/workflows/release.yml` - Release automation
- `.github/workflows/scheduled-tests.yml` - Daily tests and audits
- `.github/dependabot.yml` - Dependency updates
- `.github/README.md` - CI/CD documentation
- `docs/guide-to-publish-extension.md` - Publishing guide
- `RELEASES.md` - Complete release history
- `scripts/build-chrome.sh` - Chrome build script
- `scripts/build-firefox.sh` - Firefox build script
- `scripts/update-firefox-manifest.js` - Manifest transformer
- `src/services/bookmarkService.ts` - Bookmark management
- `src/services/conversationTrackerService.ts` - Conversation tracking

**Modified Files:**
- `src/content.ts` - Added all new features (+936 lines)
- `src/services/messageService.ts` - Added getAllMessages() method
- `package.json` - New build scripts
- `jest.config.js` - 90% coverage thresholds

## 🎯 Stats

- **16 files changed**
- **3,227 additions**
- **2 new services created**
- **10+ new features added**
- **3 automated workflows**
- **90% test coverage enforced**

## ✅ Pre-Merge Checklist

- [x] All commits are clean and well-documented
- [x] Build completes successfully
- [x] All new features tested manually
- [x] Documentation is comprehensive
- [x] CI/CD pipelines configured
- [x] Coverage thresholds updated
- [x] Build scripts tested

## 🚢 Post-Merge Actions

After merging:
1. Create release tag: `git tag v2.0.0 && git push origin v2.0.0`
2. GitHub Actions will automatically create release
3. Download Chrome and Firefox packages from release
4. Upload to Chrome Web Store
5. Upload to Firefox Add-ons
6. Upload to Microsoft Edge Add-ons

## 📖 Related Documentation

- [Publishing Guide](docs/guide-to-publish-extension.md)
- [Release Notes](RELEASES.md)
- [CI/CD Documentation](.github/README.md)

---

**Ready to merge! 🚀**
