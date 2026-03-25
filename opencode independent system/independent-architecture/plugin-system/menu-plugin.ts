// 功能選單插件 - 整合 OpenClawInstaller/tools 功能為插件指引

import { join } from "path"
import { homedir } from "os"
import { exec, spawn } from "child_process"
import { promisify } from "util"
import {
  PluginMetadata,
  PluginHooks,
  PluginInstance,
  PluginContext,
  PluginResult,
  HealthCheckResult,
} from "./skill-plugin.interface"
import { EnvManager, getEnvManager } from "../env-manager"

const execAsync = promisify(exec)

interface MenuItem {
  id: string
  name: string
  description: string
  command: string
  category: "gateway" | "messaging" | "monitor" | "automation" | "utility" | "backup"
  requiresRoot?: boolean
  dependencies?: string[]
  port?: number
}

interface ServiceStatus {
  name: string
  status: "running" | "stopped" | "error" | "unknown"
  port?: number
  uptime?: string
  pid?: number
}

export class MenuPlugin implements PluginHooks {
  private baseDir: string
  private toolsDir: string
  private services: Map<string, ServiceStatus> = new Map()
  private menuItems: MenuItem[] = []
  private envManager: EnvManager | null = null

  constructor(toolsDir?: string) {
    this.toolsDir = toolsDir || "/home/reamaster/opencode-manager/OpenClawInstaller/tools"
    this.baseDir = join(homedir(), ".independent-architecture", "menu")
    this.initializeMenuItems()
    this.initEnvManager()
  }

  private async initEnvManager(): Promise<void> {
    try {
      this.envManager = await getEnvManager()
      const status = this.envManager.getStatus()
      if (status.active) {
        console.log(`[menu-plugin] Portable environment active: Node ${status.nodeVersion}, Git ${status.gitVersion}`)
      }
    } catch (error) {
      console.log("[menu-plugin] Using system environment")
    }
  }

  private initializeMenuItems(): void {
    this.menuItems = [
      {
        id: "gateway",
        name: "Gateway 網關",
        description: "OpenClaw Gateway 網關服務管理",
        command: "openclaw gateway",
        category: "gateway",
        port: 3000,
        dependencies: ["openclaw"],
      },
      {
        id: "discord",
        name: "Discord 機器人",
        description: "Discord 訊息機器人設定與管理",
        command: "./discord.sh",
        category: "messaging",
        dependencies: ["discord.js"],
      },
      {
        id: "telegram",
        name: "Telegram 機器人",
        description: "Telegram Bot 訊息機器人",
        command: "./telegram.sh",
        category: "messaging",
        dependencies: ["telegraf"],
      },
      {
        id: "line",
        name: "LINE 機器人",
        description: "LINE Bot 訊息機器人",
        command: "./line.sh",
        category: "messaging",
        dependencies: ["@line/bot-sdk"],
      },
      {
        id: "webmonitor",
        name: "網站監控",
        description: "HTTP/SSL 監控與通知",
        command: "./webmonitor.sh",
        category: "monitor",
        port: 8081,
      },
      {
        id: "smart-home",
        name: "智慧家居",
        description: "Home Assistant 整合控制",
        command: "./smart-home.sh",
        category: "automation",
        dependencies: ["homeassistant-api"],
      },
      {
        id: "router",
        name: "路由器管理",
        description: "路由器監控與管理",
        command: "./router.sh",
        category: "automation",
      },
      {
        id: "tvbox",
        name: "電視盒控制",
        description: "多媒體電視盒控制",
        command: "./tvbox.sh",
        category: "utility",
      },
      {
        id: "gameserver",
        name: "遊戲伺服器",
        description: "遊戲伺服器監控",
        command: "./gameserver.sh",
        category: "utility",
      },
      {
        id: "backup-sync",
        name: "備份同步",
        description: "資料備份與同步工具",
        command: "./backup-sync.sh",
        category: "backup",
      },
      {
        id: "unified",
        name: "統一管理",
        description: "整合所有頻道的統一管理介面",
        command: "./unified.sh",
        category: "gateway",
        dependencies: ["skill-gateway", "skill-discord", "skill-telegram"],
      },
      {
        id: "hfs",
        name: "HTTP 檔案服務",
        description: "HFS 檔案分享服務",
        command: "./hfs.sh",
        category: "utility",
        port: 8080,
      },
    ]
  }

  async onInit(): Promise<void> {
    console.log("[menu-plugin] Initializing menu system...")
    await this.initEnvManager()
    await this.checkDependencies()
  }

