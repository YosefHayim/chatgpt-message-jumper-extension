document.addEventListener('DOMContentLoaded', () => {
  const enable = document.getElementById('enable-extension');
  const theme = document.getElementById('theme-select');

  // Load saved state
  chrome.storage.sync.get(
    ['chatgptJumperEnabled', 'chatgptJumperTheme'],
    (data) => {
      enable.checked = data.chatgptJumperEnabled !== false; // default true
      theme.value = data.chatgptJumperTheme || 'dark';
    }
  );

  // Toggle enable
  enable.addEventListener('change', () => {
    const enabled = enable.checked;
    chrome.storage.sync.set({ chatgptJumperEnabled: enabled });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleExtension', enabled });
      }
    });
  });

  // Change theme
  theme.addEventListener('change', () => {
    const value = theme.value;
    chrome.storage.sync.set({ chatgptJumperTheme: value });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'setTheme', theme: value });
      }
    });
  });
});
