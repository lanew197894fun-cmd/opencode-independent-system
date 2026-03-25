#!/usr/bin/env bun
// 偏好強化模組 V2 - 帶語氣檢測、歷史學習、動態調整

const PREF_DIR = "/home/reamaster/opencode-manager/opencode independent system/.opencode/preferences"
const QUICK_REF = `${PREF_DIR}/quick-ref.json`
const SESSION = `${PREF_DIR}/session.json`
const HISTORY = `${PREF_DIR}/history.json`
const FEEDBACK = `${PREF_DIR}/feedback.json`

interface Preference {
  language: string
  avoidSimplified: boolean
  style: string
  debugMode: string
  skillDescription: string
  note: string
  detailLevel?: "low" | "medium" | "high"
}

interface SessionPref {
  turnCount: number
  lastInjectTime: number
  conversationType: "technical" | "casual" | "debug" | "general"
  styleOverrides: Record<string, string>
}

interface Feedback {
  type: "positive" | "negative"
  keyword: string
  timestamp: number
  actionTaken?: string
}

let turnCount = 0
let lastInjectTime = 0

async function loadPreference(): Promise<Preference> {
  try {
    const content = await Bun.file(QUICK_REF).text()
    return JSON.parse(content)
  } catch {
    return {
      language: "繁體中文",
      avoidSimplified: true,
      style: "簡潔",
      debugMode: "主動檢查",
      skillDescription: "慣性顯示繁體中文",
      note: "每次回覆必須使用繁體中文",
    }
  }
}

async function loadSession(): Promise<SessionPref> {
  try {
    const content = await Bun.file(SESSION).text()
    return JSON.parse(content)
  } catch {
    return { turnCount: 0, lastInjectTime: 0, conversationType: "general", styleOverrides: {} }
  }
}

async function loadFeedback(): Promise<Feedback[]> {
  try {
    const content = await Bun.file(FEEDBACK).text()
    return JSON.parse(content)
  } catch {
    return []
  }
}

async function saveSession(session: SessionPref): Promise<void> {
  await Bun.write(SESSION, JSON.stringify(session, null, 2))
}

async function saveFeedback(feedback: Feedback[]): Promise<void> {
  await Bun.write(FEEDBACK, JSON.stringify(feedback, null, 2))
}

// 分析對話類型
function analyzeConversationType(userInput: string): SessionPref["conversationType"] {
  const input = userInput.toLowerCase()

  if (input.includes("error") || input.includes("bug") || input.includes("debug") || input.includes("除錯")) {
    return "debug"
  }
  if (input.includes("教學") || input.includes("怎麼") || input.includes("如何") || input.includes("code")) {
    return "technical"
  }
  if (input.includes("你好") || input.includes("天氣") || input.includes("聊")) {
    return "casual"
  }
  return "general"
}

// 根據對話類型調整詳細度
function getDetailLevel(type: SessionPref["conversationType"]): "low" | "medium" | "high" {
  switch (type) {
    case "debug":
      return "high"
    case "technical":
      return "medium"
    case "casual":
      return "low"
    default:
      return "medium"
  }
}

// 根據用戶回饋調整風格
function adjustStyleFromFeedback(baseStyle: string, feedback: Feedback[]): string {
  const recentNegative = feedback.filter(
    (f) => f.type === "negative" && Date.now() - f.timestamp < 3600000, // 1小時內
  )

  const keywords = recentNegative.map((f) => f.keyword)

  if (keywords.some((k) => k.includes("長") || k.includes("詳細"))) {
    return "極簡"
  }
  if (keywords.some((k) => k.includes("短") || k.includes("簡短"))) {
    return "簡潔"
  }

  return baseStyle
}

// 生成偏好 Prompt
function generatePreferencePrompt(pref: Preference, session: SessionPref, adjustedStyle: string): string {
  return `
## 用戶偏好（必須遵守）
- 語言：${pref.language}
- 避免：${pref.avoidSimplified ? "簡體字、英文（技術術語除外）" : "無"}
- 風格：${adjustedStyle}
- Debug：${pref.debugMode}
- 詳細度：${session.conversationType} → ${getDetailLevel(session.conversationType)}
- 註記：${pref.note}
`
}

// 語氣檢測 - 回覆後檢查是否符合偏好
async function validateResponse(response: string, pref: Preference): Promise<boolean> {
  // 檢查是否為繁體中文
  if (pref.avoidSimplified) {
    const simplifiedPatterns = [/你们/, /这是/, /那个/, /什么/, /可以/, /就是/, /没有/, /一个/]
    const hasSimplified = simplifiedPatterns.some((p) => p.test(response))
    if (hasSimplified) {
      console.log("[Preference] 檢測到簡體字，已標記")
      return false
    }
  }
  return true
}

// 記錄用戶回饋
async function recordFeedback(userMessage: string, aiResponse: string): Promise<void> {
  const feedback: Feedback[] = await loadFeedback()
  const userLower = userMessage.toLowerCase()

  // 負面回饋關鍵字
  const negativeKeywords = ["太長", "太短", "太詳細", "太簡短", "看不懂", "不要", "不要用"]
  const positiveKeywords = ["很好", "OK", "正確", "感謝"]

  for (const kw of negativeKeywords) {
    if (userLower.includes(kw)) {
      feedback.push({ type: "negative", keyword: kw, timestamp: Date.now() })
    }
  }

  for (const kw of positiveKeywords) {
    if (userLower.includes(kw)) {
      feedback.push({ type: "positive", keyword: kw, timestamp: Date.now() })
    }
  }

  // 只保留最近 100 筆
  const trimmed = feedback.slice(-100)
  await saveFeedback(trimmed)
}

// 獲取偏好 Prompt（主函數）
async function getPreferencePrompt(userMessage?: string): Promise<string> {
  const pref = await loadPreference()
  let session = await loadSession()
  const feedback = await loadFeedback()

  // 更新回合數
  session.turnCount++

  // 分析對話類型
  if (userMessage) {
    session.conversationType = analyzeConversationType(userMessage)
  }

  // 根據回饋調整風格
  const adjustedStyle = adjustStyleFromFeedback(pref.style, feedback)

  // 檢查是否需要注射
  const shouldInject = session.turnCount % 5 === 0 || Date.now() - session.lastInjectTime > 180000

  if (shouldInject) {
    session.lastInjectTime = Date.now()
    await saveSession(session)
    return generatePreferencePrompt(pref, session, adjustedStyle)
  }

  await saveSession(session)
  return ""
}

// 重置 session
async function resetSession(): Promise<void> {
  const session: SessionPref = { turnCount: 0, lastInjectTime: 0, conversationType: "general", styleOverrides: {} }
  await Bun.write(SESSION, JSON.stringify(session, null, 2))
  console.log("[Preference] Session 已重置")
}

// 顯示當前偏好
async function showPreferences(): Promise<void> {
  const pref = await loadPreference()
  const session = await loadSession()
  console.log("=== 當前偏好 ===")
  console.log(JSON.stringify(pref, null, 2))
  console.log("\n=== 對話狀態 ===")
  console.log(JSON.stringify(session, null, 2))
}

export { getPreferencePrompt, validateResponse, recordFeedback, resetSession, showPreferences }
