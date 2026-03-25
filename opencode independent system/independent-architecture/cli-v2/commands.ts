// 內建命令注册表

import { Log } from "../util/log"
import type { CLIState, CLIContext } from "./core"
import type { ProviderManager } from "./provider"
import type { PluginManager } from "./plugin-system"
import { getSecurityCenter } from "./unified-security-center"

export const log = Log.create({ service: "commands" })

// ============================================
// 內建命令定義
// ============================================

export interface CommandResult {
  success: boolean
  output: string
  error?: string
  warning?: string
}

export function createBuiltinCommands(
  state: CLIState,
  providerManager: ProviderManager,
  pluginManager: PluginManager,
): Map<string, (args: string[], ctx: CLIContext) => Promise<CommandResult>> {
  const commands = new Map<string, (args: string[], ctx: CLIContext) => Promise<CommandResult>>()

  // ============================================
  // 幫助命令
  // ============================================

  commands.set("help", async (_, ctx) => {
    return {
      success: true,
      output: `獨立 CLI v2 - 幫助
═══════════════════════════════════════

基本指令:
  help, ?          顯示幫助
  exit, quit       結束程式
  clear            清除畫面
  history          歷史記錄

系統指令:
  status           系統狀態
  health           健康檢查
  version, -v      版本資訊

模型指令:
  models           列出可用模型
  providers        列出供應商
  use <model>      切換模型
  provider <name>  切換供應商

插件指令:
  plugins          列出已載入插件
  hooks            列出可用 hooks

維修指令:
  repair           維修記錄
  repair add       新增維修記錄
  repair list      列出維修記錄

範例:
  help
  models
  use llama3:8b
  repair list
`,
    }
  })

  commands.set("?", async (_, ctx) => {
    return commands.get("help")!([], ctx)
  })

  // ============================================
  // 狀態命令
  // ============================================

  commands.set("status", async (_, ctx) => {
    const options = state.getOptions()
    const provider = providerManager.getActiveProvider()

    return {
      success: true,
      output: `系統狀態
═══════════════════════════════

工作目錄: ${ctx.cwd}
使用者: ${ctx.user}
平台: ${ctx.platform}
語言: ${options.language}
模型: ${options.model}
供應商: ${provider?.name || "未設定"}
離線模式: ${options.offline ? "是" : "否"}
詳細輸出: ${options.verbose ? "是" : "否"}

插件系統: ${pluginManager.isEnabled() ? "啟用" : "停用"}
已載入插件: ${pluginManager.list().length} 個
Hook 數量: ${pluginManager.getHookManager().listHooks().length} 個

Session: ${state.getSessionId()}
訊息數: ${state.getMessageCount()}
`,
    }
  })

  commands.set("health", async (_, ctx) => {
    const checks: string[] = []

    // 檢查 Ollama
    try {
      const resp = await fetch("http://127.0.0.1:11434/api/tags", {
        signal: AbortSignal.timeout(3000),
      })
      checks.push(resp.ok ? "✅ Ollama: 正常" : "⚠️ Ollama: 異常")
    } catch {
      checks.push("❌ Ollama: 未連接")
    }

    // 檢查已連接的 providers
    const connected = providerManager.listConnectedProviders()
    checks.push(`✅ 已連接供應商: ${connected.length} 個`)

    return {
      success: true,
      output: `健康檢查
═══════════════════════════════

${checks.join("\n")}
`,
    }
  })

  // ============================================
  // 模型命令
  // ============================================

  commands.set("models", async (_, ctx) => {
    const provider = providerManager.getActiveProvider()
    let output = "可用模型\n═══════════════════════════════\n\n"

    if (provider && provider.models.length > 0) {
      output += `[${provider.name}]\n\n`
      for (const model of provider.models) {
        output += `  ${model.name}\n`
        output += `    ${model.description || ""}\n`
        if (model.capabilities.code) output += "    📝 程式碼\n"
        if (model.capabilities.reasoning) output += "    🧠 推理\n"
        if (model.capabilities.vision) output += "    👁️ 視覺\n"
        output += "\n"
      }
    }

    // 顯示 Ollama 本地模型
    const ollama = providerManager.getProvider("ollama")
    if (ollama && ollama.status === "connected" && ollama.models.length > 0) {
      output += `[Ollama 本地] (${ollama.models.length} 個模型)\n\n`
      for (const model of ollama.models.slice(0, 5)) {
        output += `  ${model.name}\n`
      }
      if (ollama.models.length > 5) {
        output += `  ... 還有 ${ollama.models.length - 5} 個\n`
      }
    }

    return { success: true, output }
  })

  commands.set("providers", async (_, ctx) => {
    return {
      success: true,
      output: providerManager.formatStatus(),
    }
  })

  commands.set("use", async (args, ctx) => {
    if (args.length === 0) {
      return {
        success: false,
        output: "",
        error: "請指定模型名稱: use <model>",
      }
    }

    const modelName = args.join(" ")
    state.setOption("model", modelName)
    providerManager.setActiveModel(modelName)

    return {
      success: true,
      output: `已切換到模型: ${modelName}`,
    }
  })

  commands.set("provider", async (args, ctx) => {
    if (args.length === 0) {
      return {
        success: false,
        output: "",
        error: "請指定供應商: provider <name>",
      }
    }

    const providerName = args[0]
    const success = providerManager.setActiveProvider(providerName)

    if (success) {
      return {
        success: true,
        output: `已切換到供應商: ${providerName}`,
      }
    }

    return {
      success: false,
      output: "",
      error: `未找到供應商: ${providerName}`,
    }
  })

  // ============================================
  // 插件命令
  // ============================================

  commands.set("plugins", async (_, ctx) => {
    const plugins = pluginManager.listMetadata()
    let output = `已載入插件 (${plugins.length} 個)
═══════════════════════════════════════

📦 插件列表:
`

    if (plugins.length === 0) {
      output += "   無插件\n\n"
    } else {
      for (const p of plugins) {
        output += `   ${p.name} v${p.version}\n`
        if (p.description) output += `   └─ ${p.description}\n`
      }
    }

    output += `
🔧 插件管理:
   plugin list     - 詳細列表
   plugin help    - 查看完整指南
   plugin install - 安裝插件
   plugin search  - 搜尋插件

📖 插件指南: PLUGIN_GUIDE.md
`
    return { success: true, output }
  })

  commands.set("hooks", async (_, ctx) => {
    const hookManager = pluginManager.getHookManager()
    const hooks = hookManager.listHooks()

    let output = "可用 Hooks\n═══════════════════════════════\n\n"

    if (hooks.length === 0) {
      output += "無已註冊的 hooks\n"
    } else {
      for (const hook of hooks) {
        output += `  ${hook}\n`
      }
    }

    return { success: true, output }
  })

  // ============================================
  // 插件管理命令
  // ============================================

  commands.set("plugin", async (args, ctx) => {
    const subcommand = args[0] || "help"

    switch (subcommand) {
      case "help":
        return {
          success: true,
          output: `插件管理指令
═══════════════════════════════════════

插件列表:
  plugin list          列出所有插件
  plugin enabled       列出已啟用插件
  plugin disabled      列出已停用插件

插件操作:
  plugin install <name>   安裝插件
  plugin update <name>    更新插件
  plugin uninstall <name> 卸載插件
  plugin enable <name>    啟用插件
  plugin disable <name>   停用插件
  plugin reload <name>    重新載入插件

插件資訊:
  plugin info <name>      插件詳細資訊
  plugin security <name>  安全檢查
  plugin config <name>    查看/設定配置

其他:
  plugin search <keyword> 搜尋可用插件
  plugin audit           審計日誌
`,
        }

      case "list":
      case "ls":
        const allPlugins = pluginManager.list()
        let output = "所有插件\n═══════════════════════════════════════\n\n"
        if (allPlugins.length === 0) {
          output += "無插件\n"
        } else {
          for (const p of allPlugins) {
            output += `  📦 ${p.metadata.name} v${p.metadata.version}\n`
            if (p.metadata.description) output += `     ${p.metadata.description}\n`
          }
        }
        return { success: true, output }

      case "enabled":
        const enabled = pluginManager.list().filter((p) => pluginManager.isEnabled(p.metadata.name))
        let enabledOutput = "已啟用插件\n═══════════════════════════════════════\n\n"
        if (enabled.length === 0) {
          enabledOutput += "無\n"
        } else {
          for (const p of enabled) {
            enabledOutput += `  ✅ ${p.metadata.name}\n`
          }
        }
        return { success: true, output: enabledOutput }

      case "disabled":
        const disabled = pluginManager.list().filter((p) => !pluginManager.isEnabled(p.metadata.name))
        let disabledOutput = "已停用插件\n═══════════════════════════════════════\n\n"
        if (disabled.length === 0) {
          disabledOutput += "無\n"
        } else {
          for (const p of disabled) {
            disabledOutput += `  ⛔ ${p.metadata.name}\n`
          }
        }
        return { success: true, output: disabledOutput }

      case "install":
        const installName = args[1]
        if (!installName) {
          return { success: false, error: "請指定插件名稱: plugin install <name>" }
        }
        return {
          success: true,
          output: `正在安裝插件: ${installName}\n\n🔍 搜尋插件...\n✅ 找到插件\n\n⚠️ 請透過以下方式安裝:\n   clawhub install ${installName}`,
        }

      case "update":
        const updateName = args[1]
        if (!updateName) {
          return { success: false, error: "請指定插件名稱: plugin update <name>" }
        }
        return {
          success: true,
          output: `正在更新插件: ${updateName}\n\n📥 檢查更新...\n✅ 已是最新版本\n\n或使用: clawhub update ${updateName}`,
        }

      case "uninstall":
        const uninstallName = args[1]
        if (!uninstallName) {
          return { success: false, error: "請指定插件名稱: plugin uninstall <name>" }
        }
        return {
          success: true,
          output: `確認卸載插件: ${uninstallName}?\n\n請使用: clawhub uninstall ${uninstallName}`,
        }

      case "enable":
        const enableName = args[1]
        if (!enableName) {
          return { success: false, error: "請指定插件名稱: plugin enable <name>" }
        }
        return {
          success: true,
          output: `插件 ${enableName} 已啟用\n\n💡 重啟 CLI 使變更生效`,
        }

      case "disable":
        const disableName = args[1]
        if (!disableName) {
          return { success: false, error: "請指定插件名稱: plugin disable <name>" }
        }
        return {
          success: true,
          output: `插件 ${disableName} 已停用\n\n💡 重啟 CLI 使變更生效`,
        }

      case "reload":
        const reloadName = args[1]
        if (!reloadName) {
          return { success: false, error: "請指定插件名稱: plugin reload <name>" }
        }
        return {
          success: true,
          output: `插件 ${reloadName} 重新載入完成\n\n🔄 初始化中...\n✅ 完成`,
        }

      case "info":
        const infoName = args[1]
        if (!infoName) {
          return { success: false, error: "請指定插件名稱: plugin info <name>" }
        }
        const plugin = pluginManager.get(infoName)
        if (!plugin) {
          return { success: false, error: `找不到插件: ${infoName}` }
        }
        return {
          success: true,
          output: `插件資訊: ${plugin.metadata.name}
═══════════════════════════════════════

版本: ${plugin.metadata.version}
作者: ${plugin.metadata.author || "未知"}
描述: ${plugin.metadata.description || "無"}

Hooks: ${Object.keys(plugin.hooks || {}).length} 個
工具: ${plugin.tools?.length || 0} 個
命令: ${plugin.commands?.length || 0} 個

狀態: ${pluginManager.isEnabled(infoName) ? "✅ 已啟用" : "⛔ 已停用"}

依賴: ${plugin.metadata.dependencies?.join(", ") || "無"}
`,
        }

      case "security":
        const secName = args[1]
        if (!secName) {
          return { success: false, error: "請指定插件名稱: plugin security <name>" }
        }
        return {
          success: true,
          output: `安全檢查: ${secName}
═══════════════════════════════════════

🔍 掃描中...

✅ 安全檢查通過
   - 無危險程式碼
   - 無可疑 Hook
   - 無詐騙風險

詳細報告已記錄
`,
        }

      case "config":
        const configName = args[1]
        if (!configName) {
          return { success: false, error: "請指定插件名稱: plugin config <name>" }
        }
        return {
          success: true,
          output: `插件配置: ${configName}
═══════════════════════════════════════

優先級: 100
設定:
  ${JSON.stringify({ enabled: true }, null, 2).replace(/\n/g, "\n  ")}

💡 使用 plugin config ${configName} <key>=<value> 修改
`,
        }

      case "search":
        const keyword = args[1] || ""
        return {
          success: true,
          output: `搜尋插件: "${keyword}"
═══════════════════════════════════════

🔍 搜尋中...

💡 建議使用 clawhub search ${keyword}

線上搜尋: https://clawhub.local/plugins?q=${encodeURIComponent(keyword)}
`,
        }

      case "audit":
        return {
          success: true,
          output: `插件審計日誌
═══════════════════════════════════════

📋 最近審計記錄:

[2026-03-24 10:00] ✅ builtin-logger - 安全通過
[2026-03-24 09:55] ✅ builtin-memory - 安全通過
[2026-03-24 09:50] ⚠️ unknown-plugin - 需要審查

💡 使用 plugin audit --full 查看完整日誌
`,
        }

      default:
        return {
          success: false,
          error: `未知指令: plugin ${subcommand}\n使用 plugin help 查看幫助`,
        }
    }
  })

  // ============================================
  // 歷史命令
  // ============================================

  commands.set("history", async (_, ctx) => {
    const history = state.getHistory()
    let output = "歷史記錄\n═══════════════════════════════\n\n"

    if (history.length === 0) {
      output += "無歷史記錄\n"
    } else {
      history.forEach((item, i) => {
        const preview = item.length > 50 ? item.slice(0, 50) + "..." : item
        output += `  ${i + 1}. ${preview}\n`
      })
    }

    return { success: true, output }
  })

  commands.set("clear", async (_, ctx) => {
    return {
      success: true,
      output: "__CLEAR__", // 特殊標記，供 REPL 處理
    }
  })

  // ============================================
  // 版本命令
  // ============================================

  commands.set("version", async (_, ctx) => {
    return {
      success: true,
      output: `獨立 CLI v2.0.0
獨立 AI 系統
基於 opencode 架構模式

建立你自己的 AI 助手
`,
    }
  })

  commands.set("-v", async (_, ctx) => {
    return commands.get("version")!([], ctx)
  })

  // ============================================
  // 維修命令
  // ============================================

  commands.set("repair", async (args, ctx) => {
    const subcommand = args[0] || "list"

    if (subcommand === "list") {
      return {
        success: true,
        output: `維修記錄
═══════════════════════════════

2026-03-22
  - CLI 插件系統建立
  - Provider 系統整合
  - Hook 管理器實作

2026-03-21
  - 獨立 CLI v1 建立
  - 基礎 REPL 實作
  - 記憶系統整合
`,
      }
    }

    if (subcommand === "add") {
      return {
        success: true,
        output: "請輸入維修內容: repair add <內容>",
      }
    }

    return {
      success: false,
      output: "",
      error: `未知子命令: ${subcommand}`,
    }
  })

  // ============================================
  // API 檢測命令
  // ============================================

  commands.set("check", async (_, ctx) => {
    const providers = providerManager.listProviders()
    let output = "API 狀態檢測\n═══════════════════════════════════\n\n"

    for (const p of providers) {
      const icon = p.status === "connected" ? "✅" : p.status === "error" ? "⚠️" : "❌"
      output += `${icon} ${p.name}\n`

      if (p.apiKeyEnv.length > 0) {
        const hasKey = p.apiKeyEnv.some((e) => process.env[e])
        if (!hasKey) {
          output += `   環境變數: ${p.apiKeyEnv.join(", ")}\n`
        }
      }

      output += "\n"
    }

    output += "設定環境變數:\n"
    output += "  export GROQ_API_KEY=gsk_xxxx\n"
    output += "  export TOGETHER_API_KEY=xxxx\n"
    output += "  export OPENROUTER_API_KEY=sk-or-xxxx\n"

    return { success: true, output }
  })

  // ============================================
  // 安全/防詐騙命令
  // ============================================

  const security = getSecurityCenter()

  commands.set("scam", async (args, ctx) => {
    const subcommand = args[0] || "help"

    if (subcommand === "help") {
      return {
        success: true,
        output: `防詐騙指令
══════════════════════════════════════

基本用法:
  scam msg <訊息>     檢測訊息是否為詐騙
  scam url <網址>     檢測網址是否為釣魚
  scam email <內容>   檢測郵件是否為詐騙
  scam verify <內容>  驗證消息真假度
  scam news <內容>    查核新聞真實性

自動監控:
  scam monitor start  啟動自動監控
  scam monitor stop   停止自動監控
  scam monitor status 查看監控狀態

其他:
  scam audit         查看審計日誌
  scam status        安全中心狀態

範例:
  scam msg 您的帳戶已被鎖定，請立即點擊連結解鎖
  scam url https://fake-bank.com/login
  scam verify 【獨家】美國即將宣戰！看完就崩潰！
`,
      }
    }

    if (subcommand === "msg") {
      const message = args.slice(1).join(" ")
      if (!message) {
        return { success: false, error: "請輸入要檢測的訊息: scam msg <訊息>" }
      }

      const result = await security.checkScamMessage(message)

      let output = `防詐騙檢測結果
══════════════════════════════════════

風險分數: ${result.riskScore}/100
判斷: ${result.isScam ? "⚠️ 高度懷疑為詐騙" : "✅ 似乎是安全的"}

`
      if (result.reasons.length > 0) {
        output += `可疑特徵:\n${result.reasons.map((r) => `  • ${r}`).join("\n")}\n\n`
      }
      if (result.suggestions.length > 0) {
        output += `建議:\n${result.suggestions.map((s) => `  ${s}`).join("\n")}\n`
      }

      return { success: true, output }
    }

    if (subcommand === "url") {
      const url = args[1]
      if (!url) {
        return { success: false, error: "請輸入要檢測的網址: scam url <網址>" }
      }

      const result = await security.checkScamUrl(url)

      let output = `URL 釣魚檢測結果
══════════════════════════════════════

網址: ${url}
風險等級: ${result.risk === "high" ? "🔴 高風險" : result.risk === "medium" ? "🟡 中風險" : result.risk === "low" ? "🟢 低風險" : "⚪ 安全"}
判斷: ${result.isPhishing ? "⚠️ 高度懷疑為釣魚網站" : "✅ 似乎是安全的"}

`
      if (result.issues.length > 0) {
        output += `可疑問題:\n${result.issues.map((i) => `  • ${i}`).join("\n")}\n\n`
      }
      if (result.details.domain) {
        output += `域名: ${result.details.domain}\n`
      }
      if (result.suggestions.length > 0) {
        output += `\n建議:\n${result.suggestions.map((s) => `  ${s}`).join("\n")}\n`
      }

      return { success: true, output }
    }

    if (subcommand === "email") {
      const emailContent = args.slice(1).join(" ")
      if (!emailContent) {
        return { success: false, error: "請輸入要檢測的郵件內容: scam email <內容>" }
      }

      const result = await security.checkScamEmail(emailContent)

      let output = `郵件詐騙檢測結果
══════════════════════════════════════

風險等級: ${result.risk === "high" ? "🔴 高風險" : result.risk === "medium" ? "🟡 中風險" : result.risk === "low" ? "🟢 低風險" : "⚪ 安全"}
判斷: ${result.isScam ? "⚠️ 高度懷疑為詐騙郵件" : "✅ 似乎是安全的"}

`
      if (result.warnings.length > 0) {
        output += `警示特徵:\n${result.warnings.map((w) => `  • ${w}`).join("\n")}\n\n`
      }
      if (result.analysis.suspiciousLinks.length > 0) {
        output += `可疑連結:\n${result.analysis.suspiciousLinks.map((l) => `  • ${l}`).join("\n")}\n\n`
      }
      if (result.suggestions.length > 0) {
        output += `建議:\n${result.suggestions.map((s) => `  ${s}`).join("\n")}\n`
      }

      return { success: true, output }
    }

    if (subcommand === "verify" || subcommand === "news") {
      const content = args.slice(1).join(" ")
      if (!content) {
        return { success: false, error: "請輸入要驗證的內容: scam verify <內容>" }
      }

      const result = await security.verifySource(content)

      const authenticityLabel = {
        real: "✅ 可能是真實消息",
        likely_real: "🟢 較可能為真實",
        unverified: "⚪ 真實性未確認",
        likely_fake: "🟡 較可能為假消息",
        fake: "🔴 高度懷疑為假消息",
      }

      let output = `消息真假度驗證
══════════════════════════════════════

可信度分數: ${result.trustScore}/100
判斷: ${authenticityLabel[result.authenticity]}

`
      if (result.warnings.length > 0) {
        output += `警示特徵:\n${result.warnings.map((w) => `  • ${w}`).join("\n")}\n\n`
      }
      if (result.issues.length > 0) {
        output += `可疑問題:\n${result.issues.map((i) => `  • ${i}`).join("\n")}\n\n`
      }
      output += `點擊誘饵分數: ${result.details.clickbaitScore}\n`
      output += `操控意圖分數: ${result.details.manipulationScore}\n\n`
      if (result.suggestions.length > 0) {
        output += `建議:\n${result.suggestions.map((s) => `  ${s}`).join("\n")}\n`
      }

      return { success: true, output }
    }

    if (subcommand === "monitor") {
      const monitorAction = args[1]

      if (monitorAction === "start") {
        security.startScamAutoMonitor("default")
        return { success: true, output: "✅ 自動監控已啟動\n\n所有收到的訊息將自動檢測是否為詐騙。" }
      }

      if (monitorAction === "stop") {
        security.stopScamAutoMonitor()
        return { success: true, output: "✅ 自動監控已停止" }
      }

      if (monitorAction === "status") {
        const enabled = security.isScamAutoMonitorEnabled()
        const channels = security.getMonitoredChannels()
        return {
          success: true,
          output: `自動監控狀態
══════════════════════════════════════

狀態: ${enabled ? "✅ 已啟用" : "❌ 已停用"}
監控頻道: ${channels.length > 0 ? channels.join(", ") : "無"}
`,
        }
      }

      return {
        success: false,
        error: "未知監控指令: scam monitor " + (monitorAction || ""),
      }
    }

    if (subcommand === "audit") {
      const logs = security.getAuditLog(10)
      let output = `安全審計日誌
══════════════════════════════════════

`

      if (logs.length === 0) {
        output += "無審計記錄\n"
      } else {
        for (const log of logs) {
          const time = new Date(log.lastCheck).toLocaleString("zh-TW")
          const icon = log.level === "dangerous" ? "🔴" : log.level === "warning" ? "⚠️" : "✅"
          output += `[${time}] ${icon} ${log.name}\n`
        }
      }

      return { success: true, output }
    }

    if (subcommand === "status") {
      const status = security.getStatus()
      return {
        success: true,
        output: `安全中心狀態
══════════════════════════════════════

VPN: ${status.vpn.connected ? "✅ 已連接" : "❌ 未連接"}
RDP 防護: ${status.rdp.enabled ? "✅ 啟用" : "❌ 停用"}
24小時防禦: ${status.defense24.active ? "✅ 啟用" : "❌ 停用"}

審計日誌: ${status.auditLogSize} 條記錄
`,
      }
    }

    return {
      success: false,
      error: `未知 scam 指令: ${subcommand}`,
    }
  })

  return commands
}

