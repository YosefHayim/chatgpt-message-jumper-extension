#!/bin/bash

# Build script for Chrome/Edge extension

echo "🌐 Building Chrome/Edge extension..."

# Clean previous build
echo "Cleaning previous Chrome build..."
rm -f ai-conversation-navigator-chrome.zip

# Build the extension
echo "Running build..."
npm run build

# Create zip
echo "Creating ZIP archive..."
cd dist
zip -r ../ai-conversation-navigator-chrome.zip .
cd ..

echo "✅ Chrome/Edge build created: ai-conversation-navigator-chrome.zip"
echo "📦 Size: $(du -h ai-conversation-navigator-chrome.zip | cut -f1)"
echo ""
echo "This ZIP can be uploaded to:"
echo "  - Chrome Web Store"
echo "  - Microsoft Edge Add-ons"
echo "  - Works on Brave, Opera, Vivaldi, and other Chromium browsers"
