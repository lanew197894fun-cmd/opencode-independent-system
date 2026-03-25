// 雙語翻譯系統 (i18n)
// 支援繁體中文和英文，自動識別和轉換

export type Language = "zh-TW" | "en" | "auto"

export const DEFAULT_LANGUAGE: Language = "zh-TW"

interface TranslationEntry {
  zhTW: string
  en: string
}

type TranslationMap = Record<string, TranslationEntry>

export const translations: TranslationMap = {
  // 系統標題
  "system.name": { zhTW: "獨立架構", en: "IndependentArchitecture" },
  "system.fullname": { zhTW: "獨立架構 CLI", en: "IndependentArchitecture CLI" },
  "system.tagline": { zhTW: "獨立 AI 系統 for Linux", en: "Standalone AI System for Linux" },
  "system.version": { zhTW: "版本", en: "Version" },

  // 幫助指令
  "help.title": { zhTW: "幫助", en: "Help" },
  "help.basic": { zhTW: "基本指令", en: "Basic Commands" },
  "help.system": { zhTW: "系統指令", en: "System Commands" },
  "help.memory": { zhTW: "記憶指令", en: "Memory Commands" },
  "help.security": { zhTW: "安全指令", en: "Security Commands" },
  "help.setting": { zhTW: "設定指令", en: "Settings Commands" },
  "help.hint": { zhTW: "提示", en: "Hint" },

  // 基本指令
  "cmd.help": { zhTW: "幫助", en: "Help" },
  "cmd.exit": { zhTW: "退出", en: "Exit" },
  "cmd.quit": { zhTW: "離開", en: "Quit" },
  "cmd.clear": { zhTW: "清屏", en: "Clear" },
  "cmd.history": { zhTW: "歷史", en: "History" },
  "cmd.status": { zhTW: "狀態", en: "Status" },
  "cmd.health": { zhTW: "健康檢查", en: "Health Check" },
  "cmd.version": { zhTW: "版本", en: "Version" },
  "cmd.plugins": { zhTW: "插件列表", en: "Plugins" },
  "cmd.set": { zhTW: "設定", en: "Set" },

  // 狀態訊息
  "status.online": { zhTW: "在線模式", en: "Online Mode" },
  "status.offline": { zhTW: "離線模式", en: "Offline Mode" },
  "status.healthy": { zhTW: "健康", en: "Healthy" },
  "status.warning": { zhTW: "警告", en: "Warning" },
  "status.critical": { zhTW: "危險", en: "Critical" },
  "status.enabled": { zhTW: "已啟用", en: "Enabled" },
  "status.disabled": { zhTW: "已停用", en: "Disabled" },
  "status.running": { zhTW: "運行中", en: "Running" },
  "status.stopped": { zhTW: "已停止", en: "Stopped" },
  "status.success": { zhTW: "成功", en: "Success" },
  "status.failed": { zhTW: "失敗", en: "Failed" },

  // 記憶系統
  "memory.title": { zhTW: "記憶容器", en: "Memory Container" },
  "memory.recall": { zhTW: "搜尋記憶", en: "Recall Memory" },
  "memory.store": { zhTW: "儲存記憶", en: "Store Memory" },
  "memory.list": { zhTW: "記憶列表", en: "Memory List" },
  "memory.forget": { zhTW: "刪除記憶", en: "Forget Memory" },
  "memory.stats": { zhTW: "記憶統計", en: "Memory Stats" },
  "memory.empty": { zhTW: "目前沒有記憶", en: "No memories yet" },
  "memory.found": { zhTW: "找到", en: "Found" },
  "memory.stored": { zhTW: "已儲存", en: "Stored" },
  "memory.deleted": { zhTW: "已刪除", en: "Deleted" },

  // 維修系統
  "repair.title": { zhTW: "維修記錄", en: "Repair Records" },
  "repair.add": { zhTW: "新增維修", en: "Add Repair" },
  "repair.list": { zhTW: "維修列表", en: "Repair List" },
  "repair.find": { zhTW: "搜尋維修", en: "Find Repair" },
  "repair.example": { zhTW: "維修範例", en: "Repair Examples" },
  "repair.problem": { zhTW: "問題", en: "Problem" },
  "repair.cause": { zhTW: "原因", en: "Cause" },
  "repair.solution": { zhTW: "解決方案", en: "Solution" },
  "repair.steps": { zhTW: "步驟", en: "Steps" },
  "repair.resolved": { zhTW: "已解決", en: "Resolved" },
  "repair.pending": { zhTW: "待處理", en: "Pending" },

  // 技能系統
  "skill.title": { zhTW: "技能索引", en: "Skill Index" },
  "skill.list": { zhTW: "技能列表", en: "Skill List" },
  "skill.index": { zhTW: "建立索引", en: "Build Index" },
  "skill.find": { zhTW: "搜尋技能", en: "Find Skill" },
  "skill.trigger": { zhTW: "觸發詞", en: "Triggers" },

  // 安全系統
  "security.title": { zhTW: "安全系統", en: "Security System" },
  "security.start": { zhTW: "啟動安全", en: "Start Security" },
  "security.stop": { zhTW: "停止安全", en: "Stop Security" },
  "security.status": { zhTW: "安全狀態", en: "Security Status" },
  "security.vpn": { zhTW: "VPN 網關", en: "VPN Gateway" },
  "security.defense": { zhTW: "24H 防禦", en: "24H Defense" },
  "security.sandbox": { zhTW: "沙盒系統", en: "Sandbox" },
  "security.dependency": { zhTW: "依賴風險", en: "Dependency Risk" },
  "security.rollback": { zhTW: "回滾管理", en: "Rollback Manager" },

  // 專案系統
  "project.title": { zhTW: "專案管理", en: "Project Management" },
  "project.add": { zhTW: "新增專案", en: "Add Project" },
  "project.list": { zhTW: "專案列表", en: "Project List" },
  "project.context": { zhTW: "專案上下文", en: "Project Context" },
  "project.stack": { zhTW: "技術棧", en: "Tech Stack" },
  "project.decisions": { zhTW: "專案決策", en: "Decisions" },
  "project.issues": { zhTW: "記錄問題", en: "Issues" },

  // 設定系統
  "setting.title": { zhTW: "設定", en: "Settings" },
  "setting.language": { zhTW: "語言", en: "Language" },
  "setting.model": { zhTW: "模型", en: "Model" },
  "setting.offline": { zhTW: "離線模式", en: "Offline Mode" },
  "setting.verbose": { zhTW: "詳細輸出", en: "Verbose Output" },
  "setting.color": { zhTW: "彩色輸出", en: "Color Output" },

  // 選單系統
  "menu.title": { zhTW: "功能選單", en: "Function Menu" },
  "menu.gateway": { zhTW: "🌐 網關服務", en: "🌐 Gateway Services" },
  "menu.messaging": { zhTW: "💬 訊息機器人", en: "💬 Messaging Bots" },
  "menu.monitor": { zhTW: "📊 監控服務", en: "📊 Monitor Services" },
  "menu.automation": { zhTW: "🏠 自動化", en: "🏠 Automation" },
  "menu.utility": { zhTW: "🛠️ 工具", en: "🛠️ Utilities" },
  "menu.backup": { zhTW: "💾 備份同步", en: "💾 Backup & Sync" },

  // 通用
  "common.loading": { zhTW: "載入中...", en: "Loading..." },
  "common.done": { zhTW: "完成", en: "Done" },
  "common.error": { zhTW: "錯誤", en: "Error" },
  "common.warning": { zhTW: "警告", en: "Warning" },
  "common.info": { zhTW: "資訊", en: "Info" },
  "common.count": { zhTW: "數量", en: "Count" },
  "common.time": { zhTW: "時間", en: "Time" },
  "common.type": { zhTW: "類型", en: "Type" },
  "common.category": { zhTW: "分類", en: "Category" },
  "common.search": { zhTW: "搜尋", en: "Search" },
  "common.add": { zhTW: "新增", en: "Add" },
  "common.delete": { zhTW: "刪除", en: "Delete" },
  "common.update": { zhTW: "更新", en: "Update" },
  "common.list": { zhTW: "列表", en: "List" },
  "common.show": { zhTW: "顯示", en: "Show" },
  "common.hide": { zhTW: "隱藏", en: "Hide" },
  "common.start": { zhTW: "啟動", en: "Start" },
  "common.stop": { zhTW: "停止", en: "Stop" },
  "common.restart": { zhTW: "重啟", en: "Restart" },

  // 時間格式
  "time.just_now": { zhTW: "剛剛", en: "Just now" },
  "time.minutes_ago": { zhTW: "分鐘前", en: "minutes ago" },
  "time.hours_ago": { zhTW: "小時前", en: "hours ago" },
  "time.days_ago": { zhTW: "天前", en: "days ago" },
}

