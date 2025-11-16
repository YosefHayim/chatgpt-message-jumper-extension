#!/bin/bash

# Build script for Firefox extension

echo "🦊 Building Firefox extension..."

# Clean previous build
echo "Cleaning previous Firefox build..."
rm -rf dist-firefox
rm -f ai-conversation-navigator-firefox.zip

# Copy dist to firefox build
echo "Copying dist to Firefox build directory..."
cp -r dist dist-firefox

# Update manifest for Firefox
echo "Updating manifest for Firefox..."
node scripts/update-firefox-manifest.js

# Create zip
echo "Creating ZIP archive..."
cd dist-firefox
zip -r ../ai-conversation-navigator-firefox.zip .
cd ..

echo "✅ Firefox build created: ai-conversation-navigator-firefox.zip"
echo "📦 Size: $(du -h ai-conversation-navigator-firefox.zip | cut -f1)"
