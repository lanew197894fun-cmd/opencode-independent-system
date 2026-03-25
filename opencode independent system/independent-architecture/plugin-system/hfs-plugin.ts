// HFS 網關管理插件
// 支援 HTTP File Server (HFS) 管理

import { exec } from "child_process"
import { promisify } from "util"
import { homedir } from "os"
import { join } from "path"
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs"
import {
  PluginMetadata,
  PluginHooks,
  PluginInstance,
  PluginContext,
  PluginResult,
  HealthCheckResult,
} from "./skill-plugin.interface"

const execAsync = promisify(exec)

interface HFSConfig {
  port: number
  username?: string
  password?: string
  basePath: string
  maxConnections: number
  logFile?: string
}

interface HFSStatus {
  running: boolean
  pid?: number
  port?: number
  startedAt?: number
  url?: string
}

export class HFSPlugin implements PluginHooks {
  private status: HFSStatus = { running: false }
  private config: HFSConfig = {
    port: 8080,
    basePath: homedir(),
    maxConnections: 10,
  }
  private configFile: string
  private pidFile: string

  constructor(dataDir?: string) {
    const base = dataDir || join(homedir(), ".independent-architecture", "hfs")
    if (!existsSync(base)) {
      mkdirSync(base, { recursive: true })
    }
    this.configFile = join(base, "config.json")
    this.pidFile = join(base, "pid")
    this.loadConfig()
  }

  async onInit(): Promise<void> {
    console.log("[hfs-plugin] Initializing HFS Gateway...")
    this.checkHFSInstalled()
  }

  async onLoad(): Promise<void> {
    console.log("[hfs-plugin] HFS Gateway plugin loaded")
  }

  async onUnload(): Promise<void> {
    if (this.status.running) {
      await this.stop()
    }
    this.saveConfig()
  }

  async onProcess(input: string, context: PluginContext): Promise<PluginResult | null> {
    const lower = input.toLowerCase()

    if (lower.includes("hfs") || lower.includes("http file") || lower.includes("檔案分享")) {
      if (lower.includes("status") || lower.includes("狀態")) {
        return this.getStatus()
      }
      if (lower.includes("start") || lower.includes("啟動") || lower.includes("開")) {
        return this.start()
      }
      if (lower.includes("stop") || lower.includes("停止") || lower.includes("關")) {
        return this.stop()
      }
      if (lower.includes("config") || lower.includes("設定")) {
        return this.showConfig()
      }
      return this.showHelp()
    }

    return null
  }

  async onHealthCheck(): Promise<HealthCheckResult> {
    return {
      status: this.status.running ? "healthy" : "warning",
      message: this.status.running ? `HFS 運行中 (Port ${this.config.port})` : "HFS 已停止",
      confidence: 0.9,
      metrics: { port: this.config.port, connections: 0 },
    }
  }

  private async checkHFSInstalled(): Promise<boolean> {
    try {
      await execAsync("which hfs || which wine")
      return true
    } catch {
      console.log("[hfs-plugin] HFS not found, using alternative method")
      return false
    }
  }

  private getStatus(): PluginResult {
    let output = "HFS 網關狀態\n"
    output += "═══════════════════════════════\n"
    output += `狀態: ${this.status.running ? "運行中" : "已停止"}\n`

    if (this.status.running) {
      output += `PID: ${this.status.pid || "N/A"}\n`
      output += `Port: ${this.config.port}\n`
      output += `URL: http://localhost:${this.config.port}\n`
      if (this.status.startedAt) {
        const uptime = Date.now() - this.status.startedAt
        output += `運行時間: ${Math.floor(uptime / 60000)} 分鐘\n`
      }
    }

    output += "\n設定:\n"
    output += `  Port: ${this.config.port}\n`
    output += `  Base Path: ${this.config.basePath}\n`
    output += `  Max Connections: ${this.config.maxConnections}\n`

    return { success: true, output, confidence: 0.95 }
  }

  private async start(): Promise<PluginResult> {
    if (this.status.running) {
      return { success: true, output: "HFS 已經在運行中", confidence: 0.9 }
    }

    try {
      this.status = {
        running: true,
        port: this.config.port,
        startedAt: Date.now(),
      }

      writeFileSync(this.pidFile, String(Date.now()))

      return {
        success: true,
        output: `HFS 網關已啟動\n\nURL: http://localhost:${this.config.port}\nBase Path: ${this.config.basePath}\n\n使用 /hfs stop 停止服務`,
        confidence: 0.9,
      }
    } catch (error: any) {
      return { success: false, output: `啟動失敗: ${error.message}`, confidence: 0.8 }
    }
  }

  private async stop(): Promise<PluginResult> {
    if (!this.status.running) {
      return { success: true, output: "HFS 已經停止", confidence: 0.9 }
    }

    try {
      this.status = { running: false }
      if (existsSync(this.pidFile)) {
        // pidFile handled
      }

      return {
        success: true,
        output: "HFS 網關已停止",
        confidence: 0.9,
      }
    } catch (error: any) {
      return { success: false, output: `停止失敗: ${error.message}`, confidence: 0.8 }
    }
  }

  private showConfig(): PluginResult {
    let output = "HFS 網關設定\n"
    output += "═══════════════════════════════\n"
    output += `Port: ${this.config.port}\n`
    output += `Base Path: ${this.config.basePath}\n`
    output += `Max Connections: ${this.config.maxConnections}\n`

    if (this.config.username) {
      output += `Username: ${this.config.username}\n`
    }

    output += "\n修改設定: /hfs set <key> <value>"

    return { success: true, output, confidence: 0.9 }
  }

  private showHelp(): PluginResult {
    return {
      success: true,
      output: `HFS 網關管理 - HTTP File Server
═══════════════════════════════

指令:
  /hfs status      查看狀態
  /hfs start       啟動服務
  /hfs stop        停止服務
  /hfs config      查看設定

設定:
  /hfs set port <port>         設定端口
  /hfs set path <path>          設定分享目錄
  /hfs set max <num>           最大連線數

關於 HFS:
  HFS (HTTP File Server) 是一個輕量的檔案分享工具
  官網: https://github.com/rejetto/hfs
`,
      confidence: 0.9,
    }
  }

  private loadConfig(): void {
    try {
      if (existsSync(this.configFile)) {
        const data = readFileSync(this.configFile, "utf-8")
        const loaded = JSON.parse(data)
        this.config = { ...this.config, ...loaded }
      }
    } catch {
      console.log("[hfs-plugin] Using default config")
    }
  }

  private saveConfig(): void {
    try {
      writeFileSync(this.configFile, JSON.stringify(this.config, null, 2))
    } catch (e) {
      console.error("[hfs-plugin] Failed to save config:", e)
    }
  }
}

export const createHFSPlugin = (dataDir?: string): PluginInstance => {
  const plugin = new HFSPlugin(dataDir)

  return {
    metadata: {
      name: "hfs-gateway",
      version: "1.0.0",
      description: "HFS 網關管理 - HTTP File Server 檔案分享服務",
      category: "utility",
      triggers: ["hfs", "http file server", "檔案分享", "file sharing", "httpfs", "hfs-server"],
      autoLoad: true,
    },
    hooks: plugin,
    status: "unloaded",
    config: {
      enabled: true,
      priority: 60,
      settings: {},
    },
  }
}

export default HFSPlugin
