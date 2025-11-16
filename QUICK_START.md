# Quick Start Guide

## 🚨 First Time Setup (IMPORTANT!)

If you just cloned or pulled this repository, the `dist/` folder **doesn't exist yet** because it's gitignored. You must build it first!

### Step 1: Install Dependencies

```bash
cd /Applications/Github/chatgpt-message-jumper-extension
npm install
```

This will install all required packages (~356 packages).

### Step 2: Build the Extension

```bash
npm run build
```

This creates the `dist/` folder with all **bundled** files:
- ✅ manifest.json
- ✅ content.js (bundled TypeScript - all imports resolved into single file)
- ✅ popup.js (bundled TypeScript - all imports resolved into single file)
- ✅ popup.html
- ✅ styles.css
- ✅ icons/

**Note:** The build process uses **esbuild** to bundle all TypeScript modules into single JavaScript files that Chrome can execute directly.

### Step 3: Load in Chrome

1. Open Chrome
2. Navigate to `chrome://extensions/`
3. Enable **"Developer mode"** (toggle in top-right)
4. Click **"Load unpacked"**
5. Select the **`dist/`** folder at:
   ```
   /Applications/Github/chatgpt-message-jumper-extension/dist
   ```

## ✅ Verification

After loading, you should see:
- Extension name: **"AI Conversation Navigator"**
- Version: **2.0.0**
- No errors in the extension card

## 🔧 Common Issues

### Error: "Manifest file is missing or unreadable"
**Cause:** You haven't built the extension yet
**Fix:** Run `npm run build`

### Error: "Cannot find module..."
**Cause:** Dependencies not installed
**Fix:** Run `npm install`

### Extension loads but doesn't work
**Cause:** Old build or cached files
**Fix:**
```bash
npm run clean
npm run build
```
Then reload the extension in Chrome.

## 🎯 Quick Commands

```bash
# Build for production
npm run build

# Build and watch for changes (development)
npm run dev

# Clean build artifacts
npm run clean

# Run tests
npm test
```

## 📝 What Gets Built?

The build process:
1. Compiles TypeScript (`src/*.ts` → `dist/*.js`)
2. Copies assets (manifest, HTML, CSS, icons)
3. Generates source maps for debugging

## 🚀 You're Ready!

Once built, open ChatGPT, Claude, or Gemini and you'll see the navigation button in the bottom-right corner!
