const DEFAULTS = {
  keywords: '', quantity: 1, milesecond: 3000, memberCode: '',
  creditCardNumber: '', random: false, excludeDisability: true
};

function updateStatus(text, type) {
  const status = document.getElementById('status');
  status.textContent = text;
  status.className = `status-${type}`;
}

function readForm() {
  return {
    keywords: document.getElementById('keywords').value.trim(),
    quantity: Math.max(1, Number.parseInt(document.getElementById('quantity').value, 10) || 1),
    milesecond: Math.max(100, Number.parseInt(document.getElementById('milesecond').value, 10) || 3000),
    memberCode: document.getElementById('memberCode').value.trim(),
    creditCardNumber: document.getElementById('creditCardNumber').value.trim(),
    random: document.getElementById('random').checked,
    excludeDisability: document.getElementById('excludeDisability').checked
  };
}

function writeForm(settings) {
  for (const id of ['keywords', 'quantity', 'milesecond', 'memberCode', 'creditCardNumber']) {
    document.getElementById(id).value = settings[id];
  }
  document.getElementById('random').checked = settings.random;
  document.getElementById('excludeDisability').checked = settings.excludeDisability;
}

async function start(direction = 'top') {
  try {
    await chrome.storage.local.set({ settings: readForm(), running: true, direction });
    updateStatus('\u57f7\u884c\u4e2d', 'running');
  } catch (error) {
    updateStatus(error.message || String(error), 'error');
  }
}

document.getElementById('save').addEventListener('click', () => start('top'));
document.getElementById('top').addEventListener('click', () => start('top'));
document.getElementById('bottom').addEventListener('click', () => start('bottom'));

document.getElementById('saveSettings').addEventListener('click', async () => {
  await chrome.storage.local.set({ settings: readForm() });
  updateStatus('\u8a2d\u5b9a\u5df2\u5132\u5b58', 'running');
});

document.getElementById('pause').addEventListener('click', async () => {
  await chrome.storage.local.set({ running: false });
  updateStatus('\u5df2\u66ab\u505c', 'paused');
});

document.getElementById('clear').addEventListener('click', async () => {
  await chrome.storage.local.clear();
  writeForm(DEFAULTS);
  updateStatus('\u8a2d\u5b9a\u5df2\u6e05\u9664', 'cleared');
});

document.addEventListener('DOMContentLoaded', async () => {
  const state = await chrome.storage.local.get(['settings', 'running']);
  writeForm({ ...DEFAULTS, ...(state.settings || {}) });
  if (state.running) updateStatus('\u57f7\u884c\u4e2d', 'running');
});
