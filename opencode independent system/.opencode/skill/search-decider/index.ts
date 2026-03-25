#!/usr/bin/env bun
// 智能搜索判斷模組 - 自動判斷是否需要搜索資訊

const PREF_DIR = "/home/reamaster/opencode-manager/opencode independent system/.opencode/preferences"
const DECISION_CACHE = `${PREF_DIR}/search-decision.json`

interface SearchDecision {
  needsSearch: boolean
  reason: string
  searchType: "web" | "code" | "doc" | "none"
  keywords: string[]
  confidence: number
  cached?: boolean
}

// 搜索觸發關鍵字
const SEARCH_TRIGGERS = {
  // 需要最新資訊
  upToDate: ["最新", "2025", "2026", "最近", "new", "latest", "recent"],

  // 需要解決方案
  solution: ["怎麼辦", "解決", "error", "bug", "問題", "fix", "solution", "wrong"],

  // 需要範例程式碼
  codeExample: ["範例", "例子", "example", "code", "教學", "寫法"],

  // 需要文檔
  documentation: ["文檔", "文件", "api", "document", "docs", "說明"],

  // 不確定/模糊
  uncertain: ["不確定", "應該", "可能", "不知道", "不太懂", "uncertain"],

  // 外部服務/工具
  external: ["telegram", "discord", "slack", "line", "webhook", "api"],
}

// 不需要搜索的情況
const NO_SEARCH_TRIGGERS = ["這是我的偏好", "記住", "儲存", "記憶", "just", "simply", "basically", "essentially"]

// 判斷是否需要搜索
async function shouldSearch(userInput: string, context?: string): Promise<SearchDecision> {
  const input = userInput.toLowerCase()
  const ctx = context?.toLowerCase() || ""

  // 1. 檢查快取
  const cache = await loadCache()
  const cacheKey = hashString(userInput)
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < 3600000) {
    return { ...cache[cacheKey], cached: true }
  }

  let needsSearch = false
  let reason = ""
  let searchType: SearchDecision["searchType"] = "none"
  let keywords: string[] = []
  let confidence = 0

  // 2. 檢查是否應該跳過
  for (const skip of NO_SEARCH_TRIGGERS) {
    if (input.includes(skip)) {
      return { needsSearch: false, reason: "明確指示不需搜索", searchType: "none", keywords: [], confidence: 1 }
    }
  }

  // 3. 錯誤/問題檢測 - 高優先級
  if (containsAny(input, SEARCH_TRIGGERS.solution)) {
    needsSearch = true
    reason = "檢測到錯誤或問題關鍵字"
    searchType = "web"
    keywords = extractErrorKeywords(userInput)
    confidence = 0.9
  }

  // 4. 最新資訊檢測
  else if (containsAny(input, SEARCH_TRIGGERS.upToDate)) {
    needsSearch = true
    reason = "需要最新資訊"
    searchType = "web"
    keywords = extractTopicKeywords(userInput)
    confidence = 0.85
  }

  // 5. 程式碼範例檢測
  else if (containsAny(input, SEARCH_TRIGGERS.codeExample)) {
    needsSearch = true
    reason = "需要程式碼範例"
    searchType = "code"
    keywords = extractTechKeywords(userInput)
    confidence = 0.8
  }

  // 6. 文檔檢測
  else if (containsAny(input, SEARCH_TRIGGERS.documentation)) {
    needsSearch = true
    reason = "需要文檔說明"
    searchType = "doc"
    keywords = extractTechKeywords(userInput)
    confidence = 0.75
  }

  // 7. 外部服務檢測
  else if (containsAny(input + ctx, SEARCH_TRIGGERS.external)) {
    needsSearch = true
    reason = "涉及外部服務整合"
    searchType = "web"
    keywords = extractServiceKeywords(userInput)
    confidence = 0.7
  }

  // 8. 不確定語氣
  else if (containsAny(input, SEARCH_TRIGGERS.uncertain)) {
    needsSearch = true
    reason = "語氣不確定，可能需要更多資訊"
    searchType = "web"
    keywords = extractTopicKeywords(userInput)
    confidence = 0.6
  }

  // 9. 檢查 context 是否已有相關資訊
  if (context && containsRelevantContext(context, keywords)) {
    needsSearch = false
    reason = "上下文中已有相關資訊"
    confidence = 0.95
  }

  // 儲存快取
  const decision: SearchDecision = { needsSearch, reason, searchType, keywords, confidence }
  cache[cacheKey] = { ...decision, timestamp: Date.now() }
  await saveCache(cache)

  return decision
}

// 輔助函數
function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw.toLowerCase()) || text.includes(kw))
}

function extractErrorKeywords(input: string): string[] {
  const errors = input.match(/[A-Z]{2,}\d+|\berror\b|\bTS\d+|\bE\d+/gi) || []
  const words = input.match(/\b(fix|solve|解決|錯誤|問題)\b/gi) || []
  return [...errors, ...words].slice(0, 5)
}

function extractTechKeywords(input: string): string[] {
  const tech = input.match(/\b(js|ts|react|node|python|api|sql|git|docker|k8s)\b/gi) || []
  return tech.slice(0, 5)
}

function extractTopicKeywords(input: string): string[] {
  const words = input.split(/[\s,，。]/).filter((w) => w.length > 2)
  return words.slice(0, 5)
}

function extractServiceKeywords(input: string): string[] {
  const services = input.match(/\b(telegram|discord|slack|line|webhook|notify|team|signal)\b/gi) || []
  return services.slice(0, 5)
}

function containsRelevantContext(context: string, keywords: string[]): boolean {
  if (!keywords.length) return false
  const ctx = context.toLowerCase()
  return keywords.some((kw) => ctx.includes(kw.toLowerCase()))
}

function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(36)
}

async function loadCache(): Promise<Record<string, any>> {
  try {
    return JSON.parse(await Bun.file(DECISION_CACHE).text())
  } catch {
    return {}
  }
}

async function saveCache(cache: Record<string, any>): Promise<void> {
  await Bun.write(DECISION_CACHE, JSON.stringify(cache, null, 2))
}

// 快速判斷介面
async function quickCheck(input: string): Promise<{
  search: boolean
  type: string
  reason: string
}> {
  const decision = await shouldSearch(input)
  return {
    search: decision.needsSearch,
    type: decision.searchType,
    reason: decision.reason,
  }
}

export { shouldSearch, quickCheck }