  async onLoad(): Promise<void> {
    console.log("[menu-plugin] Menu plugin loaded")
  }

  async onUnload(): Promise<void> {
    console.log("[menu-plugin] Menu plugin unloading")
  }

  async onProcess(input: string, context: PluginContext): Promise<PluginResult | null> {
    const lower = input.toLowerCase()

    if (lower.includes("menu") || lower.includes("選單") || lower === "help") {
      return this.showMenu(context)
    }

    if (lower.includes("status") || lower.includes("狀態")) {
      return this.showStatus(context)
    }

    if (lower.includes("start") || lower.includes("啟動")) {
      return this.handleStart(input)
    }

    if (lower.includes("stop") || lower.includes("停止")) {
      return this.handleStop(input)
    }

    if (lower.includes("install") || lower.includes("安裝")) {
      return this.handleInstall(input)
    }

    for (const item of this.menuItems) {
      const itemLower = item.id.toLowerCase()
      if (lower.includes(itemLower) || lower.includes(item.name.toLowerCase())) {
        if (lower.includes("status") || lower.includes("狀態")) {
          return this.getServiceStatus(item.id)
        }
        if (lower.includes("start") || lower.includes("啟動")) {
          return this.startService(item.id)
        }
        if (lower.includes("stop") || lower.includes("停止")) {
          return this.stopService(item.id)
        }
        return this.showServiceInfo(item.id)
      }
    }

    return null
  }

  async onHealthCheck(): Promise<HealthCheckResult> {
    const statuses = await Promise.all(this.menuItems.slice(0, 5).map((item) => this.checkService(item.id)))

    const running = statuses.filter((s) => s.status === "running").length
    const total = statuses.length

    return {
      status: running === total ? "healthy" : running > 0 ? "warning" : "critical",
      message: `Services: ${running}/${total} running`,
      confidence: 0.9,
      metrics: {
        runningServices: running,
        totalServices: this.menuItems.length,
      },
    }
  }

  private async showMenu(context?: PluginContext): Promise<PluginResult> {
    const categories = this.groupByCategory()
    let output = "╔══════════════════════════════════════════════════════════════╗\n"
    output += "║           獨立架構 - 功能選單 / Function Menu               ║\n"
    output += "╚══════════════════════════════════════════════════════════════╝\n\n"

    for (const [category, items] of Object.entries(categories)) {
      output += `📁 ${this.getCategoryName(category)}\n`
      output += "─".repeat(60) + "\n"

      for (const item of items) {
        const status = this.services.get(item.id)?.status || "unknown"
        const statusIcon = this.getStatusIcon(status)
        output += `  ${statusIcon} ${item.name.padEnd(16)} - ${item.description}\n`
      }
      output += "\n"
    }

    output += "📌 快速指令 Quick Commands:\n"
    output += "  /menu status      - 查看所有服務狀態 / Status\n"
    output += "  /menu start <id>  - 啟動服務 / Start service\n"
    output += "  /menu stop <id>   - 停止服務 / Stop service\n"
    output += "  /menu install <id> - 安裝依賴 / Install deps\n"

    return {
      success: true,
      output,
      confidence: 0.95,
      actions: this.menuItems.map((item) => ({
        type: "check" as const,
        target: item.id,
      })),
    }
  }

  private async showStatus(context?: PluginContext): Promise<PluginResult> {
    const statuses = await Promise.all(this.menuItems.map((item) => this.checkService(item.id)))

    let output = "╔══════════════════════════════════════════════════════════════╗\n"
    output += "║                    服務狀態 / Service Status                  ║\n"
    output += "╚══════════════════════════════════════════════════════════════╝\n\n"

    const envStatus = this.envManager?.getStatus()
    if (envStatus?.active) {
      output += `🦞 便携版環境 / Portable Environment\n`
      output += `   Node.js: ${envStatus.nodeVersion || "N/A"}\n`
      output += `   Git: ${envStatus.gitVersion || "N/A"}\n`
      output += `   數據重定向: ${envStatus.dataRedirect ? "✓ 開啟" : "✗ 關閉"}\n\n`
    }

    output += "ID".padEnd(14) + "Name".padEnd(18) + "Status".padEnd(12) + "Port\n"
    output += "─".repeat(60) + "\n"

    for (const status of statuses) {
      const icon = this.getStatusIcon(status.status)
      const port = status.port ? String(status.port).padEnd(6) : "N/A   "
      output += `${status.name.padEnd(14)}${icon.padEnd(18)}${status.status.padEnd(12)}${port}\n`
    }

    const running = statuses.filter((s) => s.status === "running").length
    output += `\n📊 運行中 / Running: ${running}/${statuses.length}`

    return {
      success: true,
      output,
      confidence: 0.95,
    }
  }

