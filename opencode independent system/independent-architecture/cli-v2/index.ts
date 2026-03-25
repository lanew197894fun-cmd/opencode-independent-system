#!/usr/bin/env bun
// 獨立 CLI v2 入口點

import { createREPL } from "./repl"
import type { CLIOptions } from "./core"
import { Log } from "../util/log"

const log = Log.create({ service: "cli-v2-entry" })

// ============================================
// 命令列參數解析
// ============================================

interface CLIArgs {
  help?: boolean
  version?: boolean
  verbose?: boolean
  quiet?: boolean
  offline?: boolean
  model?: string
  provider?: string
  language?: string
  session?: string
  continue?: boolean
  init?: boolean
  single?: string
  chat?: string
  _?: string[]
}

function parseArgs(): CLIArgs {
  const args: CLIArgs = { _: [] }
  const argv = process.argv.slice(2)

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]

    if (arg === "-h" || arg === "--help") {
      args.help = true
    } else if (arg === "-v" || arg === "--version") {
      args.version = true
    } else if (arg === "--verbose" || arg === "-V") {
      args.verbose = true
    } else if (arg === "--quiet" || arg === "-q") {
      args.quiet = true
    } else if (arg === "--offline" || arg === "-o") {
      args.offline = true
    } else if (arg === "--model" || arg === "-m") {
      args.model = argv[++i]
    } else if (arg === "--provider" || arg === "-p") {
      args.provider = argv[++i]
    } else if (arg === "--language" || arg === "-l") {
      args.language = argv[++i] as any
    } else if (arg === "--session" || arg === "-s") {
      args.session = argv[++i]
    } else if (arg === "--continue" || arg === "-c") {
      args.continue = true
    } else if (arg === "--init") {
      args.init = true
    } else if (arg === "--chat" || arg === "-C") {
      args.chat = argv[++i]
    } else if (arg === "--single" || arg === "-S") {
      args.single = argv[++i]
    } else if (!arg.startsWith("-")) {
      args._.push(arg)
    }
  }

  return args
}

// ============================================
// 幫助輸出
// ============================================

function printHelp(): void {
  console.log(`
╔═══════════════════════════════════════════════════╗
║           獨立 CLI v2 - 你的 AI 系統           ║
╚═══════════════════════════════════════════════════╝

用法: ji [選項] [訊息]

選項:
  -h, --help          顯示幫助
  -v, --version       顯示版本
  -V, --verbose       詳細輸出
  -q, --quiet         安靜模式
  -o, --offline       離線模式

  -m, --model <name>  指定模型
  -p, --provider <name>  指定供應商
  -l, --language <lang>  設定語言 (zh-TW/zh-CN/en)
  -s, --session <id>  指定 session
  -c, --continue      繼續上次對話

  --chat <msg>        單次聊天
  -S, --single <cmd>  執行單一命令
  --init              初始化設定

範例:
  ji                           互動模式
  ji --chat "Hello"            單次聊天
  ji -m llama3:8b              指定模型
  ji -o                        離線模式
`)
}

// ============================================
// 主程式
// ============================================

async function main(): Promise<void> {
  const args = parseArgs()

  if (args.help) {
    printHelp()
    process.exit(0)
    return
  }

  if (args.version) {
    console.log("獨立 CLI v2.0.0")
    process.exit(0)
    return
  }

  if (args.init) {
    await initialize()
    process.exit(0)
    return
  }

  // 構建 CLI 選項
  const options: CLIOptions = {
    model: args.model,
    provider: args.provider,
    language: args.language as any,
    session: args.session,
    continue: args.continue,
    offline: args.offline,
    verbose: args.verbose,
    color: !args.quiet,
  }

  // 單次聊天模式
  if (args.chat) {
    await runSingleChat(args.chat, options)
    return
  }

  // 單一命令模式
  if (args.single) {
    await runSingleCommand(args.single, options)
    return
  }

  // 從位置參數獲取訊息
  if (args._.length > 0) {
    await runSingleChat(args._.join(" "), options)
    return
  }

  // 互動模式
  await runInteractive(options)
}

async function runInteractive(options: CLIOptions): Promise<void> {
  log.info("Starting interactive mode")
  const repl = await createREPL(options)
  await repl.start()
}

