(function () {
  // Wait for page to load fully
  const waitForBody = setInterval(() => {
    if (document.body) {
      clearInterval(waitForBody);
      init();
    }
  }, 500);

  function init() {
    // Create the floating button
    const btn = document.createElement('button');
    btn.id = 'chatgpt-jump-btn';
    btn.textContent = '⬆ Prev Response';
    // Apply custom CSS for a Shadcn-like style (using Tailwind-like classes for description)
    btn.style.position = 'fixed';
    btn.style.bottom = '20px';
    btn.style.right = '20px';
    btn.style.backgroundColor = 'hsl(222.2 47.4% 11.2%)'; // shadcn primary background (dark)
    btn.style.color = 'hsl(210 40% 98%)'; // shadcn primary foreground (light)
    btn.style.padding = '10px 15px'; // px-4 py-2
    btn.style.borderRadius = '0.375rem'; // rounded-md
    btn.style.fontSize = '0.875rem'; // text-sm
    btn.style.fontWeight = '500'; // font-medium
    btn.style.lineHeight = '1.25rem'; // leading-5
    btn.style.border = 'none';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'; // Subtle shadow
    document.body.appendChild(btn);

    btn.addEventListener('click', jumpToPrev);
  }

  function getMessages() {
    // This targets each ChatGPT assistant message block
    return Array.from(document.querySelectorAll('div[data-message-author-role="assistant"]'));
  }

  let currentIndex = 0;

  function jumpToPrev() {
    const messages = getMessages();
    if (messages.length === 0) return;

    // When first clicked, set to the last message
    if (currentIndex === 0) {
 currentIndex = messages.length;
    }

    currentIndex = (currentIndex - 1 + messages.length) % messages.length;

    const target = messages[currentIndex];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Update button text to show current/total
      btn.textContent = `⬆ Prev Response (${currentIndex + 1}/${messages.length})`;
      target.style.outline = '2px solid #10a37f';
      setTimeout(() => (target.style.outline = ''), 1200);
    }
  }
})();
