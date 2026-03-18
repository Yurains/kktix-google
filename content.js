
const keywords = JSON.parse(localStorage.getItem('keywords') || '[]');
const quantity = parseInt(localStorage.getItem('quantity') || '1');
const milesecond = parseInt(localStorage.getItem('milesecond') || '3000');
const memberCode = localStorage.getItem("memberCode") || "";
const creditCardNumber = localStorage.getItem("creditCardNumber") || "";
const random = localStorage.getItem('random') === 'true';
const excludeDisability = localStorage.getItem('excludeDisability') === 'true';

// ✅ 每秒模擬點擊，觸發延遲 alert
setInterval(() => {
  const evt = new MouseEvent('click', { bubbles: true, cancelable: true });
  document.body?.dispatchEvent(evt);
  console.log('[模擬點擊] 發出 click → 強制觸發 alert()');
}, 1000);

function dispatchAllEvents(el) {
  ["input", "change", "blur", "keyup", "keydown"].forEach((eventType) => {
    el.dispatchEvent(new Event(eventType, { bubbles: true }));
  });
}

function normalizeText(text) {
  return text
    .normalize("NFKC") // 標準化全半形
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '') // 中英數保留
    .toLowerCase();
}

function normalizePrice(text) {
  return text.replace(/[^0-9]/g, ''); // 僅保留數字
}

function matchKeyword(name, priceText) {
  const normName = normalizeText(name);
  const normPrice = normalizePrice(priceText);

  return keywords.find((kw) => {
    const normKW = normalizeText(kw);
    const normKWPrice = normalizePrice(kw);
    return normName.includes(normKW) || normPrice === normKWPrice;
  });
}

// function fillMemberCodeIfVisible() {
//   if (!memberCode) return;

//   const inputs = Array.from(document.querySelectorAll('input[type="text"]'))
//     .filter(input => !input.closest('.ticket-unit'));

//   for (const input of inputs) {
//     const allText = [
//       input.getAttribute('placeholder') || '',
//       input.getAttribute('name') || '',
//       input.closest('label')?.innerText || '',
//       input.previousElementSibling?.innerText || '',
//     ].join(' ').toLowerCase();

//     if (allText.includes('會員') || allText.includes('member') || allText.includes('輸入') || allText.includes('填入') || allText.includes('答案')) {
//       input.focus();
//       input.value = '';
//       input.dispatchEvent(new Event('input', { bubbles: true }));

//       for (const char of memberCode) {
//         input.value += char;
//         input.dispatchEvent(new Event('input', { bubbles: true }));
//       }

//       console.log(`[會員碼] 已輸入會員碼：${memberCode}`);
//       return;
//     }
//   }
// }

function fillMemberCodeIfVisible() {
  if (!memberCode) return;

  // 先點選 radio
  const radioInputs = Array.from(document.querySelectorAll('input[type="radio"]'));
  for (const radio of radioInputs) {
    const labelText = radio.closest('label')?.innerText?.toLowerCase() || '';
    if (labelText.includes('會員') || labelText.includes('member')) {
      radio.click();
      console.log("[會員碼] 已點選會員資格 radio");

      // 加入延遲等待 Angular/Vue 重渲染
      setTimeout(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="text"]'))
          .filter(input =>
            input.offsetParent !== null &&
            !input.disabled &&
            input.className.includes('member-code')
          );

        if (inputs.length === 0) {
          console.warn("[會員碼] 延遲後仍未找到適合填入的欄位");
          return;
        }

        const input = inputs[0];
        input.focus();
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));

        for (const char of memberCode) {
          input.value += char;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }

        console.log(`[會員碼] 成功填入會員碼：${memberCode}`);
      }, 200); // 等 0.5 秒再找 input 欄位

      return;
    }
  }

  console.warn("[會員碼] 找不到符合資格的 radio");
}


function solveQAAndNext() {
  const box = document.querySelector(".custom-captcha .custom-captcha-inner");
  if (!box) return false;

  const input = box.querySelector('input[name="captcha_answer"]') || box.querySelector("input");
  if (!input) return false;

  // 只要有提供 memberCode，就直接填入
  if (memberCode && memberCode.trim()) {
    const final = memberCode.trim();
    input.focus();
    input.value = final;
    input.setAttribute("value", final);
    dispatchAllEvents(input);
    console.log(`[KKTIX] [問答] 已填入 memberCode：${final}`);
  } else {
    console.log("[KKTIX] [問答] 未提供 memberCode，保留人工輸入");
    return false;
  }

  return true;
}

