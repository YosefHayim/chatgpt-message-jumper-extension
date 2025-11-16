/**
 * Update manifest.json for Firefox compatibility
 */

const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '../dist-firefox/manifest.json');

if (!fs.existsSync(manifestPath)) {
  console.error('❌ Error: manifest.json not found in dist-firefox/');
  process.exit(1);
}

// Read manifest
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Add Firefox-specific settings
manifest.browser_specific_settings = {
  gecko: {
    id: 'ai-conversation-navigator@yosefhayim.com',
    strict_min_version: '109.0'
  }
};

// Remove Chrome-specific fields if present
delete manifest.update_url;
delete manifest.key;

// Write updated manifest
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log('✅ Firefox manifest updated successfully');
console.log('   - Added browser_specific_settings');
console.log('   - Removed Chrome-specific fields');
