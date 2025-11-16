/**
 * Popup UI
 * Settings and information panel for the extension
 */

import { useEffect, useState } from 'react';
import storageService from '~/src/services/storageService';
import type { ExtensionSettings } from '~/src/types';

function IndexPopup() {
  const [settings, setSettings] = useState<ExtensionSettings>({
    enabled: true,
    theme: 'dark',
    showStats: true,
    showTokenWarning: true,
    tokenWarningThreshold: 80,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const loaded = await storageService.loadSettings();
    setSettings(loaded);
  };

  const updateSetting = async <K extends keyof ExtensionSettings>(
    key: K,
    value: ExtensionSettings[K]
  ) => {
    await storageService.updateSetting(key, value);
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div
      style={{
        width: '360px',
        minHeight: '400px',
        padding: '20px',
        background: settings.theme === 'dark' ? '#1a1a1a' : '#ffffff',
        color: settings.theme === 'dark' ? '#ffffff' : '#000000',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '20px',
            fontWeight: 700,
            margin: '0 0 8px 0',
            background: 'linear-gradient(135deg, #10a37f 0%, #0d8a6a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          AI Conversation Navigator
        </h1>
        <p style={{ margin: 0, fontSize: '13px', opacity: 0.7 }}>
          v2.0.0 - Advanced navigation for AI conversations
        </p>
      </div>

      {/* Settings */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Settings</h2>

        {/* Enable/Disable */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            background: settings.theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
            borderRadius: '8px',
            marginBottom: '12px',
          }}
        >
          <span style={{ fontSize: '14px' }}>Enable Extension</span>
          <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => updateSetting('enabled', e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: settings.enabled ? '#10a37f' : '#888',
                borderRadius: '24px',
                transition: '0.3s',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  content: '',
                  height: '18px',
                  width: '18px',
                  left: settings.enabled ? '26px' : '3px',
                  bottom: '3px',
                  background: 'white',
                  borderRadius: '50%',
                  transition: '0.3s',
                }}
              />
            </span>
          </label>
        </div>

        {/* Theme */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            background: settings.theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
            borderRadius: '8px',
            marginBottom: '12px',
          }}
        >
          <span style={{ fontSize: '14px' }}>Theme</span>
          <select
            value={settings.theme}
            onChange={(e) => updateSetting('theme', e.target.value as 'light' | 'dark' | 'auto')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #444',
              background: settings.theme === 'dark' ? '#1a1a1a' : '#ffffff',
              color: settings.theme === 'dark' ? '#ffffff' : '#000000',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        {/* Show Stats */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            background: settings.theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
            borderRadius: '8px',
            marginBottom: '12px',
          }}
        >
          <span style={{ fontSize: '14px' }}>Show Statistics</span>
          <input
            type="checkbox"
            checked={settings.showStats}
            onChange={(e) => updateSetting('showStats', e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>

        {/* Token Warning */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            background: settings.theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
            borderRadius: '8px',
            marginBottom: '12px',
          }}
        >
          <span style={{ fontSize: '14px' }}>Context Warning</span>
          <input
            type="checkbox"
            checked={settings.showTokenWarning}
            onChange={(e) => updateSetting('showTokenWarning', e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>

        {/* Warning Threshold */}
        {settings.showTokenWarning && (
          <div
            style={{
              padding: '12px',
              background: settings.theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px' }}>Warning Threshold</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#10a37f' }}>
                {settings.tokenWarningThreshold}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={settings.tokenWarningThreshold}
              onChange={(e) => updateSetting('tokenWarningThreshold', parseInt(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        )}
      </div>

      {/* Features */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Features</h2>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8', opacity: 0.9 }}>
          <li>Navigate between AI responses</li>
          <li>View conversation statistics</li>
          <li>Token/character counting</li>
          <li>Enhanced search within messages</li>
          <li>Multi-platform support</li>
        </ul>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: '12px', opacity: 0.6 }}>
        <p style={{ margin: '0 0 8px 0' }}>
          Works on ChatGPT, Claude & Gemini
        </p>
        <p style={{ margin: 0 }}>
          Made with ❤️ by YosefHayim
        </p>
      </div>
    </div>
  );
}

export default IndexPopup;
