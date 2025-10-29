(function () {
  const waitForBody = setInterval(() => {
    if (document.body) {
      clearInterval(waitForBody);
      init();
    }
  }, 500);
  function init() {
    const btn = document.createElement('button');
    btn.id = 'chatgpt-jump-btn';

    const responseCountDisplay = document.createElement('p');
    responseCountDisplay.id = 'chatgpt-response-count';
    responseCountDisplay.style.position = 'fixed';
    responseCountDisplay.style.bottom = '60px';
    responseCountDisplay.style.right = '20px';
    responseCountDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    responseCountDisplay.style.color = 'white';
    responseCountDisplay.style.padding = '5px 10px';
    responseCountDisplay.style.borderRadius = '5px';
    responseCountDisplay.style.marginBottom = '5px';
    btn.textContent = '⬆ Prev Response';
    btn.style.position = 'fixed';
    btn.style.bottom = '20px';
    btn.style.right = '20px';
    btn.style.backgroundColor = 'hsl(222.2 47.4% 11.2%)';
    btn.style.color = 'hsl(210 40% 98%)';
    btn.style.padding = '10px 15px';
    btn.style.borderRadius = '0.375rem';
    btn.style.fontSize = '0.875rem';
    btn.style.fontWeight = '500';
    btn.style.lineHeight = '1.25rem';
    btn.style.border = 'none';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    document.body.appendChild(responseCountDisplay);
    document.body.appendChild(btn);

    btn.addEventListener('click', jumpToPrev);
  }

  function getMessages() {
    return Array.from(document.querySelectorAll('div[data-message-author-role="assistant"]'));
  }

  let currentIndex = 0;
  let responseCountElement = null;

  function jumpToPrev() {
    const messages = getMessages();
    if (messages.length === 0) return;

    if (currentIndex === 0) {
      currentIndex = messages.length;
    }

    currentIndex = (currentIndex - 1 + messages.length) % messages.length;

    const target = messages[currentIndex];
    if (target) {
      if (!responseCountElement) {
        responseCountElement = document.getElementById('chatgpt-response-count');
      }
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (responseCountElement) {
        responseCountElement.textContent = `Response ${currentIndex + 1} of ${messages.length}`;
      }
      btn.textContent = `⬆ Prev Response (${currentIndex + 1}/${messages.length})`;
      target.style.outline = '2px solid #10a37f';
      setTimeout(() => (target.style.outline = ''), 1200);
    }
  }
})();