function fillCreditCardIfVisible() {
  if (!creditCardNumber) return;

  const attemptFill = () => {
    // 尋找目標輸入框 (根據你之前提供的 member-code class，或 placeholder 包含卡號)
    const inputs = Array.from(document.querySelectorAll('input.member-code[type="text"], input[placeholder*="卡號"]'))
      .filter(input => input.offsetParent !== null && !input.disabled);

    for (const input of inputs) {
      // 若已經被會員碼填過，則跳過避免衝突
      if (input.value && input.value !== creditCardNumber) continue;

      input.focus();
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      // 採用逐字輸入的方式，確保能觸發 Angular 等前端框架的資料綁定
      for (const char of creditCardNumber) {
        input.value += char;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      console.log(`[信用卡] 已成功填入：${creditCardNumber}`);
      return true;
    }
    return false;
  };

  if (!attemptFill()) {
    // 延遲重試，確保前端框架已經把輸入框渲染出來
    setTimeout(attemptFill, 150);
    setTimeout(attemptFill, 400);
  }
}

function clickNextStepWhenEnabled() {
  const checkAndClick = () => {
    const nextBtns = Array.from(document.querySelectorAll(
      '.register-new-next-button-area button.btn.btn-primary'
    )).filter(btn => !btn.disabled);

    for (const btn of nextBtns) {
      const text = btn.innerText.trim();
      if (text.includes('下一步') || text.includes('電腦配位')) {
        console.log(`[搶票] 偵測到按鈕「${text}」並點擊`);
        btn.click();
        return;
      }
    }

    // 尚未啟用 → 繼續等待
    setTimeout(checkAndClick, 200);
  };

  checkAndClick();
}

function handleTicket(input) {
  input.focus();
  input.removeAttribute('max'); // 移除最大值限制，避免被網頁預設值擋住
  input.removeAttribute('min');
  
  // 修正數量邏輯：移除 max 檢查，直接填入使用者設定的數量
  // 避免因網頁 DOM 尚未更新 max 屬性而導致錯誤限制為 1 張
  const finalCount = quantity;
  
  input.value = finalCount;
  input.setAttribute('value', finalCount); // 確保屬性也變更
  console.log(`[搶票] 強制填入數量：${finalCount}`);
  
  // 強制觸發事件確保前端框架抓到數值
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new Event('blur', { bubbles: true })); // 新增 blur 事件
  dispatchAllEvents(input);

  const checkbox = document.querySelector("#person_agree_terms");
  if (checkbox && !checkbox.checked) {
    checkbox.click();
    console.log("[搶票] 條款模擬 click 勾選成功");
  }

  fillMemberCodeIfVisible()
  fillCreditCardIfVisible() // 呼叫填入卡號的邏輯

  solveQAAndNext()
  
  setTimeout(() => {
    clickNextStepWhenEnabled(); // 最後才點下一步
  }, 100);
}

function tryBuyTicket() {
  let rows = Array.from(document.querySelectorAll(".ticket-unit"));

  // 1. 排除身障位
  if (excludeDisability) {
    rows = rows.filter(row => {
      const text = (row.innerText || "").toLowerCase();
      // 排除包含 "身障" 或 "輪椅" 的票種
      return !text.includes("身障") && 
             !text.includes("輪椅") && 
             !text.includes("disability") && 
             !text.includes("wheelchair");
    });
  }

  // 2. 排序邏輯 (隨機 vs 置底 vs 預設)
  if (random) {
    // Fisher-Yates Shuffle 隨機打亂
    for (let i = rows.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rows[i], rows[j]] = [rows[j], rows[i]];
    }
    console.log('[模式] 隨機選位已啟用');
  } else {
    const bottom = localStorage.getItem('bottom') === 'true';
    if (bottom) {
      rows.reverse();
      console.log('[模式] bottom = true，票種順序已倒序（由下往上）');
    }
  }

  if (!keywords || keywords.length === 0) {
    // keyword 空 → 搶第一個能選的
    for (let row of rows) {
      // 擴充選擇器，支援 number 和 tel 類型
      const input = row.querySelector('input[type="text"]:not([disabled]), input[type="number"]:not([disabled]), input[type="tel"]:not([disabled])');
      if (!input) continue;

      const name = row.querySelector(".ticket-name")?.innerText.trim() || "";
      const price = row.querySelector(".ticket-price")?.innerText.trim() || "";

      console.log(`[搶票] keyword 為空，自動搶票：${name} (${price})`);
      return handleTicket(input);
    }

    console.log("[等待] 找不到可填票種，延後刷新...");
    return setTimeout(() => location.reload(), milesecond);
  }

  for (let keyword of keywords) {
    for (let row of rows) {
      const name = row.querySelector(".ticket-name")?.innerText.trim() || "";
      const price = row.querySelector(".ticket-price")?.innerText.trim() || "";
      // 擴充選擇器
      const input = row.querySelector('input[type="text"]:not([disabled]), input[type="number"]:not([disabled]), input[type="tel"]:not([disabled])');
      if (!input) continue;

      const normName = normalizeText(name);
      const normPrice = normalizePrice(price);
      const normKW = normalizeText(keyword);
      const normKWPrice = normalizePrice(keyword);

      if (normName.includes(normKW) || normPrice === normKWPrice) {
        console.log(`[搶票] 使用關鍵字：${keyword} → ${name} (${price})`);
        return handleTicket(input);
      }
    }
  }

  // 有關鍵字但都還沒開放可填 → 刷新等待
  console.log("[等待] 找到關鍵字但尚無張數可選，延後刷新...");
  setTimeout(() => {
    location.reload();
  }, milesecond);
}

window.addEventListener("load", () => {
  if (localStorage.getItem('pause') === 'true') {
    console.log('[暫停中] 已設定 pause = true，不執行任何操作');
    return;
  }
  tryBuyTicket();
});
