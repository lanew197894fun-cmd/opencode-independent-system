// 詐騙關鍵詞數據庫
const SCAM_KEYWORDS = {
  // 緊急/威脅語
  urgent: ['緊急', '立即', '馬上', '立刻', '帳號鎖定', '安全威脅', '資料外洩', '損失財產', '法律責任', '罰款', '刑事責任', '最後機會', '錯過不再'],
  
  // 金錢相關
  money: ['匯款', '轉帳', '購買點數', '支付', '手續費', '代收', '代付', '代購', '捐款', '投資', '獲利', '分紅', '抽獎', '中獎'],
  
  // 個資相關
  personal: ['身分證', '銀行帳號', '帳戶', '卡號', '密碼', '驗證碼', 'OTP', '帳單', '金融卡'],
  
  // 權威冒充
  authority: ['銀行客服', '警政署', '刑事局', '財政部', '國稅局', '政府機關', '檢察官', '法官', '警官', '海關', '移民署'],
  
  // 常見詐騙類型
  scam: ['兼職', '打工', '在家工作', '輕鬆賺', '免費領', '免費送', '限時搶', '團購', '分期付款', 'ATM', '客服電話', '退費', '退款']
};

// 已知惡意網域模式
const MALICIOUS_PATTERNS = [
  /login.*\.tk$/i, /secure.*\.ml$/i, /banking.*\.ga$/i,
  /account.*\.cf$/i, /verify.*\.gq$/i, /update.*\.xyz$/i,
  /support.*\.top$/i, /customer.*\.online$/i, /secure.*\-login/i,
  /account\-verify/i, /password\-reset/i, /security\-alert/i,
  /urgent\-action/i, /immediate\-payment/i
];

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  
  // 綁定 Enter 鍵
  document.getElementById('checkUrl').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkUrl();
  });
});

// 載入統計
function loadStats() {
  chrome.storage.local.get(['blockedCount', 'scannedCount'], (result) => {
    document.getElementById('blockedCount').textContent = result.blockedCount || 0;
    document.getElementById('scannedCount').textContent = result.scannedCount || 0;
  });
}

// 檢測 URL
async function checkUrl() {
  const input = document.getElementById('checkUrl').value.trim();
  const resultDiv = document.getElementById('result');
  
  if (!input) {
    showResult('請輸入網址', 'warning');
    return;
  }
  
  // 確保 URL 格式正確
  let url = input;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // 更新統計
    incrementStat('scannedCount');
    
    // 風險評分
    const riskScore = calculateRisk(url, domain);
    const riskLevel = getRiskLevel(riskScore);
    
    // 顯示結果
    if (riskLevel === 'danger') {
      showResult(`⚠️ 偵測到潛在風險！\n風險分數: ${riskScore}/100\n等級: ${riskLevel}`, 'danger');
      incrementStat('blockedCount');
    } else if (riskLevel === 'warning') {
      showResult(`⚡ 請注意！\n風險分數: ${riskScore}/100\n等級: ${riskLevel}`, 'warning');
    } else {
      showResult(`✅ 初步檢查通過\n風險分數: ${riskScore}/100\n等級: ${riskLevel}`, 'safe');
    }
    
  } catch (e) {
    showResult('網址格式不正確', 'warning');
  }
}

// 計算風險分數
function calculateRisk(url, domain) {
  let score = 0;
  const urlLower = url.toLowerCase();
  const domainLower = domain.toLowerCase();
  
  // 檢查惡意網域模式
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(domainLower) || pattern.test(urlLower)) {
      score += 50;
    }
  }
  
  // 檢查免費網域
  const freeDomains = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.online', '.site', '.work'];
  for (const ext of freeDomains) {
    if (domainLower.endsWith(ext)) {
      score += 20;
    }
  }
  
  // 檢查 IP 網址
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
    score += 30;
  }
  
  // 檢查可疑關鍵詞
  const allKeywords = [...SCAM_KEYWORDS.urgent, ...SCAM_KEYWORDS.money, ...SCAM_KEYWORDS.scam];
  for (const keyword of allKeywords) {
    if (domainLower.includes(keyword) || urlLower.includes(keyword)) {
      score += 15;
    }
  }
  
  // 檢查異常子網域
  if (domainLower.split('.').length > 4) {
    score += 15;
  }
  
  // 短網址
  const shorteners = ['bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 't.co', 'is.gd', 'buff.ly'];
  for (const short of shorteners) {
    if (domainLower.includes(short)) {
      score += 25;
    }
  }
  
  return Math.min(score, 100);
}

// 風險等級
function getRiskLevel(score) {
  if (score >= 70) return 'danger';
  if (score >= 40) return 'warning';
  return 'safe';
}

// 顯示結果
function showResult(message, type) {
  const resultDiv = document.getElementById('result');
  resultDiv.className = 'result show ' + type;
  resultDiv.innerHTML = '<div class="result-title">' + message.replace(/\n/g, '<br>') + '</div>';
}

// 更新統計
function incrementStat(key) {
  chrome.storage.local.get([key], (result) => {
    const newCount = (result[key] || 0) + 1;
    chrome.storage.local.set({ [key]: newCount });
    document.getElementById(key.replace('Count', 'Count')).textContent = newCount;
  });
}

// 掃描當前頁面
async function scanPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'scanPage' });
    showResult('頁面掃描中...', 'safe');
  }
}
