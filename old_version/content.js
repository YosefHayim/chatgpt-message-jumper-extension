(function () {
  if (window.__chatgpt_jumper_injected__) return;
  window.__chatgpt_jumper_injected__ = true;

  let extensionEnabled = true;
  let currentIndex = 0;
  let direction = +1; // +1 = down, -1 = up

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-jumper-theme', theme);
  }

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'setTheme') applyTheme(request.theme);
    if (request.action === 'toggleExtension') {
      extensionEnabled = request.enabled;
      chrome.storage.sync.set({ chatgptJumperEnabled: extensionEnabled });
      const anchor = document.getElementById('chatgpt-jumper-anchor');
      if (anchor) anchor.style.display = extensionEnabled ? 'block' : 'none';
    }
  });

  const wait = setInterval(() => {
    if (!document.body) return;
    clearInterval(wait);
    chrome.storage.sync.get(['chatgptJumperEnabled', 'chatgptJumperTheme'], (data) => {
      extensionEnabled = data.chatgptJumperEnabled !== false;
      applyTheme(data.chatgptJumperTheme || 'dark');
      init();
      observeComposer(); // Re-anchor when UI re-renders
    });
  }, 150);

  function init() {
    const composer = findComposerContainer();
    if (!composer) return;

    // Ensure the composer can be the positioning context
    if (getComputedStyle(composer).position === 'static') {
      composer.style.position = 'relative';
    }

    // Avoid duplicates
    let anchor = document.getElementById('chatgpt-jumper-anchor');
    if (!anchor) {
      anchor = document.createElement('div');
      anchor.id = 'chatgpt-jumper-anchor';
      Object.assign(anchor.style, {
        position: 'fixed',
 bottom: '0px',
        right: '0px',
        padding: '2em',
        zIndex: '1000', // Ensure it's above most elements
        transform: 'translateY(-50%)',
        display: extensionEnabled ? 'block' : 'none',
        zIndex: '1',           // above composer contents, below global overlays
        pointerEvents: 'none'  // let clicks pass except on the button
      });

      // Use the provided button HTML for the jump button
      const btnHtml = `<button type="button" class="composer-btn" data-testid="composer-plus-btn" aria-label="Add files and more" id="chatgpt-jump" aria-haspopup="menu" aria-expanded="false" data-state="closed"><svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="icon"><path d="M9.33496 16.5V10.665H3.5C3.13273 10.665 2.83496 10.3673 2.83496 10C2.83496 9.63273 3.13273 9.33496 3.5 9.33496H9.33496V3.5C9.33496 3.13273 9.63273 2.83496 10 2.83496C10.3673 2.83496 10.665 3.13273 10.665 3.5V9.33496H16.5L16.6338 9.34863C16.9369 9.41057 17.165 9.67857 17.165 10C17.165 10.3214 16.9369 10.5894 16.6338 10.6514L16.5 10.665H10.665V16.5C10.665 16.8673 10.3673 17.165 10 17.165C9.63273 17.165 9.33496 16.8673 9.33496 16.5Z"></path></svg></button>`;
      anchor.insertAdjacentHTML('beforeend', btnHtml);

      const btn = anchor.querySelector('#chatgpt-jump');
      if (btn) {
        btn.style.pointerEvents = 'auto';
        btn.setAttribute('aria-label', 'Jump between responses'); // Update aria-label
        btn.addEventListener('click', () => jump(btn));
      }

      document.body.appendChild(anchor); // Append to body for fixed positioning
    }

    // Initialize index near current viewport center and set direction
    snapToClosestMessage();
    direction = computeDirectionFromIndex(currentIndex);
    setButtonLabel();
  }

  // Re-attach when ChatGPT reflows or replaces the composer
  function observeComposer() {
    const ro = new MutationObserver(() => {
      if (!document.getElementById('chatgpt-jumper-anchor')) {
        init();
      } else {
        // If the anchor is not in the body (e.g., if the body was replaced), re-initialize
        if (!document.body.contains(document.getElementById('chatgpt-jumper-anchor'))) {
          // Remove existing elements if they somehow got detached or duplicated
          document.getElementById('chatgpt-jumper-anchor')?.remove(); 
          document.getElementById('chatgpt-jumper-loader')?.remove();
          init();
        }
      }
    });
    ro.observe(document.body, { childList: true, subtree: true });
  }

  // Robust lookup: match by core utility classes without relying on bracketed Tailwind tokens
  function findComposerContainer() {
    const candidates = Array.from(document.querySelectorAll('div.bg-token-bg-primary'));
    for (const el of candidates) {
      const c = el.classList;
      if (c.contains('cursor-text') && c.contains('overflow-clip') && c.contains('grid')) {
        return el;
      }
    }
    // Fallback: nearest grid with cursor-text and overflow-clip
    return document.querySelector('div.grid.cursor-text.overflow-clip');
  }

  function getMessages() {
    return Array.from(document.querySelectorAll('div[data-message-author-role="assistant"]'));
  }

  function snapToClosestMessage() {
    const msgs = getMessages();
    if (!msgs.length) { currentIndex = 0; return; }
    const center = window.scrollY + window.innerHeight / 2;
    let closest = 0, best = Infinity;
    msgs.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const mid = window.scrollY + r.top + r.height / 2;
      const d = Math.abs(mid - center);
      if (d < best) { best = d; closest = i; }
    });
    currentIndex = closest;
  }

  function computeDirectionFromIndex(i) {
    const total = getMessages().length;
    if (total <= 1) return +1;
    if (i <= 0) return +1;                 // first → go down
    if (i >= total - 1) return -1;         // last → go up
    return +1;                             // middle default
  }

  function setButtonLabel() {
    const btn = document.getElementById('chatgpt-jump');
    if (!btn) return;
    const total = getMessages().length;
    const idx = total ? currentIndex + 1 : 0;     // 1-based
    const arrow = direction > 0 ? '▼' : '▲';      // dark gray via CSS
    btn.innerHTML = `<span class="arrow">${arrow}</span><span class="count">(${idx}/${total})</span>`;
  }

  function showLoader(show) {
    const l = document.getElementById('chatgpt-jumper-loader');
    if (l) l.style.display = show ? 'block' : 'none';
  }

  function jump(btnEl) {
    if (!extensionEnabled) return;

    const messages = getMessages();
    const total = messages.length;
    if (!total) return;

    showLoader(true);

    currentIndex = (currentIndex + direction + total) % total;
    const target = messages[currentIndex];

    // Flip direction at edges
    if (currentIndex <= 0) direction = +1;
    else if (currentIndex >= total - 1) direction = -1;

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.style.outline = '2px solid #10a37f';
      setButtonLabel();
      setTimeout(() => {
        target.style.outline = '';
        showLoader(false);
      }, 800);
    } else {
      showLoader(false);
    }
  }
})();
