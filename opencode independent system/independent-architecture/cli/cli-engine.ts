// 獨立 CLI 核心引擎

import { homedir } from "os"
import { join } from "path"
import { existsSync, mkdirSync } from "fs"
import { IndependentArchitectureSystem } from "../independent-architecture-system"
import { PluginManager, getDefaultPlugins } from "../plugin-system"
import { CommandContext, CLIOptions, SessionConfig, OutputFormatter } from "./cli-types"

export interface CLISession {
  id: string
  startedAt: number
  messageCount: number
  mode: "interactive" | "batch" | "single"
  context: CommandContext
}

export interface CLIResponse {
  success: boolean
  output: string
  confidence?: number
  executionTime: number
  mode: "text" | "json" | "markdown"
  metadata?: Record<string, any>
}

export class IndependentArchitectureCLI {
  private system: IndependentArchitectureSystem
  private pluginManager: PluginManager | null = null
  private session!: CLISession
  private options: Required<CLIOptions>
  private dataDir: string

  constructor(options: CLIOptions = {}) {
    this.dataDir = options.dataDir || join(homedir(), ".independent-architecture", "cli")
    this.options = {
      enablePlugins: options.enablePlugins ?? true,
      enableMemory: options.enableMemory ?? true,
      enableSecurity: options.enableSecurity ?? true,
      enableLocalModel: options.enableLocalModel ?? true,
      verbose: options.verbose ?? false,
      color: options.color ?? true,
      language: options.language ?? "zh-TW",
      model: options.model || "auto",
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 4096,
      offline: options.offline ?? false,
      contextWindow: options.contextWindow ?? 10,
      dataDir: this.dataDir,
    }

    this.ensureDataDir()
    this.system = new IndependentArchitectureSystem({ enablePlugins: this.options.enablePlugins })
    this.initSession()
  }

