const state = {
  conversation: []
};

const dom = {};

document.addEventListener('DOMContentLoaded', () => {
  dom.form = document.getElementById('chat-form');
  dom.input = document.getElementById('user-input');
  dom.chatBox = document.getElementById('chat-box');
  dom.status = document.getElementById('chat-status');
  dom.quickPrompts = document.querySelectorAll('[data-prompt]');
  dom.testimonialCards = document.querySelectorAll('[data-testimonial]');
  dom.testimonialNav = document.querySelectorAll('[data-testimonial-nav]');
  dom.mobileToggle = document.getElementById('mobile-nav-toggle');
  dom.mobileNav = document.getElementById('mobile-nav');

  initChatExperience();
  initStats();
  initTestimonials();
  initMobileNav();
});

function initChatExperience() {
  if (!dom.chatBox || !dom.form || !dom.input) {
    return;
  }

  appendMessage('assistant', "Hey there! I'm your AI strategist. What kind of workflow or customer journey should we transform first?");

  dom.form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const value = dom.input.value.trim();
    if (!value) {
      return;
    }
    dom.input.value = '';
    dom.input.focus();
    await sendMessage(value);
  });

  dom.quickPrompts.forEach((button) => {
    button.addEventListener('click', async () => {
      const prompt = button.dataset.prompt;
      if (!prompt) {
        return;
      }
      dom.input.value = '';
      dom.input.focus();
      await sendMessage(prompt);
    });
  });
}

let isSending = false;

async function sendMessage(message) {
  if (!dom.chatBox || !dom.status) {
    return;
  }

  if (isSending) {
    setStatus('One sec—finishing the last plan.');
    return;
  }

  appendMessage('user', message);

  isSending = true;
  setStatus('Strategizing next steps…');

  const loaderBubble = appendMessage('assistant', '', { asLoader: true });
  const payloadConversation = state.conversation.slice();
  state.conversation.push({ role: 'user', content: message });

  try {
    const response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversation: payloadConversation })
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    const reply = (data?.message || 'Thanks for the detail! Let me follow up with a tailored answer.').trim();

    updateLoaderBubble(loaderBubble, reply);
    state.conversation.push({ role: 'assistant', content: reply });
  } catch (error) {
    console.error('Chat error:', error);
    updateLoaderBubble(loaderBubble, 'Something went wrong. Give it another try in a moment or drop us a note.');
  } finally {
    setStatus('');
    isSending = false;
  }
}

function appendMessage(sender, text, options = {}) {
  if (!dom.chatBox) {
    return null;
  }

  const row = document.createElement('div');
  row.className = sender === 'user' ? 'chat-row chat-row-user' : 'chat-row chat-row-bot';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';

  if (options.asLoader) {
    bubble.classList.add('is-loading');
    bubble.innerHTML = '<span></span><span></span><span></span>';
  } else {
    bubble.textContent = text;
  }

  row.appendChild(bubble);
  dom.chatBox.appendChild(row);
  dom.chatBox.scrollTo({ top: dom.chatBox.scrollHeight, behavior: 'smooth' });

  if (sender === 'assistant' && !options.asLoader) {
    state.conversation.push({ role: 'assistant', content: text });
  }

  return bubble;
}

function updateLoaderBubble(bubble, text) {
  if (!bubble) {
    return;
  }
  bubble.classList.remove('is-loading');
  bubble.textContent = text;
  dom.chatBox.scrollTo({ top: dom.chatBox.scrollHeight, behavior: 'smooth' });
}

function setStatus(text) {
  if (!dom.status) {
    return;
  }
  dom.status.textContent = text;
  dom.status.setAttribute('aria-hidden', text ? 'false' : 'true');
  dom.status.style.opacity = text ? '1' : '0';
}

function initStats() {
  const statElements = document.querySelectorAll('[data-stat-target]');
  if (!statElements.length) {
    return;
  }

  if (!('IntersectionObserver' in window)) {
    statElements.forEach((element) => {
      const value = element.dataset.statTarget;
      const suffix = element.dataset.statSuffix || '';
      element.textContent = `${value}${suffix}`;
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }
      const element = entry.target;
      if (element.dataset.statAnimated) {
        observer.unobserve(element);
        return;
      }
      element.dataset.statAnimated = 'true';
      animateStat(element);
      observer.unobserve(element);
    });
  }, {
    threshold: 0.5
  });

  statElements.forEach((element) => observer.observe(element));
}

function animateStat(element) {
  const target = Number(element.dataset.statTarget);
  const suffix = element.dataset.statSuffix || '';

  if (Number.isNaN(target)) {
    element.textContent = `${suffix}`;
    return;
  }

  const duration = 1400;
  const decimals = element.dataset.statDecimals ? Number(element.dataset.statDecimals) : (target % 1 !== 0 ? 1 : 0);
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    const current = target * eased;
    const formatted = decimals ? current.toFixed(decimals) : Math.round(current);
    element.textContent = `${formatted}${suffix}`;
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = `${target}${suffix}`;
    }
  }

  requestAnimationFrame(update);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function initTestimonials() {
  if (!dom.testimonialCards || dom.testimonialCards.length <= 1) {
    return;
  }

  let activeIndex = 0;

  const setActive = (index) => {
    dom.testimonialCards.forEach((card, cardIndex) => {
      if (cardIndex === index) {
        card.classList.add('is-active');
      } else {
        card.classList.remove('is-active');
      }
    });
    activeIndex = index;
  };

  let rotateTimer = setInterval(() => {
    const nextIndex = (activeIndex + 1) % dom.testimonialCards.length;
    setActive(nextIndex);
  }, 7000);

  const restartTimer = () => {
    clearInterval(rotateTimer);
    rotateTimer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % dom.testimonialCards.length;
      setActive(nextIndex);
    }, 7000);
  };

  dom.testimonialCards.forEach((card, index) => {
    card.addEventListener('mouseenter', () => {
      setActive(index);
      restartTimer();
    });
    card.addEventListener('focusin', () => {
      setActive(index);
      restartTimer();
    });
  });

  dom.testimonialNav.forEach((button) => {
    button.addEventListener('click', () => {
      const direction = button.dataset.testimonialNav;
      if (!direction) {
        return;
      }
      const offset = direction === 'next' ? 1 : -1;
      const nextIndex = (activeIndex + offset + dom.testimonialCards.length) % dom.testimonialCards.length;
      setActive(nextIndex);
      restartTimer();
    });
  });
}

function initMobileNav() {
  if (!dom.mobileToggle || !dom.mobileNav) {
    return;
  }

  const toggleNav = () => {
    const expanded = dom.mobileToggle.getAttribute('aria-expanded') === 'true';
    dom.mobileToggle.setAttribute('aria-expanded', (!expanded).toString());
    dom.mobileNav.classList.toggle('hidden', expanded);
  };

  dom.mobileToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleNav();
  });

  document.addEventListener('click', (event) => {
    if (dom.mobileToggle.getAttribute('aria-expanded') === 'true' && !dom.mobileNav.contains(event.target) && event.target !== dom.mobileToggle) {
      dom.mobileToggle.setAttribute('aria-expanded', 'false');
      dom.mobileNav.classList.add('hidden');
    }
  });
}