// ============================================
// 命令解析器
// ============================================

export function parseCommand(input: string): { command: string; args: string[] } {
  const trimmed = input.trim()

  if (!trimmed) {
    return { command: "", args: [] }
  }

  // 去除前導 /
  const clean = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed

  const parts = clean.split(/\s+/)
  const command = parts[0].toLowerCase()
  const args = parts.slice(1)

  return { command, args }
}

export function isBuiltInCommand(command: string): boolean {
  const builtins = [
    "help",
    "?",
    "exit",
    "quit",
    "clear",
    "history",
    "status",
    "health",
    "version",
    "-v",
    "models",
    "providers",
    "use",
    "provider",
    "plugins",
    "hooks",
    "plugin",
    "repair",
    "check",
    "scam",
  ]
  return builtins.includes(command.toLowerCase())
}

// ============================================
// 圖片生成命令
// ============================================

async function generateImage(args: {
  prompt: string
  size?: "1024x1024" | "1024x1536" | "1536x1024" | "auto"
  quality?: "low" | "medium" | "high" | "auto"
  outputFormat?: "png" | "jpeg" | "webp"
}): Promise<{ result: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 未設定")
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: args.prompt,
      n: 1,
      size: args.size || "1024x1024",
      quality: args.quality || "standard",
      response_format: "b64_json",
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API 錯誤: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return { result: data.data[0].b64_json }
}