async function runSingleChat(message: string, options: CLIOptions): Promise<void> {
  log.info("Single chat mode", { message: message.slice(0, 50) })

  const { CLIState } = await import("./core")
  const { ProviderManager } = await import("./provider")
  const { PluginManager, createBuiltinPlugins } = await import("./plugin-system")
  const { getV2Plugins } = await import("./plugin-integrator")

  const state = new CLIState(options)
  const providerManager = new ProviderManager()
  const pluginManager = new PluginManager()

  // 載入舊系統插件
  for (const plugin of createBuiltinPlugins()) {
    await pluginManager.load(plugin)
  }

  // 載入 V2 專用插件
  for (const plugin of getV2Plugins()) {
    await pluginManager.load(plugin)
  }

  // 觸發 chat.before hook
  const context = state.getContext()
  const hookInput = await pluginManager.getHookManager().trigger("chat.before", {
    message,
    context,
  })

  const finalMessage = (hookInput as string) || message

  const messages = [
    { role: "system" as const, content: "你是一個友善的 AI 助手，請用繁體中文回答。" },
    { role: "user" as const, content: finalMessage },
  ]

  try {
    const response = await providerManager.chat(messages, {
      model: options.model,
      provider: options.provider,
    })

    // 觸發 chat.after hook
    await pluginManager.getHookManager().trigger("chat.after", {
      message: finalMessage,
      response,
      context,
    })

    console.log(response)

    if (options.verbose) {
      console.log(`\n[Model: ${options.model || "auto"}]`)
    }
  } catch (e: any) {
    // 觸發 chat.error hook
    await pluginManager.getHookManager().trigger("chat.error", {
      message: finalMessage,
      error: e,
      context,
    })

    console.error(`錯誤: ${e.message}`)
    process.exit(1)
  }
}

async function runSingleCommand(command: string, options: CLIOptions): Promise<void> {
  log.info("Single command mode", { command })

  const { CLIState } = await import("./core")
  const { ProviderManager } = await import("./provider")
  const { PluginManager, createBuiltinPlugins } = await import("./plugin-system")
  const { createBuiltinCommands, createImageCommand, parseCommand, isBuiltInCommand } = await import("./commands")
  const { getLegacyAdapters } = await import("./legacy-adapter")

  const state = new CLIState(options)
  const providerManager = new ProviderManager()
  const pluginManager = new PluginManager()

  // 載入內建 plugins
  for (const plugin of createBuiltinPlugins()) {
    await pluginManager.load(plugin)
  }

  // 載入舊插件適配器
  const legacyAdapters = getLegacyAdapters(state.getConfig().dataDir)
  for (const adapter of legacyAdapters) {
    const v2Plugin = adapter.toV2Plugin()
    await pluginManager.load(v2Plugin)
  }

  const commands = createBuiltinCommands(state, providerManager, pluginManager)

  // 加入圖片生成命令
  commands.set("image", createImageCommand())
  commands.set("img", createImageCommand())
  const { command: cmd, args } = parseCommand(command)

  if (isBuiltInCommand(cmd)) {
    const handler = commands.get(cmd)
    if (handler) {
      const result = await handler(args, state.getContext())
      if (!result.success && result.error) {
        console.error(result.error)
        process.exit(1)
      }
      console.log(result.output)
      return
    }
  }

  console.error(`未知命令: ${cmd}`)
  console.error("使用 --help 查看幫助")
  process.exit(1)
}

async function initialize(): Promise<void> {
  console.log("初始化獨立 CLI v2...")

  const { homedir } = await import("os")
  const { join } = await import("path")
  const { mkdirSync, existsSync } = await import("fs")

  const dirs = [
    join(homedir(), ".independent-architecture"),
    join(homedir(), ".independent-architecture", "data"),
    join(homedir(), ".independent-architecture", "config"),
    join(homedir(), ".independent-architecture", "cache"),
    join(homedir(), ".independent-architecture", "sessions"),
    join(homedir(), ".independent-architecture", "plugins"),
    join(homedir(), ".independent-architecture", "memory"),
  ]

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
      console.log(`建立目錄: ${dir}`)
    }
  }

  console.log("\n初始化完成！")
  console.log("執行 ji 開始使用")
}

// ============================================
// 啟動
// ============================================

main().catch((e) => {
  console.error("Fatal error:", e)
  process.exit(1)
})