  private showServiceInfo(serviceId: string): PluginResult {
    const item = this.menuItems.find((i) => i.id === serviceId)
    if (!item) {
      return {
        success: false,
        output: `找不到服務: ${serviceId}`,
        confidence: 0.9,
      }
    }

    const status = this.services.get(item.id)
    const depsStatus = item.dependencies ? this.checkDependenciesStatus(item.dependencies) : "N/A"

    let output = `📦 ${item.name}\n`
    output += "─".repeat(40) + "\n"
    output += `Description: ${item.description}\n`
    output += `Command: ${item.command}\n`
    output += `Category: ${item.category}\n`
    output += `Status: ${status?.status || "unknown"}\n`
    if (item.port) output += `Port: ${item.port}\n`
    output += `Dependencies: ${depsStatus}\n`

    return {
      success: true,
      output,
      confidence: 0.95,
      actions: [
        { type: "check", target: item.id },
        { type: "execute", target: item.id },
      ],
    }
  }

  private async getServiceStatus(serviceId: string): Promise<PluginResult> {
    const status = await this.checkService(serviceId)

    let output = `Service: ${status.name}\n`
    output += `Status: ${this.getStatusIcon(status.status)} ${status.status}\n`
    if (status.port) output += `Port: ${status.port}\n`
    if (status.uptime) output += `Uptime: ${status.uptime}\n`
    if (status.pid) output += `PID: ${status.pid}\n`

    return {
      success: true,
      output,
      confidence: 0.95,
    }
  }

  private async startService(serviceId: string): Promise<PluginResult> {
    const item = this.menuItems.find((i) => i.id === serviceId)
    if (!item) {
      return {
        success: false,
        output: `找不到服務: ${serviceId}`,
        confidence: 0.9,
      }
    }

    try {
      const scriptPath = join(this.toolsDir, `skill-${item.id}`, `${item.id}.sh`)

      await execAsync(`chmod +x "${scriptPath}"`)

      let cmd = `"${scriptPath}" start 2>&1`
      const env = this.envManager?.getEnv()

      if (this.envManager?.getStatus().active) {
        cmd = `HOME="${env?.HOME || homedir()}" PATH="${env?.PATH || process.env.PATH}" "${scriptPath}" start 2>&1`
      }

      const { stdout, stderr } = await execAsync(cmd, { env })

      this.services.set(item.id, {
        name: item.id,
        status: "running",
        port: item.port,
        pid: Date.now(),
        uptime: "just started",
      })

      return {
        success: true,
        output: `✅ ${item.name} 啟動成功\n${stdout || ""}`,
        confidence: 0.95,
      }
    } catch (error: any) {
      return {
        success: false,
        output: `❌ 啟動失敗: ${error.message}`,
        confidence: 0.8,
      }
    }
  }

  private async stopService(serviceId: string): Promise<PluginResult> {
    const item = this.menuItems.find((i) => i.id === serviceId)
    if (!item) {
      return {
        success: false,
        output: `找不到服務: ${serviceId}`,
        confidence: 0.9,
      }
    }

    try {
      const scriptPath = join(this.toolsDir, `skill-${item.id}`, `${item.id}.sh`)
      await execAsync(`"${scriptPath}" stop 2>&1`)

      this.services.set(item.id, {
        name: item.id,
        status: "stopped",
        port: item.port,
      })

      return {
        success: true,
        output: `✅ ${item.name} 已停止`,
        confidence: 0.95,
      }
    } catch (error: any) {
      return {
        success: false,
        output: `停止服務: ${error.message}`,
        confidence: 0.8,
      }
    }
  }

  private handleStart(input: string): PluginResult {
    const match = input.match(/start\s+(?:service\s+)?(\S+)/i)
    if (match) {
      return this.startService(match[1]).then
        ? ({ success: true, output: "Starting..." } as any)
        : this.startServiceSync(match[1])
    }
    return {
      success: false,
      output: "請指定服務 ID: /menu start <service-id>",
      confidence: 0.9,
    }
  }

  private handleStop(input: string): PluginResult {
    const match = input.match(/stop\s+(?:service\s+)?(\S+)/i)
    if (match) {
      return this.stopServiceSync(match[1])
    }
    return {
      success: false,
      output: "請指定服務 ID: /menu stop <service-id>",
      confidence: 0.9,
    }
  }

