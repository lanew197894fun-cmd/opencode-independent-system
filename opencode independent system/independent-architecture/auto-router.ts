// 智能自動路由系統 - 根據關鍵字自動選擇合適的功能

interface RouteRule {
  keywords: string[]
  priority: number
  category: string
  description: string
}

interface RouterResult {
  matched: boolean
  category: string
  description: string
  confidence: number
}

export class AutoRouter {
  private rules: RouteRule[] = [
    // 記憶系統
    {
      keywords: ["記住", "記憶", "remember", "記錄", "save", "密码", "記住這個", "幫我記住"],
      priority: 95,
      category: "memory",
      description: "記憶系統",
    },
    {
      keywords: ["搜尋", "找", "search", "recall", "查", "尋找"],
      priority: 85,
      category: "memory",
      description: "記憶搜尋",
    },
    { keywords: ["忘記", "刪除記憶", "forget", "忘記這個"], priority: 80, category: "memory", description: "記憶刪除" },

    // 安全系統
    { keywords: ["安全", "security", "vpn", "防護"], priority: 95, category: "security", description: "安全系統" },
    { keywords: ["掃描", "scan", "檢查漏洞"], priority: 90, category: "security", description: "安全掃描" },
    { keywords: ["defense", "防禦", "24h", "24小時"], priority: 88, category: "security", description: "24H防禦" },

    // 修復系統
    {
      keywords: ["修復", "fix", "repair", "問題", "error", "错误", "坏", "壞"],
      priority: 95,
      category: "repair",
      description: "修復系統",
    },
    { keywords: ["debug", "除錯", "錯誤", "报错"], priority: 90, category: "repair", description: "除錯系統" },

    // 通訊
    { keywords: ["discord", "DC", "Discord", "dc"], priority: 95, category: "discord", description: "Discord" },
    { keywords: ["telegram", "TG", "電報", "tg"], priority: 95, category: "telegram", description: "Telegram" },
    { keywords: ["slack"], priority: 95, category: "slack", description: "Slack" },
    { keywords: ["line", "LINE", "LINE@"], priority: 95, category: "line", description: "LINE" },
    { keywords: ["whatsapp", "WA", "WhatsApp", "wa"], priority: 95, category: "whatsapp", description: "WhatsApp" },

    // 開發工具
    { keywords: ["github", "git", "GitHub", "gh"], priority: 90, category: "github", description: "GitHub" },
    { keywords: ["mcporter", "mcp"], priority: 95, category: "mcporter", description: "MCP工具" },
    { keywords: ["skill", "技能", "create", "創建"], priority: 85, category: "skill", description: "技能創建" },

    // 數據分析
    {
      keywords: ["summarize", "摘要", "總結", "這篇", "文章"],
      priority: 90,
      category: "summarize",
      description: "摘要生成",
    },
    { keywords: ["model", "模型", "usage", "用量"], priority: 85, category: "model", description: "模型分析" },

    // 系統監控
    {
      keywords: ["監控", "monitor", "狀態", "status", "查看"],
      priority: 90,
      category: "monitor",
      description: "系統監控",
    },
    { keywords: ["health", "健康", "檢查", "检查"], priority: 85, category: "monitor", description: "健康檢查" },

    // 學習系統
    { keywords: ["學習", "learn", "lesson", "學"], priority: 85, category: "learn", description: "學習系統" },
    { keywords: ["經驗", "experience", "筆記", "经验"], priority: 80, category: "learn", description: "經驗記錄" },

    // 檔案/儲存
    { keywords: ["備份", "backup", "保存", "存檔", "备份"], priority: 95, category: "backup", description: "備份系統" },
    { keywords: ["同步", "sync", "上傳", "上传", "同步到"], priority: 85, category: "backup", description: "同步系統" },

    // 語音/通話
    {
      keywords: ["語音", "voice", "call", "通話", "打电话", "语音"],
      priority: 95,
      category: "voice",
      description: "語音系統",
    },
    { keywords: ["tts", "文字轉語音", "speech", "说话"], priority: 85, category: "voice", description: "TTS系統" },

    // AI/模型
    { keywords: ["ai", "AI", "人工智慧"], priority: 75, category: "ai", description: "AI系統" },
    { keywords: ["claude", "gpt", "gemini", "模型"], priority: 80, category: "model", description: "模型切換" },

    // 系統
    {
      keywords: ["重啟", "restart", "啟動", "start", "启动", "開啟"],
      priority: 90,
      category: "system",
      description: "系統控制",
    },
    { keywords: ["停止", "stop", "關閉", "关闭"], priority: 85, category: "system", description: "系統停止" },
    { keywords: ["menu", "選單", "功能", "菜單", "选单"], priority: 85, category: "menu", description: "功能選單" },

    // 檔案/儲存
    { keywords: ["備份", "backup", "save"], priority: 90, category: "backup", description: "備份系統" },
    { keywords: ["同步", "sync", "上傳"], priority: 85, category: "backup", description: "同步系統" },

    // 語音/通話
    { keywords: ["語音", "voice", "call", "通話"], priority: 90, category: "voice", description: "語音系統" },
    { keywords: ["tts", "文字轉語音", "speech"], priority: 85, category: "voice", description: "TTS系統" },

    // AI/模型
    { keywords: ["ai", "AI", "人工智慧"], priority: 75, category: "ai", description: "AI系統" },
    { keywords: ["claude", "gpt", "gemini"], priority: 80, category: "model", description: "模型切換" },

    // 系統
    { keywords: ["重啟", "restart", "啟動", "start"], priority: 85, category: "system", description: "系統控制" },
    { keywords: ["停止", "stop", "關閉"], priority: 85, category: "system", description: "系統停止" },
    { keywords: ["menu", "選單", "功能"], priority: 80, category: "menu", description: "功能選單" },
  ]

  route(input: string): RouterResult {
    const lower = input.toLowerCase()
    let bestMatch: RouteRule | null = null
    let bestScore = 0
    let bestMatchLen = 0

    for (const rule of this.rules) {
      for (const keyword of rule.keywords) {
        const kwLower = keyword.toLowerCase()
        const kwLen = kwLower.length

        // 完全匹配 (最高優先)
        if (lower === kwLower) {
          const score = rule.priority * 1.0 + 10
          if (score > bestScore || (score === bestScore && kwLen > bestMatchLen)) {
            bestScore = score
            bestMatch = rule
            bestMatchLen = kwLen
          }
        }
        // 輸入完全包含關鍵字 (高優先，關鍵字越長越精確)
        else if (lower.includes(kwLower) && kwLen >= 2) {
          const score = rule.priority * 0.9 + kwLen * 0.5
          if (score > bestScore || (score === bestScore && kwLen > bestMatchLen)) {
            bestScore = score
            bestMatch = rule
            bestMatchLen = kwLen
          }
        }
      }
    }

    if (bestMatch && bestScore >= 40) {
      return {
        matched: true,
        category: bestMatch.category,
        description: bestMatch.description,
        confidence: Math.min(bestScore / 100, 0.99),
      }
    }

    return {
      matched: false,
      category: "general",
      description: "一般對話",
      confidence: 0.5,
    }
  }

  getCategoryDescription(category: string): string {
    const rule = this.rules.find((r) => r.category === category)
    return rule?.description || "未知類別"
  }

  addRule(rule: RouteRule) {
    this.rules.push(rule)
  }

  getAllCategories(): string[] {
    return [...new Set(this.rules.map((r) => r.category))]
  }
}

export const autoRouter = new AutoRouter()
export default AutoRouter
