# ChatGPT Message Jumper Extension

A lightweight browser extension that enhances ChatGPT by allowing fast navigation across long conversations. It adds a simple interface that lets you jump between messages instantly, improving productivity when working with large threads.

## Features

- Jump directly to any message in a long ChatGPT conversation.
- Clean, minimal popup interface.
- Smooth scrolling and quick navigation.
- Works without altering ChatGPT’s core UI.

## Structure

The extension includes:

- `content.js` – Injected scripts handling message detection and navigation.
- `popup.js`, `popup.html`, `popup.css` – Popup UI logic and styling.
- `loader.css` and `style.css` – Additional styling used inside the page.
- `manifest.json` – Extension configuration for Chromium-based browsers.

## Installation (Manual)

1. Clone or download this repository.
2. Open your browser's Extensions page.
3. Enable Developer Mode.
4. Click “Load unpacked”.
5. Select the repository folder.

The extension will appear in your toolbar.

## Purpose

Built to streamline the workflow when dealing with long ChatGPT sessions, especially for research, coding assistance, or multi-step reasoning tasks.

