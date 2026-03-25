// 獨立 CLI v2 - 援用官方模式，建立專屬系統

import { homedir } from "os"
import { join } from "path"
import { existsSync, mkdirSync } from "fs"
import { Log } from "../util/log"

export const log = Log.create({ service: "cli-v2" })

// ============================================
// 類型定義
// ============================================

export interface CLIConfig {
  dataDir: string
  configDir: string
  cacheDir: string
  sessionDir: string
  pluginDir: string
  memoryDir: string
}

export interface CLIContext {
  cwd: string
  user: string
  hostname: string
  platform: string
  timestamp: number
  sessionId?: string
}

export interface CLIOptions {
  model?: string
  provider?: string
  temperature?: number
  maxTokens?: number
  contextWindow?: number
  offline?: boolean
  verbose?: boolean
  color?: boolean
  language?: "zh-TW" | "zh-CN" | "en"
  agent?: string
  session?: string
  continue?: boolean
}

// ============================================
// 預設配置
// ============================================

export function getDefaultConfig(): CLIConfig {
  const home = homedir()
  const baseDir = join(home, ".independent-architecture")

  return {
    dataDir: join(baseDir, "data"),
    configDir: join(baseDir, "config"),
    cacheDir: join(baseDir, "cache"),
    sessionDir: join(baseDir, "sessions"),
    pluginDir: join(baseDir, "plugins"),
    memoryDir: join(baseDir, "memory"),
  }
}

export function ensureDirectories(config: CLIConfig): void {
  for (const dir of Object.values(config)) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  }
}

// ============================================
// CLI 狀態管理
// ============================================

export class CLIState {
  private config: CLIConfig
  private context: CLIContext
  private options: Required<CLIOptions>
  private sessionId: string
  private history: string[] = []
  private messageCount: number = 0

  constructor(options: CLIOptions = {}) {
    this.config = getDefaultConfig()
    ensureDirectories(this.config)

    this.sessionId = options.session || `session-${Date.now()}`
    this.context = {
      cwd: process.cwd(),
      user: process.env.USER || "user",
      hostname: process.env.HOSTNAME || "localhost",
      platform: process.platform,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    }

    this.options = {
      model: options.model || "auto",
      provider: options.provider || "auto",
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 4096,
      contextWindow: options.contextWindow ?? 10,
      offline: options.offline ?? false,
      verbose: options.verbose ?? false,
      color: options.color ?? true,
      language: options.language ?? "zh-TW",
      agent: options.agent || "default",
      session: this.sessionId,
      continue: options.continue ?? false,
    }

    log.info("CLI State initialized", {
      sessionId: this.sessionId,
      platform: this.context.platform,
    })
  }

  getConfig(): CLIConfig {
    return this.config
  }

  getContext(): CLIContext {
    return { ...this.context }
  }

  getOptions(): Required<CLIOptions> {
    return { ...this.options }
  }

  getSessionId(): string {
    return this.sessionId
  }

  addHistory(input: string): void {
    this.history.push(input)
    this.messageCount++
  }

  getHistory(): string[] {
    return [...this.history]
  }

  getMessageCount(): number {
    return this.messageCount
  }

  setOption<K extends keyof CLIOptions>(key: K, value: CLIOptions[K]): void {
    ;(this.options as any)[key] = value
  }
}

// ============================================
// 工具注册表
// ============================================

export interface ToolDefinition {
  name: string
  description: string
  parameters?: Record<string, any>
  handler: (input: any, context: CLIContext) => Promise<any>
}

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map()

  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      log.warn(`Tool ${tool.name} already registered, overwriting`)
    }
    this.tools.set(tool.name, tool)
    log.info(`Registered tool: ${tool.name}`)
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name)
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  has(name: string): boolean {
    return this.tools.has(name)
  }

  unregister(name: string): boolean {
    return this.tools.delete(name)
  }
}

// ============================================
// 命令注册表
// ============================================

export interface CommandDefinition {
  name: string
  description: string
  aliases?: string[]
  usage?: string
  handler: (args: string[], context: CLIContext, state: CLIState) => Promise<string>
}

export class CommandRegistry {
  private commands: Map<string, CommandDefinition> = new Map()

  register(cmd: CommandDefinition): void {
    this.commands.set(cmd.name, cmd)
    for (const alias of cmd.aliases || []) {
      this.commands.set(alias, cmd)
    }
    log.info(`Registered command: ${cmd.name}`)
  }

  get(name: string): CommandDefinition | undefined {
    return this.commands.get(name)
  }

  list(): CommandDefinition[] {
    const seen = new Set<string>()
    return Array.from(this.commands.values()).filter((cmd) => {
      if (seen.has(cmd.name)) return false
      seen.add(cmd.name)
      return true
    })
  }

  has(name: string): boolean {
    return this.commands.has(name)
  }
}

// ============================================
// 導出
// ============================================

export { Log } from "../util/log"
