#!/usr/bin/env bun
// 獨立 CLI 主入口點

import { homedir } from "os"
import { join } from "path"
import { existsSync } from "fs"
import { IndependentArchitectureCLI } from "./cli-engine"
import { REPL } from "./repl"
import { CLIOptions } from "./cli-types"

interface CLIArguments {
  _: string[]
  help?: boolean
  version?: boolean
  verbose?: boolean
  quiet?: boolean
  offline?: boolean
  model?: string
  language?: string
  "no-plugins"?: boolean
  "no-memory"?: boolean
  "no-color"?: boolean
  init?: boolean
  single?: string
  batch?: string
  config?: string
}

function parseArgs(): CLIArguments {
  const args: CLIArguments = { _: [] }
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
    } else if (arg === "--language" || arg === "-l") {
      args.language = argv[++i]
    } else if (arg === "--no-plugins") {
      args["no-plugins"] = true
    } else if (arg === "--no-memory") {
      args["no-memory"] = true
    } else if (arg === "--no-color") {
      args["no-color"] = true
    } else if (arg === "--init") {
      args.init = true
    } else if (arg === "--single" || arg === "-s") {
      args.single = argv[++i]
    } else if (arg === "--batch" || arg === "-b") {
      args.batch = argv[++i]
    } else if (arg === "--config" || arg === "-c") {
      args.config = argv[++i]
    } else if (!arg.startsWith("-")) {
      args._.push(arg)
    }
  }

  return args
}

function printHelp(): void {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║           獨立 CLI - 獨立 AI 系統 for Linux                ║
╚══════════════════════════════════════════════════════════╝

用法: jsj [選項] [指令]

選項:
  -h, --help          顯示幫助
  -v, --version       顯示版本
  -V, --verbose       詳細輸出
  -q, --quiet         安靜模式
  -o, --offline       離線模式

  -m, --model <name>  指定模型
  -l, --language <lang>  設定語言 (zh-TW/zh-CN/en)

  --no-plugins        停用插件系統
  --no-memory         停用記憶功能
  --no-color          禁用彩色輸出

  -s, --single <cmd>  執行單一指令
  -b, --batch <file>  批次執行檔案
  -c, --config <file>  指定配置檔

  --init              初始化設定

範例:
  jsj                           互動模式
  jsj -s "幫我寫一個 Hello World"  單一指令
  jsj --offline                 離線互動
  jsj --model llama3             使用指定模型
`)
}

async function main(): Promise<void> {
  const args = parseArgs()
  const { _ } = args

  if (args.help) {
    printHelp()
    process.exit(0)
    return
  }

  if (args.version) {
    console.log("獨立 CLI v1.0.0")
    console.log("獨立 AI 系統 for Linux")
    process.exit(0)
    return
  }

  if (args.init) {
    await initialize()
    process.exit(0)
    return
  }

  const options: CLIOptions = {
    enablePlugins: !args["no-plugins"],
    enableMemory: !args["no-memory"],
    enableSecurity: true,
    enableLocalModel: true,
    verbose: args.verbose || false,
    color: !args["no-color"],
    language: (args.language as any) || "zh-TW",
    model: args.model || "auto",
    temperature: 0.7,
    maxTokens: 4096,
    offline: args.offline || false,
    contextWindow: 10,
  }

  const cli = new IndependentArchitectureCLI(options)

  if (args.single) {
    await runSingleCommand(cli, args.single)
  } else if (args.batch) {
    await runBatchFile(cli, args.batch)
  } else if (_.length > 0) {
    await runSingleCommand(cli, _.join(" "))
  } else {
    await runInteractive(cli)
  }

  await cli.shutdown()
}

async function runSingleCommand(cli: IndependentArchitectureCLI, command: string): Promise<void> {
  const response = await cli.process(command)

  if (response.success) {
    console.log(response.output)
  } else {
    console.error(response.output)
    process.exit(1)
  }

  if (cli.getOptions().verbose) {
    console.log(`\n[耗時: ${response.executionTime}ms]`)
  }
}

async function runBatchFile(cli: IndependentArchitectureCLI, file: string): Promise<void> {
  if (!existsSync(file)) {
    console.error(`錯誤: 找不到檔案 ${file}`)
    process.exit(1)
  }

  const content = await Bun.file(file).text()
  const lines = content.split("\n").filter((line) => {
    const trimmed = line.trim()
    return trimmed && !trimmed.startsWith("#")
  })

  console.log(`執行批次檔案: ${file} (${lines.length} 條指令)\n`)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    console.log(`> ${trimmed}`)
    const response = await cli.process(trimmed)
    console.log(response.output)
    console.log("")
  }

  console.log(`\n批次執行完成 (${lines.length} 條指令)`)
}

async function runInteractive(cli: IndependentArchitectureCLI): Promise<void> {
  const repl = new REPL(cli)
  await repl.start()
}

async function initialize(): Promise<void> {
  const { f } = {
    f: {
      success: (t: string) => `\x1b[32m${t}\x1b[0m`,
      error: (t: string) => `\x1b[31m${t}\x1b[0m`,
      warning: (t: string) => `\x1b[33m${t}\x1b[0m`,
      info: (t: string) => `\x1b[36m${t}\x1b[0m`,
    },
  }

  const dataDir = join(homedir(), ".independent-architecture", "cli")

  console.log(f.info("初始化獨立 CLI..."))
  console.log(f.info(`資料目錄: ${dataDir}`))

  const dirs = [dataDir, join(dataDir, "sessions"), join(dataDir, "history"), join(dataDir, "plugins")]

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      Bun.mkdir(dir, { recursive: true })
      console.log(f.success(`建立目錄: ${dir}`))
    }
  }

  console.log(f.success("\n初始化完成！"))
  console.log(f.info("\n執行 jsj 開始使用"))
}

main().catch(console.error)