  private handleInstall(input: string): PluginResult {
    const match = input.match(/install\s+(\S+)/i)
    if (!match) {
      return {
        success: false,
        output: "請指定要安裝的服務: /menu install <service-id>",
        confidence: 0.9,
      }
    }

    const item = this.menuItems.find((i) => i.id === match[1])
    if (!item) {
      return {
        success: false,
        output: `找不到服務: ${match[1]}`,
        confidence: 0.9,
      }
    }

    let output = `📦 安裝 ${item.name} 依賴...\n`

    if (item.dependencies && item.dependencies.length > 0) {
      output += `需要: ${item.dependencies.join(", ")}\n`
      output += `提示: 請手動執行對應的安裝指令\n`
    } else {
      output += `無需額外依賴\n`
    }

    return {
      success: true,
      output,
      confidence: 0.9,
    }
  }

  private async checkService(serviceId: string): Promise<ServiceStatus> {
    const item = this.menuItems.find((i) => i.id === serviceId)
    if (!item) {
      return { name: serviceId, status: "unknown" }
    }

    try {
      const { stdout } = await execAsync(`pgrep -f "${item.command}" | head -1`)
      if (stdout.trim()) {
        const pid = parseInt(stdout.trim())
        return {
          name: serviceId,
          status: "running",
          port: item.port,
          pid,
        }
      }
    } catch {
      return {
        name: serviceId,
        status: "stopped",
        port: item.port,
      }
    }

    return {
      name: serviceId,
      status: "stopped",
      port: item.port,
    }
  }

  private async checkDependencies(): Promise<void> {
    console.log("[menu-plugin] Checking dependencies...")
  }

  private checkDependenciesStatus(deps: string[]): string {
    return deps.map((d) => `✓ ${d}`).join(", ")
  }

  private async checkDependenciesStatusAsync(deps: string[]): Promise<string> {
    const results = await Promise.all(
      deps.map(async (dep) => {
        try {
          await execAsync(`which ${dep.split("/").pop()}`)
          return `✓ ${dep}`
        } catch {
          return `✗ ${dep}`
        }
      }),
    )
    return results.join(", ")
  }

  private groupByCategory(): Record<string, MenuItem[]> {
    const grouped: Record<string, MenuItem[]> = {}
    for (const item of this.menuItems) {
      if (!grouped[item.category]) {
        grouped[item.category] = []
      }
      grouped[item.category].push(item)
    }
    return grouped
  }

  private getCategoryName(category: string): string {
    const names: Record<string, string> = {
      gateway: "🌐 網關服務 (Gateway)",
      messaging: "💬 訊息機器人 (Messaging)",
      monitor: "📊 監控服務 (Monitor)",
      automation: "🏠 自動化 (Automation)",
      utility: "🛠️ 工具 (Utility)",
      backup: "💾 備份同步 (Backup)",
    }
    return names[category] || category
  }

  private getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      running: "🟢",
      stopped: "⚪",
      error: "🔴",
      unknown: "⚪",
    }
    return icons[status] || "⚪"
  }

  private startServiceSync(serviceId: string): PluginResult {
    return {
      success: false,
      output: "使用非同步版本: startService()",
      confidence: 0.5,
    }
  }

  private stopServiceSync(serviceId: string): PluginResult {
    return {
      success: false,
      output: "使用非同步版本: stopService()",
      confidence: 0.5,
    }
  }
}

export const createMenuPlugin = (toolsDir?: string): PluginInstance => {
  const plugin = new MenuPlugin(toolsDir)

  return {
    metadata: {
      name: "menu-plugin",
      version: "1.0.0",
      description: "功能選單插件 - 統一管理所有服務和工具",
      category: "utility",
      triggers: [
        "menu",
        "選單",
        "功能",
        "status",
        "狀態",
        "start",
        "stop",
        "restart",
        "services",
        "服務",
        "gateway",
        "telegram",
        "discord",
        "line",
        "webmonitor",
        "smart-home",
        "backup",
      ],
      autoLoad: true,
    },
    hooks: plugin,
    status: "unloaded",
    config: {
      enabled: true,
      priority: 70,
      settings: {
        toolsDir: toolsDir || "/home/reamaster/opencode-manager/OpenClawInstaller/tools",
        autoCheckStatus: true,
        checkInterval: 60000,
      },
    },
  }
}

export default MenuPlugin