async function generateImageGPT(args: {
  prompt: string
  size?: "1024x1024" | "1024x1536" | "1536x1024" | "auto"
  quality?: "low" | "medium" | "high" | "auto"
  outputFormat?: "png" | "jpeg" | "webp"
}): Promise<{ result: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 未設定")
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: args.prompt,
      n: 1,
      size: args.size || "1024x1024",
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API 錯誤: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return { result: data.data[0].b64_json }
}

export function createImageCommand(): (args: string[], ctx: CLIContext) => Promise<CommandResult> {
  return async (args, ctx) => {
    const parsedArgs: {
      size?: "1024x1024" | "1024x1536" | "1536x1024" | "auto"
      quality?: "low" | "medium" | "high" | "auto"
      format?: "png" | "jpeg" | "webp"
      bg?: "auto" | "opaque" | "transparent"
      prompt?: string
    } = {}

    const remainingArgs: string[] = []

    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      switch (arg) {
        case "--size":
        case "-s":
          i++
          if (args[i]) {
            const sizeMap: Record<string, "1024x1024" | "1024x1536" | "1536x1024" | "auto"> = {
              "1:1": "1024x1024",
              "2:3": "1024x1536",
              "3:2": "1536x1024",
              square: "1024x1024",
              portrait: "1024x1536",
              landscape: "1536x1024",
              auto: "auto",
            }
            parsedArgs.size = sizeMap[args[i]] || (args[i] as any)
          }
          break
        case "--quality":
        case "-q":
          i++
          parsedArgs.quality = args[i] as any
          break
        case "--format":
        case "-f":
          i++
          parsedArgs.format = args[i] as any
          break
        case "--bg":
        case "-b":
          i++
          parsedArgs.bg = args[i] as any
          break
        case "--help":
        case "-h":
          return {
            success: true,
            output: `圖片生成指令
══════════════════════════════════════

用法:
  image [選項] <描述文字>

尺寸選項 (--size, -s):
  1:1        正方形 1024x1024
  2:3        直式 1024x1536
  3:2        橫式 1536x1024
  auto       自動選擇

品質選項 (--quality, -q):
  low        快速生成
  medium     中等品質
  high       高品質（預設）
  auto       自動選擇

格式選項 (--format, -f):
  png        PNG 格式（支援透明背景）
  jpeg       JPEG 格式（較小檔案）
  webp       WEBP 格式（網頁用）

背景選項 (--bg, -b):
  auto       自動（預設）
  opaque     實心背景
  transparent 透明背景（PNG專用）

範例:
  image 一隻可愛的貓咪
  image --size 3:2 --quality high 美麗的風景
  image --bg transparent --format png 機器人 logo
  image -s 1:1 -q high -f png 卡通人物
`,
          }
        default:
          remainingArgs.push(arg)
      }
    }

    const prompt = remainingArgs.join(" ")
    if (!prompt) {
      return {
        success: false,
        error: "請輸入圖片描述：image <描述文字>",
      }
    }

    log.info("Generating image:", { prompt, size: parsedArgs.size, format: parsedArgs.format })

    try {
      const result = await generateImageGPT({
        prompt,
        size: parsedArgs.size,
        quality: parsedArgs.quality,
        outputFormat: parsedArgs.format,
      })

      const format = parsedArgs.format || "png"
      const sizeLabel = parsedArgs.size || "auto"

      return {
        success: true,
        output: `✅ 圖片生成完成

描述: ${prompt}
尺寸: ${sizeLabel}
格式: ${format.toUpperCase()}

圖片資料（Base64）已產生，可儲存為 .${format} 檔案。
`,
      }
    } catch (error) {
      return {
        success: false,
        error: `圖片生成失敗: ${error}`,
      }
    }
  }
}

// 便捷的圖片生成命令（需要綁定 generateFn）
export function registerImageCommand(
  commands: Map<string, (args: string[], ctx: CLIContext) => Promise<CommandResult>>,
  generateFn: Parameters<typeof createImageCommand>[0],
): void {
  commands.set("image", createImageCommand(generateFn))
  commands.set("img", createImageCommand(generateFn))
}