  private ensureDataDir(): void {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true })
    }
  }

  private initSession(): void {
    this.session = {
      id: `session-${Date.now()}`,
      startedAt: Date.now(),
      messageCount: 0,
      mode: "interactive",
      context: {
        cwd: process.cwd(),
        user: process.env.USER || "user",
        hostname: process.env.HOSTNAME || "localhost",
        platform: process.platform,
        timestamp: Date.now(),
      },
    }
  }

  async process(input: string): Promise<CLIResponse> {
    const startTime = Date.now()

    try {
      const trimmed = input.trim()
      if (!trimmed) {
        return { success: true, output: "", executionTime: Date.now() - startTime, mode: "text" }
      }

      this.history.push(trimmed)
      this.session.messageCount++

      const builtin = this.handleBuiltinCommand(trimmed)
      if (builtin) {
        return builtin
      }

      const result = await this.system.process(trimmed, {
        offline: this.options.offline,
        debug: this.options.verbose,
      })

      return {
        success: result.success,
        output: result.output,
        confidence: result.confidence,
        executionTime: Date.now() - startTime,
        mode: "text",
        metadata: {
          steps: result.steps,
          knowledgeUsed: result.knowledgeUsed,
          toolsUsed: result.toolsUsed,
          modelUsed: result.modelUsed,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        output: `處理錯誤: ${error.message}`,
        executionTime: Date.now() - startTime,
        mode: "text",
      }
    }
  }

  private history: string[] = []

  private async handleBuiltinCommand(input: string): Promise<CLIResponse | null> {
    const lower = input.toLowerCase()
    const startTime = Date.now()

    if (lower === "help" || lower === "/help" || lower === "?") {
      return { success: true, output: this.getHelpText(), executionTime: Date.now() - startTime, mode: "text" }
    }

    if (lower === "exit" || lower === "quit" || lower === "/q") {
      return {
        success: true,
        output: "再見！感謝使用獨立 CLI",
        executionTime: Date.now() - startTime,
        mode: "text",
        metadata: { action: "exit" },
      }
    }

    if (lower === "clear" || lower === "/clear") {
      return {
        success: true,
        output: "",
        executionTime: Date.now() - startTime,
        mode: "text",
        metadata: { action: "clear" },
      }
    }

    if (lower === "history" || lower === "/history") {
      const history = this.history.slice(-20)
      return {
        success: true,
        output: "歷史記錄 (最近 20 條):\n" + history.map((h, i) => `${i + 1}. ${h}`).join("\n"),
        executionTime: Date.now() - startTime,
        mode: "text",
      }
    }

    if (lower === "health" || lower === "/health") {
      this.system.healthCheck().then((h) => {
        console.log("\n系統健康狀態:")
        console.log(`整體狀態: ${h.healthy ? "健康" : "異常"}`)
        console.log(`健康分數: ${(h.overallScore * 100).toFixed(1)}%`)
        for (const d of h.details) {
          console.log(`  [${d.status}] ${d.module}: ${d.message}`)
        }
      })
      return { success: true, output: "健康檢查中...", executionTime: Date.now() - startTime, mode: "text" }
    }

    if (lower === "status" || lower === "/status") {
      const pm = this.system.getPluginManager()
      return {
        success: true,
        output: `獨立 CLI 狀態\nSession ID: ${this.session.id}\n運行時間: ${this.formatDuration(Date.now() - this.session.startedAt)}\n訊息數: ${this.session.messageCount}\n插件系統: ${pm ? "已啟用" : "未啟用"}\n離線模式: ${this.options.offline ? "是" : "否"}`,
        executionTime: Date.now() - startTime,
        mode: "text",
      }
    }

    if (lower === "version" || lower === "/version" || lower === "-v") {
      return {
        success: true,
        output: "獨立 CLI v1.0.0\n獨立 AI 系統 for Linux",
        executionTime: Date.now() - startTime,
        mode: "text",
      }
    }

    if (lower === "models" || lower === "/models" || lower === "providers") {
      const models = this.system.getModelManager()?.getAvailableModels() || []
      let mm = this.system.getModelManager()
      let output = "可用模型 / Available Models\n═══════════════════════════════\n\n"
      if (models.length > 0) {
        for (const m of models) {
          const desc = mm?.getModelDescription(m.name) || m.name
          output += `[${m.provider}] ${m.name}\n   ${desc}\n\n`
        }
      } else {
        output += "Ollama 未運行，請安裝或啟動 Ollama\n"
      }
      output += mm?.getRecommendedProviders() || ""
      return { success: true, output, executionTime: Date.now() - startTime, mode: "text" }
    }

    if (lower === "check" || lower === "/check" || lower === "api check") {
      const result = await this.system.getModelManager()?.checkFreeProviders()
      return { success: true, output: result || "檢測中...", executionTime: Date.now() - startTime, mode: "text" }
    }

    if (lower === "plugins" || lower === "/plugins") {
      const pm = this.system.getPluginManager()
      if (!pm) return { success: true, output: "插件系統未啟用", executionTime: Date.now() - startTime, mode: "text" }
      const plugins = pm.getPlugins()
      return {
        success: true,
        output: "已載入插件:\n" + plugins.map((p) => `- ${p.metadata.name} v${p.metadata.version}`).join("\n"),
        executionTime: Date.now() - startTime,
        mode: "text",
      }
    }

    return null
  }

  private getHelpText(): string {
    return `獨立 CLI - 說明
═══════════════════════════════════════

基本指令 Basic Commands:
  help, ?          顯示說明
  exit, quit       結束程式
  clear            清除畫面
  history          歷史記錄

系統指令 System Commands:
  health           健康檢查
  status           系統狀態
  version, -v      版本資訊
  plugins          插件列表

設定指令 Settings:
  set language <lang>   語言設定
  set model <name>     模型設定
  set offline <bool>   離線模式

記憶指令 Memory Commands:
  /memory recall <關鍵詞>   搜尋記憶
  /memory store <內容>     儲存記憶
  /memory repair          維修記錄

安全指令 Security:
  /security status        安全狀態
  /security start        啟動安全

提示: 直接輸入問題即可獲得 AI 回答`
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  getSession(): CLISession {
    return this.session
  }

  getOptions(): Readonly<Required<CLIOptions>> {
    return { ...this.options }
  }

  async shutdown(): Promise<void> {
    await this.system.shutdown()
  }
}

export default IndependentArchitectureCLI
