(() => {
  if (window.__kktixAutoBuyerLoaded) return;
  window.__kktixAutoBuyerLoaded = true;

  let reloadTimer = null;
  let ticketObserver = null;
  let actionTaken = false;
  const DEFAULTS = {
    keywords: '', quantity: 1, milesecond: 3000, memberCode: '',
    creditCardNumber: '', random: false, excludeDisability: true
  };

  function normalizeText(value) {
    return String(value || '').normalize('NFKC').replace(/\s+/g, '').toLowerCase();
  }

  function digits(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function setInputValue(input, value) {
    const prototype = input instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (setter) setter.call(input, String(value));
    else input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function visible(element) {
    return element && element.getClientRects().length > 0 && !element.disabled;
  }

  function scheduleReload(milliseconds) {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(async () => {
      const { running } = await chrome.storage.local.get('running');
      if (running) location.reload();
    }, milliseconds);
  }

  function waitForTicketElements() {
    if (ticketObserver || !document.documentElement) return;
    console.info('[KKTIX auto buyer] Armed; waiting for ticket elements.');
    ticketObserver = new MutationObserver(() => {
      if (!document.querySelector('.ticket-unit')) return;
      ticketObserver.disconnect();
      ticketObserver = null;
      run().catch((error) => console.error('[KKTIX auto buyer] Failed:', error));
    });
    ticketObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  function findQuantityControl(row) {
    return row.querySelector([
      'select:not([disabled])',
      'input[type="number"]:not([disabled])',
      'input[type="text"]:not([disabled])',
      'input[type="tel"]:not([disabled])'
    ].join(','));
  }

  function fillOptionalFields(settings) {
    if (settings.memberCode) {
      const captcha = document.querySelector('.custom-captcha input[name="captcha_answer"], .custom-captcha input[type="text"]');
      if (visible(captcha)) setInputValue(captcha, settings.memberCode);

      const memberRadio = [...document.querySelectorAll('input[type="radio"]')].find((radio) => {
        const text = normalizeText(radio.closest('label')?.innerText);
        return text.includes('\u6703\u54e1') || text.includes('member');
      });
      if (visible(memberRadio) && !memberRadio.checked) memberRadio.click();
    }

    if (settings.creditCardNumber) {
      setTimeout(() => {
        const candidates = [...document.querySelectorAll('input.member-code, input[type="text"]')];
        const target = candidates.find((input) => {
          if (!visible(input) || input.closest('.ticket-unit') || input.closest('.custom-captcha')) return false;
          const context = normalizeText([
            input.className, input.name, input.placeholder,
            input.closest('.control-group')?.innerText
          ].join(' '));
          return context.includes('\u4fe1\u7528\u5361') || context.includes('card') || input.classList.contains('member-code');
        });
        if (target) setInputValue(target, settings.creditCardNumber);
      }, 250);
    }
  }

  function agreeToTerms() {
    const checkbox = document.querySelector('#person_agree_terms');
    if (checkbox && !checkbox.checked) checkbox.click();
  }

  function clickNextWhenReady(attempt = 0) {
    const buttons = [...document.querySelectorAll(
      '.register-new-next-button-area button, button.btn-primary, input[type="submit"]'
    )];
    const next = buttons.find((button) => {
      const text = normalizeText(button.innerText || button.value);
      return !button.disabled && (
        text.includes('\u4e0b\u4e00\u6b65') ||
        text.includes('\u9032\u5165\u4e0b\u4e00\u6b65') ||
        text.includes('next')
      );
    });

    if (next) {
      console.info('[KKTIX auto buyer] Ticket selected; proceeding.');
      next.click();
      return;
    }
    if (attempt < 100) setTimeout(() => clickNextWhenReady(attempt + 1), 200);
  }

  function rowMatches(row, keywordList) {
    if (keywordList.length === 0) return true;
    const name = row.querySelector('.ticket-name')?.innerText || row.innerText || '';
    const price = row.querySelector('.ticket-price')?.innerText || '';
    const normalizedName = normalizeText(name);
    const normalizedPrice = digits(price);
    return keywordList.some((keyword) => {
      const normalizedKeyword = normalizeText(keyword);
      const keywordPrice = digits(keyword);
      return normalizedName.includes(normalizedKeyword) ||
        (keywordPrice.length > 0 && normalizedPrice === keywordPrice);
    });
  }

  async function run() {
    const state = await chrome.storage.local.get(['settings', 'running', 'direction']);
    if (!state.running) {
      console.info('[KKTIX auto buyer] Paused.');
      return;
    }
    if (actionTaken) return;

    const settings = { ...DEFAULTS, ...(state.settings || {}) };
    const interval = Math.max(100, Number(settings.milesecond) || 3000);
    const keywordList = String(settings.keywords || '')
      .split(',').map((item) => item.trim()).filter(Boolean);
    let rows = [...document.querySelectorAll('.ticket-unit')];

    // Being armed does not imply that the current page is a ticket page. Wait
    // quietly until KKTIX renders the relevant elements instead of reloading an
    // unrelated event, account, or home page.
    if (rows.length === 0) {
      waitForTicketElements();
      return;
    }

    if (settings.excludeDisability) {
      rows = rows.filter((row) => {
        const text = normalizeText(row.innerText);
        return !text.includes('\u8eab\u5fc3\u969c\u7919') &&
          !text.includes('\u8eab\u969c') &&
          !text.includes('wheelchair') &&
          !text.includes('disability');
      });
    }

    if (settings.random) {
      for (let index = rows.length - 1; index > 0; index -= 1) {
        const other = Math.floor(Math.random() * (index + 1));
        [rows[index], rows[other]] = [rows[other], rows[index]];
      }
    } else if (state.direction === 'bottom') {
      rows.reverse();
    }

    const row = rows.find((candidate) =>
      findQuantityControl(candidate) && rowMatches(candidate, keywordList));
    if (!row) {
      console.info(`[KKTIX auto buyer] No matching ticket; reload in ${interval}ms.`);
      scheduleReload(interval);
      return;
    }

    const input = findQuantityControl(row);
    actionTaken = true;
    input.focus();
    input.removeAttribute('max');
    input.removeAttribute('min');
    setInputValue(input, Math.max(1, Number(settings.quantity) || 1));
    agreeToTerms();
    fillOptionalFields(settings);
    setTimeout(() => clickNextWhenReady(), 300);
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.running?.newValue === false) {
      clearTimeout(reloadTimer);
      ticketObserver?.disconnect();
      ticketObserver = null;
      actionTaken = false;
      return;
    }
    if (changes.running || changes.settings || changes.direction) {
      clearTimeout(reloadTimer);
      actionTaken = false;
      run().catch((error) => console.error('[KKTIX auto buyer] Failed:', error));
    }
  });

  run().catch((error) => console.error('[KKTIX auto buyer] Failed:', error));
})();
