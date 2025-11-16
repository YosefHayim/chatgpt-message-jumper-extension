#!/bin/bash

# Extension Build Verification Script
# Checks if the extension is properly built and ready to load

echo "🔍 Verifying AI Conversation Navigator Build..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ dist/ folder not found${NC}"
    echo "   Run: npm run build"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ dist/ folder exists${NC}"
fi

# Check required files
REQUIRED_FILES=(
    "dist/manifest.json"
    "dist/content.js"
    "dist/popup.js"
    "dist/popup.html"
    "dist/popup.css"
    "dist/styles.css"
    "dist/icons/icon16.png"
    "dist/icons/icon48.png"
    "dist/icons/icon128.png"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing: $file${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✅ $file${NC}"
    fi
done

# Validate manifest.json
if [ -f "dist/manifest.json" ]; then
    if node -e "JSON.parse(require('fs').readFileSync('dist/manifest.json', 'utf8'))" 2>/dev/null; then
        echo -e "${GREEN}✅ manifest.json is valid JSON${NC}"
    else
        echo -e "${RED}❌ manifest.json has invalid JSON${NC}"
        ERRORS=$((ERRORS + 1))
    fi
fi

# Check file sizes
if [ -f "dist/content.js" ]; then
    SIZE=$(wc -c < "dist/content.js")
    if [ $SIZE -lt 100 ]; then
        echo -e "${YELLOW}⚠️  Warning: content.js is very small ($SIZE bytes)${NC}"
    fi
fi

echo ""
echo "================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Extension is ready to load!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Open Chrome and go to chrome://extensions/"
    echo "2. Enable 'Developer mode'"
    echo "3. Click 'Load unpacked'"
    echo "4. Select the 'dist/' folder"
else
    echo -e "${RED}❌ Found $ERRORS error(s)${NC}"
    echo ""
    echo "To fix:"
    echo "1. Run: npm install"
    echo "2. Run: npm run build"
    echo "3. Run this script again"
fi
echo "================================"
