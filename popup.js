function updateStatus(text, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.innerText = text;
  statusDiv.className = '';

  if (type === 'running') statusDiv.classList.add('status-running');
  if (type === 'paused') statusDiv.classList.add('status-paused');
  if (type === 'cleared') statusDiv.classList.add('status-cleared');
  if (type === 'saved') {
    statusDiv.classList.add('status-running');
    statusDiv.innerText = '設定已儲存';
  }
}

async function executeScript(direction) {
  const rawKeywords = document.getElementById('keywords').value;
  const quantity = document.getElementById('quantity').value;
  const milesecond = document.getElementById('milesecond').value;
  const memberCode = document.getElementById('memberCode').value;
  const creditCardNumber = document.getElementById('creditCardNumber').value;
  const random = document.getElementById('random').checked;
  const excludeDisability = document.getElementById('excludeDisability').checked;
  const keywordArray = rawKeywords.split(',').map(k => k.trim()).filter(Boolean);

  // 儲存到 Extension popup 自己的 localStorage
  localStorage.setItem('keywords_input', rawKeywords);
  localStorage.setItem('quantity_input', quantity);
  localStorage.setItem('milesecond_input', milesecond);
  localStorage.setItem('memberCode_input', memberCode);
  localStorage.setItem('creditCardNumber_input', creditCardNumber);
  localStorage.setItem('random_input', random);
  localStorage.setItem('excludeDisability_input', excludeDisability);

  updateStatus('執行中...', 'running');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    args: [
      keywordArray,
      quantity,
      milesecond,
      rawKeywords,
      memberCode,
      creditCardNumber,
      direction,
      random,
      excludeDisability
    ],
    func: (
      keywordArray,
      quantity,
      milesecond,
      rawKeywords,
      memberCode,
      creditCardNumber,
      direction,
      random,
      excludeDisability
    ) => {
      localStorage.setItem('keywords', JSON.stringify(keywordArray));
      localStorage.setItem('quantity', quantity);
      localStorage.setItem('milesecond', milesecond);
      localStorage.setItem('memberCode', memberCode);
      localStorage.setItem('creditCardNumber', creditCardNumber);
      localStorage.setItem('keywords_input', rawKeywords);
      localStorage.setItem('quantity_input', quantity);
      localStorage.setItem('milesecond_input', milesecond);
      localStorage.setItem('memberCode_input', memberCode);
      localStorage.setItem('creditCardNumber_input', creditCardNumber);
      localStorage.setItem('pause', 'false');
      localStorage.setItem('random', random);
      localStorage.setItem('excludeDisability', excludeDisability);

      if (direction === 'top') {
        localStorage.setItem('bottom', 'false');
      } else if (direction === 'bottom') {
        localStorage.setItem('bottom', 'true');
      }

      location.reload();
    }
  });
}

document.getElementById('save').addEventListener('click', () => executeScript(null));
document.getElementById('top').addEventListener('click', () => executeScript('top'));
document.getElementById('bottom').addEventListener('click', () => executeScript('bottom'));

document.getElementById('saveSettings').addEventListener('click', async () => {
  const rawKeywords = document.getElementById('keywords').value;
  const quantity = document.getElementById('quantity').value;
  const milesecond = document.getElementById('milesecond').value;
  const memberCode = document.getElementById('memberCode').value;
  const creditCardNumber = document.getElementById('creditCardNumber').value;
  const random = document.getElementById('random').checked;
  const excludeDisability = document.getElementById('excludeDisability').checked;
  const keywordArray = rawKeywords.split(',').map(k => k.trim()).filter(Boolean);

  localStorage.setItem('keywords_input', rawKeywords);
  localStorage.setItem('quantity_input', quantity);
  localStorage.setItem('milesecond_input', milesecond);
  localStorage.setItem('memberCode_input', memberCode);
  localStorage.setItem('creditCardNumber_input', creditCardNumber);
  localStorage.setItem('random_input', random);
  localStorage.setItem('excludeDisability_input', excludeDisability);

  updateStatus('設定已儲存', 'saved');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [
        keywordArray,
        quantity,
        milesecond,
        memberCode,
        creditCardNumber,
        random,
        excludeDisability
      ],
      func: (
        keywordArray,
        quantity,
        milesecond,
        memberCode,
        creditCardNumber,
        random,
        excludeDisability
      ) => {
        localStorage.setItem('keywords', JSON.stringify(keywordArray));
        localStorage.setItem('quantity', quantity);
        localStorage.setItem('milesecond', milesecond);
        localStorage.setItem('memberCode', memberCode);
        localStorage.setItem('creditCardNumber', creditCardNumber);
        localStorage.setItem('random', random);
        localStorage.setItem('excludeDisability', excludeDisability);
        console.log('[設定] 已同步更新至頁面 localStorage');
      }
    });
  }
});

document.getElementById('pause').addEventListener('click', async () => {
  updateStatus('已暫停', 'paused');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      localStorage.setItem('pause', 'true');
      console.log('pause = true');
    }
  });
});

document.getElementById('clear').addEventListener('click', async () => {
  updateStatus('設定已清除', 'cleared');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      localStorage.removeItem('keywords');
      localStorage.removeItem('quantity');
      localStorage.removeItem('milesecond');
      localStorage.removeItem('pause');
      localStorage.removeItem('keywords_input');
      localStorage.removeItem('quantity_input');
      localStorage.removeItem('milesecond_input');
      localStorage.removeItem('memberCode_input');
      localStorage.removeItem('creditCardNumber');
      localStorage.removeItem('creditCardNumber_input');
      localStorage.removeItem('bottom');
      localStorage.removeItem('random');
      localStorage.removeItem('excludeDisability');
      console.log('[清除] 所有設定已清除');
    }
  });

  document.getElementById('keywords').value = '';
  document.getElementById('quantity').value = '1';
  document.getElementById('milesecond').value = '3000';
  document.getElementById('memberCode').value = '';
  document.getElementById('creditCardNumber').value = '';
  document.getElementById('random').checked = false;
  document.getElementById('excludeDisability').checked = true;

  localStorage.removeItem('keywords_input');
  localStorage.removeItem('quantity_input');
  localStorage.removeItem('milesecond_input');
  localStorage.removeItem('memberCode_input');
  localStorage.removeItem('creditCardNumber_input');
  localStorage.removeItem('random_input');
  localStorage.removeItem('excludeDisability_input');
});

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('keywords').value = localStorage.getItem('keywords_input') || '';
  document.getElementById('quantity').value = localStorage.getItem('quantity_input') || '1';
  document.getElementById('milesecond').value = localStorage.getItem('milesecond_input') || '100';
  document.getElementById('memberCode').value = localStorage.getItem('memberCode_input') || '';
  document.getElementById('creditCardNumber').value = localStorage.getItem('creditCardNumber_input') || '';
  document.getElementById('random').checked = localStorage.getItem('random_input') === 'true';
  document.getElementById('excludeDisability').checked =
    localStorage.getItem('excludeDisability_input') !== 'false';
});