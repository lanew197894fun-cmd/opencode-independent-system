// 互動式 REPL - CLI v2 主界面

import { Log } from "../util/log"
import { homedir } from "os"
import { join } from "path"
import { CLIState } from "./core"
import type { CLIContext, CLIOptions } from "./core"
import { ProviderManager } from "./provider"
import type { ChatMessage } from "./provider"
import { PluginManager } from "./plugin-system"
import {
  createBuiltinCommands,
  createImageCommand,
  parseCommand,
  isBuiltInCommand,
  type CommandResult,
} from "./commands"
import { getV2Plugins } from "./plugin-integrator"
import { getLegacyAdapters } from "./legacy-adapter"

export const log = Log.create({ service: "repl" })

// ============================================
// ANSI 顏色代碼
// ============================================

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
}

const prompt = {
  user: `${colors.cyan}ia${colors.reset} ${colors.dim}$${colors.reset} `,
  system: `${colors.yellow}[系統]${colors.reset} `,
  error: `${colors.red}[錯誤]${colors.reset} `,
  success: `${colors.green}[成功]${colors.reset} `,
}

// ============================================
// REPL 類別
// ============================================

export class REPL {
  private state: CLIState
  private context: CLIContext
  private providerManager: ProviderManager
  private pluginManager: PluginManager
  private commands: Map<string, (args: string[], ctx: CLIContext) => Promise<CommandResult>>
  private history: string[] = []
  private historyIndex: number = -1
  private running: boolean = false
  private stdin: any
  private stdout: any

