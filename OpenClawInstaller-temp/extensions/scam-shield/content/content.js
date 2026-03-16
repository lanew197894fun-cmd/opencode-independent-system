// 內容腳本 - 掃描頁面中的詐騙內容
(function() {
  'use strict';

  // 詐騙關鍵詞
  const SCAM_PATTERNS = [
    // 緊急威脅
    /緊急|立即|馬上|立刻|帳號鎖定|安全威脅|資料外洩|損失財產|法律責任|罰款/g,
    // 金錢
    /匯款|轉帳|購買點數|支付|手續費|代收|代付|捐款|投資|獲利|分紅|抽獎|中獎/g,
    // 個資
    /身分證|銀行帳號|帳戶|卡號|密碼|驗證碼|OTP|帳單/g,
    // 權威冒充
    /銀行客服|警政署|刑事局|財政部|國稅局|政府機關|檢察官|警官/g,
    // 常見詐騙
    /兼職|打工|在家工作|輕鬆賺|免費領|免費送|限時搶|團購|分期付款|ATM|退費|退款/g
  ];

  // 可疑連結模式
  const SUSPICIOUS_LINK_PATTERNS = [
    /login.*\.tk/i,
    /secure.*\.ml/i,
    /banking.*\.ga/i,
    /account.*\.cf/i,
    /verify.*\.gq/i,
    /update.*\.xyz/i,
    /support.*\.top/i,
    /customer.*\.online/i,
    /bit\.ly/i,
    /tinyurl/i,
    /goo\.gl/i
  ];

  let detectedScams = [];

  // 掃描頁面
  function scanPage() {
    detectedScams = [];
    
    // 掃描文字內容
    scanTextContent();
    
    // 掃描連結
    scanLinks();
    
    // 掃描表單
    scanForms();
    
    // 發送結果到 popup
    chrome.runtime.sendMessage({
      action: 'scanComplete',
      results: detectedScams,
      url: window.location.href
    });
    
    // 如果發現風險，顯示警告
    if (detectedScams.length > 0) {
      showWarning();
    }
  }

  // 掃描文字內容
  function scanTextContent() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent;
      if (text.length < 10) continue;
      
      SCAM_PATTERNS.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(match => {
            detectedScams.push({
              type: 'text',
              severity: 'high',
              content: match,
              message: `發現可疑關鍵詞: ${match}`
            });
          });
        }
      });
    }
  }

  // 掃描連結
  function scanLinks() {
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
      const href = link.href;
      
      SUSPICIOUS_LINK_PATTERNS.forEach(pattern => {
        if (pattern.test(href)) {
          detectedScams.push({
            type: 'link',
            severity: 'high',
            content: href,
            message: `發現可疑連結: ${href}`
          });
        }
      });
    });
  }

  // 掃描表單
  function scanForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      const action = form.action || '';
      const inputs = form.querySelectorAll('input');
      
      // 檢查是否要求敏感資訊
      const sensitiveInputs = Array.from(inputs).filter(input => {
        const type = (input.type || '').toLowerCase();
        const name = (input.name || '').toLowerCase();
        return type === 'password' || 
               type === 'credit-card' ||
               name.includes('password') ||
               name.includes('credit') ||
               name.includes('ssn') ||
               name.includes('idcard');
      });
      
      if (sensitiveInputs.length > 0) {
        // 檢查表單是否在可疑網域
        let isSuspicious = false;
        try {
          const formUrl = new URL(action, window.location.href);
          SUSPICIOUS_LINK_PATTERNS.forEach(pattern => {
            if (pattern.test(formUrl.hostname)) {
              isSuspicious = true;
            }
          });
        } catch (e) {}
        
        if (isSuspicious || !action.startsWith('https')) {
          detectedScams.push({
            type: 'form',
            severity: 'critical',
            content: action,
            message: '發現要求敏感資訊的可疑表單'
          });
        }
      }
    });
  }

  // 顯示警告浮層
  function showWarning() {
    // 移除舊的警告
    const existing = document.getElementById('openclaw-scam-warning');
    if (existing) existing.remove();
    
    const warning = document.createElement('div');
    warning.id = 'openclaw-scam-warning';
    warning.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 999999;
        background: linear-gradient(135deg, #ff4444, #cc0000);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(255,0,0,0.3);
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        max-width: 320px;
        animation: slideIn 0.3s ease;
      ">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <span style="font-size:24px;">⚠️</span>
          <div>
            <div style="font-weight:600;font-size:16px;">OpenClaw 詐騙警告</div>
            <div style="font-size:12px;opacity:0.8;">偵測到 ${detectedScams.length} 個風險</div>
          </div>
        </div>
        <div style="font-size:13px;line-height:1.5;">
          ${detectedScams.slice(0, 3).map(s => `• ${s.message}`).join('<br>')}
          ${detectedScams.length > 3 ? `<br>...還有 ${detectedScams.length - 3} 個` : ''}
        </div>
        <button onclick="this.parentElement.remove()" style="
          margin-top:12px;
          padding:8px 16px;
          background:rgba(255,255,255,0.2);
          border:none;
          border-radius:6px;
          color:white;
          cursor:pointer;
          font-size:12px;
        ">關閉</button>
      </div>
      <style>@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}</style>
    `;
    
    document.body.appendChild(warning);
  }

  // 監聽來自 popup 的訊息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'scanPage') {
      scanPage();
      sendResponse({ success: true, count: detectedScams.length });
    }
  });

  // 頁面載入後自動掃描
  if (document.readyState === 'complete') {
    setTimeout(scanPage, 1000);
  } else {
    window.addEventListener('load', () => setTimeout(scanPage, 1000));
  }

  console.log('🦞 OpenClaw Scam Shield 已啟用');
})();
