// CLI 類型定義

export interface CLIOptions {
  enablePlugins?: boolean
  enableMemory?: boolean
  enableSecurity?: boolean
  enableLocalModel?: boolean
  verbose?: boolean
  color?: boolean
  language?: "zh-TW" | "zh-CN" | "en"
  model?: string
  temperature?: number
  maxTokens?: number
  offline?: boolean
  contextWindow?: number
  dataDir?: string
}

export interface CommandContext {
  cwd: string
  user: string
  hostname: string
  platform: string
  timestamp: number
  env?: Record<string, string>
}

export interface OutputFormatter {
  success: (text: string) => string
  error: (text: string) => string
  warning: (text: string) => string
  info: (text: string) => string
  muted: (text: string) => string
  bold: (text: string) => string
  header: (text: string) => string
}

export interface Command {
  name: string
  aliases?: string[]
  description: string
  usage?: string
  execute: (args: string[], context: CommandContext) => Promise<CommandResult>
}

export interface CommandResult {
  success: boolean
  output: string
  exitCode?: number
}

export interface REPLConfig {
  prompt: string
  greeting?: string
  maxHistory?: number
  enableAutoComplete?: boolean
  enableShortcuts?: boolean
}

export interface SessionConfig {
  id: string
  mode: "interactive" | "batch" | "single"
  createdAt: number
  lastActive: number
}