  constructor(state: CLIState, providerManager: ProviderManager, pluginManager: PluginManager) {
    this.state = state
    this.context = state.getContext()
    this.providerManager = providerManager
    this.pluginManager = pluginManager
    this.commands = createBuiltinCommands(state, providerManager, pluginManager)

    // 加入圖片生成命令
    this.commands.set("image", createImageCommand())
    this.commands.set("img", createImageCommand())

    // 嘗試使用 readline
    try {
      const readline = require("readline")
      this.stdin = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
      })
    } catch (e) {
      log.warn("readline not available")
    }
  }

  async start(): Promise<void> {
    this.running = true

    // 觸發 init hook
    await this.pluginManager.getHookManager().trigger("cli.init", { state: this.state })
    await this.pluginManager.getHookManager().trigger("cli.start", { state: this.state })

    this.printWelcome()

    while (this.running) {
      try {
        const input = await this.readLine()
        if (input === null) break

        const trimmed = input.trim()
        if (!trimmed) continue

        // 添加到歷史
        this.history.push(trimmed)
        this.historyIndex = this.history.length
        this.state.addHistory(trimmed)

        // 觸發 beforeinput hook
        const modifiedInput = await this.pluginManager.getHookManager().trigger("cli.beforeinput", {
          input: trimmed,
          state: this.state,
        })
        const finalInput = (modifiedInput as string) || trimmed

        // 處理輸入
        const result = await this.processInput(finalInput)

        // 觸發 afteroutput hook
        await this.pluginManager.getHookManager().trigger("cli.afteroutput", {
          output: result,
          state: this.state,
        })

        // 處理特殊輸出
        if (result === "__CLEAR__") {
          this.clearScreen()
        } else if (result) {
          console.log(result)
        }
      } catch (e: any) {
        console.error(`${prompt.error}${e.message}`)
        log.error("REPL error", { error: e.message })
      }
    }

    await this.shutdown()
  }

  private printWelcome(): void {
    const options = this.state.getOptions()
    console.log(`
${colors.bold}${colors.cyan}╔═══════════════════════════════════════════════════╗${colors.reset}
${colors.bold}${colors.cyan}║          ${colors.white}獨立 CLI v2.0.0${colors.reset}${colors.cyan}                           ║${colors.reset}
${colors.bold}${colors.cyan}║          ${colors.dim}你的 AI 助手${colors.reset}${colors.cyan}                          ║${colors.reset}
${colors.bold}${colors.cyan}╚═══════════════════════════════════════════════════╝${colors.reset}

${colors.dim}輸入 help 獲取幫助${colors.reset}
平台: ${this.context.platform} | 語言: ${options.language}
模型: ${options.model}
${this.state.getSessionId() ? `Session: ${this.state.getSessionId().slice(0, 8)}...` : ""}
`)
  }

  private async readLine(): Promise<string | null> {
    if (this.stdin) {
      return new Promise((resolve) => {
        this.stdin.question(prompt.user, (answer: string) => {
          resolve(answer)
        })
      })
    }

    // Fallback: 使用同步讀取
    process.stdout.write(prompt.user)
    const buffer = Buffer.alloc(4096)
    const n = await Bun.file("/dev/stdin").buffer(buffer)
    if (n === 0) return null
    return buffer.toString("utf8", 0, n).trim()
  }

  private async processInput(input: string): Promise<string> {
    // 解析命令
    const { command, args } = parseCommand(input)

    // 檢查是否為內建命令或已註冊的命令（包括 image, img 等）
    if (isBuiltInCommand(command) || this.commands.has(command)) {
      const handler = this.commands.get(command)
      if (handler) {
        const result = await handler(args, this.context)
        if (!result.success && result.error) {
          return `${prompt.error}${result.error}`
        }
        return result.output
      }
    }

    // 檢查是否為聊天模式
    if (command === "chat" || command === "ask") {
      const message = args.join(" ")
      return await this.chat(message)
    }

    // 檢查是否為離開命令
    if (command === "exit" || command === "quit") {
      this.running = false
      return `${prompt.system}再見！`
    }

    // 默認作為聊天處理
    return await this.chat(input)
  }

  private async chat(message: string): Promise<string> {
    console.log(`${prompt.system}處理中...`)

    // 觸發 chat.before hook
    await this.pluginManager.getHookManager().trigger("chat.before", {
      message,
      context: this.context,
    })

    try {
      const messages: ChatMessage[] = [
        {
          role: "system",
          content: "你是一個友善的 AI 助手，請用繁體中文回答。",
        },
        {
          role: "user",
          content: message,
        },
      ]

      const response = await this.providerManager.chat(messages, {
        model: this.state.getOptions().model,
      })

      // 觸發 chat.after hook
      await this.pluginManager.getHookManager().trigger("chat.after", {
        message,
        response,
        context: this.context,
      })

      return response
    } catch (e: any) {
      // 觸發 chat.error hook
      await this.pluginManager.getHookManager().trigger("chat.error", {
        message,
        error: e,
        context: this.context,
      })

      return `${prompt.error}錯誤: ${e.message}\n\n提示: 請確認 Ollama 已啟動，或設定 API Key`
    }
  }

  private clearScreen(): void {
    process.stdout.write("\x1b[2J\x1b[0H")
  }

  async shutdown(): Promise<void> {
    await this.pluginManager.getHookManager().trigger("cli.shutdown", { state: this.state })

    if (this.stdin) {
      this.stdin.close()
    }

    log.info("REPL shutdown")
  }

  stop(): void {
    this.running = false
  }
}

// ============================================
// 工廠函數
// ============================================

export async function createREPL(options: CLIOptions = {}): Promise<REPL> {
  const state = new CLIState(options)
  const providerManager = new ProviderManager()
  const pluginManager = new PluginManager()

  // 載入內建 plugins (舊系統)
  const { createBuiltinPlugins } = await import("./plugin-system")
  for (const plugin of createBuiltinPlugins()) {
    await pluginManager.load(plugin)
  }

  // 載入 CLI v2 專用插件
  for (const plugin of getV2Plugins()) {
    await pluginManager.load(plugin)
  }

  // 載入舊插件適配器
  const legacyAdapters = getLegacyAdapters(state.getConfig().dataDir)
  for (const adapter of legacyAdapters) {
    const v2Plugin = adapter.toV2Plugin()
    await pluginManager.load(v2Plugin)
  }

  return new REPL(state, providerManager, pluginManager)
}
