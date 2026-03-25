// 交互式 REPL 界面
// 提供類似官方 opencode 的交互體驗，雙語支援

import * as readline from "readline"
import { homedir } from "os"
import { join } from "path"
import { existsSync, appendFileSync, readFileSync } from "fs"
import { IndependentArchitectureCLI } from "./cli-engine"
import { REPLConfig } from "./cli-types"
import { i18n } from "./i18n"

export class REPL {
  private cli: IndependentArchitectureCLI
  private rl: readline.Interface
  private config: REPLConfig
  private history: string[] = []
  private historyFile: string
  private isRunning: boolean = false
  private promptCount: number = 0
  private i18: typeof i18n

  constructor(cli: IndependentArchitectureCLI, config?: Partial<REPLConfig>) {
    this.cli = cli
    this.i18 = i18n
    this.historyFile = join(homedir(), ".independent-architecture", "cli", "history", "repl-history.txt")

    this.config = {
      prompt: this.getPrompt(),
      greeting: this.getGreeting(),
      maxHistory: 1000,
      enableAutoComplete: true,
      enableShortcuts: true,
      ...config,
    }

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      completer: this.completer.bind(this),
      historySize: this.config.maxHistory,
      prompt: this.config.prompt,
    })

    this.loadHistory()
    this.setupEventHandlers()
  }

  private getPrompt(): string {
    const num = ++this.promptCount
    return `\x1b[36m計散\x1b[0m ${num}> `
  }

  private getGreeting(): string {
    const { f } = this.getFormatter()
    const opts = this.cli.getOptions()
    const t = (k: string) => this.i18.t(k)

    return [
      f.header("╔══════════════════════════════════════════════════════════╗"),
      f.header("║") + "                                                              " + f.header("║"),
      f.header("║") +
        "     " +
        f.success("██████╗ ███████╗███████╗███████╗██████╗ ") +
        "              " +
        f.header("║"),
      f.header("║") +
        "     " +
        f.success("██╔══██╗██╔════╝██╔════╝██╔════╝██╔══██╗") +
        "              " +
        f.header("║"),
      f.header("║") +
        "     " +
        f.success("██████╔╝█████╗  █████╗  █████╗  ██████╔╝") +
        "              " +
        f.header("║"),
      f.header("║") +
        "     " +
        f.success("██╔══██╗██╔══╝  ██╔══╝  ██╔══╝  ██╔══██╗") +
        "              " +
        f.header("║"),
      f.header("║") +
        "     " +
        f.success("██║  ██║███████╗██║     ███████╗██║  ██║") +
        "              " +
        f.header("║"),
      f.header("║") +
        "     " +
        f.success("╚═╝  ╚═╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝") +
        "              " +
        f.header("║"),
      f.header("║") + "                                                              " + f.header("║"),
      f.header("║") + "     " + f.warning("獨立 AI CLI 系統 for Linux") + "                       " + f.header("║"),
      f.header("║") + "     " + f.info("Standalone AI CLI System") + "                              " + f.header("║"),
      f.header("║") + "                                                              " + f.header("║"),
      f.header("╚══════════════════════════════════════════════════════════╝"),
      "",
      f.muted("輸入 ") + f.bold("help") + f.muted(" 查看指令，輸入 ") + f.bold("exit") + f.muted(" 退出"),
      f.muted("Type ") + f.bold("help") + f.muted(" for commands"),
      opts.offline ? f.warning("⚠ 離線模式") : f.success("✓ 在線模式"),
      "",
    ].join("\n")
  }

  private getFormatter() {
    const opts = this.cli.getOptions()
    const colors = opts.color
      ? {
          reset: "\x1b[0m",
          bright: "\x1b[1m",
          dim: "\x1b[2m",
          red: "\x1b[31m",
          green: "\x1b[32m",
          yellow: "\x1b[33m",
          blue: "\x1b[34m",
          magenta: "\x1b[35m",
          cyan: "\x1b[36m",
        }
      : {
          reset: "",
          bright: "",
          dim: "",
          red: "",
          green: "",
          yellow: "",
          blue: "",
          magenta: "",
          cyan: "",
        }

    return {
      f: {
        reset: colors.reset,
        bright: colors.bright,
        dim: colors.dim,
        red: colors.red,
        green: colors.green,
        yellow: colors.yellow,
        blue: colors.blue,
        magenta: colors.magenta,
        cyan: colors.cyan,
        success: (t: string) => `${colors.green}${t}${colors.reset}`,
        error: (t: string) => `${colors.red}${t}${colors.reset}`,
        warning: (t: string) => `${colors.yellow}${t}${colors.reset}`,
        info: (t: string) => `${colors.cyan}${t}${colors.reset}`,
        muted: (t: string) => `${colors.dim}${t}${colors.reset}`,
        bold: (t: string) => `${colors.bright}${t}${colors.reset}`,
        header: (t: string) => `${colors.magenta}${colors.bright}${t}${colors.reset}`,
      },
    }
  }

  private loadHistory(): void {
    try {
      if (existsSync(this.historyFile)) {
        const content = readFileSync(this.historyFile, "utf-8")
        this.history = content.split("\n").filter((line) => line.trim())
      }
    } catch {}
  }

  private saveHistory(): void {
    try {
      const recent = this.history.slice(-this.config.maxHistory!)
      appendFileSync(this.historyFile, recent.join("\n") + "\n")
    } catch {}
  }

  private setupEventHandlers(): void {
    this.rl.on("line", async (line) => {
      const input = line.trim()
      if (!input) {
        this.rl.prompt()
        return
      }

      this.history.push(input)

      if (input === "exit" || input === "quit") {
        await this.shutdown()
        return
      }

      await this.handleInput(input)
      this.rl.prompt()
    })

    this.rl.on("close", async () => {
      await this.shutdown()
    })

    this.rl.on("SIGINT", () => {
      this.rl.write("\n")
      this.rl.prompt()
    })
  }

  private async handleInput(input: string): Promise<void> {
    const { f } = this.getFormatter()

    if (input === "clear") {
      console.clear()
      return
    }

    const response = await this.cli.process(input)

    if (response.metadata?.action === "exit") {
      await this.shutdown()
      return
    }

    if (response.metadata?.action === "clear") {
      console.clear()
      return
    }

    if (response.success) {
      if (response.output) {
        console.log(response.output)
      }
    } else {
      console.log(f.error(response.output))
    }

    if (this.cli.getOptions().verbose && response.executionTime) {
      console.log(f.muted(`[耗時: ${response.executionTime}ms]`))
    }
  }

  private completer(line: string): [string[], string] {
    const commands = [
      "help",
      "exit",
      "quit",
      "clear",
      "history",
      "health",
      "status",
      "version",
      "plugins",
      "set",
      "set language",
      "set model",
      "set offline",
      "set verbose",
      "/memory recall",
      "/memory store",
      "/memory repair",
      "/security status",
      "/security start",
    ]

    const hits = commands.filter((c) => c.startsWith(line))
    return [hits.length ? hits : [], line]
  }

  async start(): Promise<void> {
    this.isRunning = true
    console.log(this.config.greeting)
    this.rl.prompt()

    return new Promise((resolve) => {
      this.rl.on("close", () => resolve())
    })
  }

  async shutdown(): Promise<void> {
    if (!this.isRunning) return
    this.isRunning = false

    this.saveHistory()
    await this.cli.shutdown()

    const { f } = this.getFormatter()
    console.log(f.muted("\n再見！感謝使用獨立 CLI\n"))

    this.rl.close()
  }
}

export default REPL