export class I18n {
  private currentLang: Language = DEFAULT_LANGUAGE
  private fallbackLang: Language = "en"

  constructor(lang: Language = DEFAULT_LANGUAGE) {
    this.currentLang = lang
  }

  setLanguage(lang: Language): void {
    this.currentLang = lang
  }

  getLanguage(): Language {
    return this.currentLang
  }

  t(key: string, params?: Record<string, string | number>): string {
    const entry = translations[key]
    if (!entry) {
      return key
    }

    let text = entry.zhTW

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v))
      }
    }

    return text
  }

  tRaw(key: string, params?: Record<string, string | number>): string {
    const entry = translations[key]
    if (!entry) {
      return key
    }

    let text = this.currentLang === "en" ? entry.en : entry.zhTW

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v))
      }
    }

    return text
  }

  detectLanguage(text: string): Language {
    const zhChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const enChars = (text.match(/[a-zA-Z]/g) || []).length

    if (zhChars > enChars * 0.3) {
      return DEFAULT_LANGUAGE
    }
    return "en"
  }

  autoDetect(text: string): I18n {
    this.currentLang = this.detectLanguage(text)
    return this
  }

  bilingual(key: string, params?: Record<string, string | number>): string {
    const entry = translations[key]
    if (!entry) {
      return key
    }

    let text = `${entry.zhTW} / ${entry.en}`

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v))
      }
    }

    return text
  }

  zh(key: string, params?: Record<string, string | number>): string {
    const entry = translations[key]
    if (!entry) {
      return key
    }

    let text = entry.zhTW
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v))
      }
    }

    return text
  }

  en(key: string, params?: Record<string, string | number>): string {
    const entry = translations[key]
    if (!entry) {
      return key
    }

    let text = entry.en
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v))
      }
    }

    return text
  }
}

export const i18n = new I18n()

export function createI18n(lang?: Language): I18n {
  return new I18n(lang)
}

export default I18n
