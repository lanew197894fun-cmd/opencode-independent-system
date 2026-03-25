// 獨立架構指揮官 - 服務統一管理系統

import { homedir } from "os"
import { join } from "path"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { exec, spawn, ChildProcess } from "child_process"
import { promisify } from "util"
import { Log } from "../util/log"

const execAsync = promisify(exec)

export const log = Log.create({ service: "commander" })

// ============================================
// 服務狀態
// ============================================

export type ServiceStatus = "running" | "stopped" | "error" | "starting" | "stopping" | "unknown"

export interface Service {
  name: string
  description: string
  command: string
  args?: string[]
  cwd?: string
  env?: Record<string, string>
  port?: number
  healthCheck?: string
  healthInterval?: number
  autoRestart?: boolean
  dependsOn?: string[]
  status: ServiceStatus
  pid?: number
  uptime?: number
  lastCheck?: number
  restartCount: number
  lastError?: string
}

export interface ServiceHealth {
  healthy: boolean
  responseTime?: number
  message?: string
}

// ============================================
// 指揮官配置
// ============================================

export interface CommanderConfig {
  servicesDir: string
  logDir: string
  pidDir: string
  healthCheckInterval: number
  autoRestart: boolean
  maxRestartAttempts: number
  restartCooldown: number
}

// ============================================
// 事件類型
// ============================================

export interface CommanderEvent {
  type:
    | "service.started"
    | "service.stopped"
    | "service.error"
    | "service.health_ok"
    | "service.health_fail"
    | "commander.ready"
  service?: string
  message: string
  timestamp: number
  data?: any
}

// ============================================
// 獨立架構指揮官
// ============================================

export class Commander {
  private config: CommanderConfig
  private services: Map<string, Service> = new Map()
  private processes: Map<string, ChildProcess> = new Map()
  private healthTimers: Map<string, NodeJS.Timeout> = new Map()
  private events: CommanderEvent[] = []
  private listeners: ((event: CommanderEvent) => void)[] = []
  private initialized: boolean = false

  constructor(config?: Partial<CommanderConfig>) {
    const baseDir = join(homedir(), ".independent-architecture", "commander")

    this.config = {
      servicesDir: config?.servicesDir || join(baseDir, "services"),
      logDir: config?.logDir || join(baseDir, "logs"),
      pidDir: config?.pidDir || join(baseDir, "pids"),
      healthCheckInterval: config?.healthCheckInterval || 30000, // 30秒
      autoRestart: config?.autoRestart ?? true,
      maxRestartAttempts: config?.maxRestartAttempts || 3,
      restartCooldown: config?.restartCooldown || 5000, // 5秒冷卻
    }

    this.ensureDirectories()
    this.loadServices()
  }

  private ensureDirectories(): void {
    for (const dir of [this.config.servicesDir, this.config.logDir, this.config.pidDir]) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
    }
  }

  private loadServices(): void {
    // 預設服務定義
    const defaultServices: Omit<Service, "status" | "restartCount">[] = [
      {
        name: "opencode",
        description: "OpenCode AI 服務",
        command: "bun",
        args: ["run", "start.js"],
        cwd: join(homedir(), "opencode-manager/opencode independent system/packages/opencode"),
        port: 3000,
        healthCheck: "http://localhost:3000/health",
        autoRestart: true,
      },
      {
        name: "openclaw",
        description: "OpenClaw 系統",
        command: "bun",
        args: ["run", "start.js"],
        cwd: join(homedir(), "opencode-manager/opencode independent system/ji-san-ji"),
        port: 8080,
        healthCheck: "http://localhost:8080/health",
        autoRestart: true,
        dependsOn: ["opencode"],
      },
      {
        name: "ollama",
        description: "Ollama 本地模型服務",
        command: "ollama",
        args: ["serve"],
        port: 11434,
        healthCheck: "http://localhost:11434/api/tags",
        autoRestart: true,
      },
    ]

    for (const svc of defaultServices) {
      this.services.set(svc.name, {
        ...svc,
        status: "stopped",
        restartCount: 0,
      })
    }

    log.info(`Loaded ${this.services.size} services`)
  }

  // ============================================
  // 服務管理
  // ============================================

  async startService(name: string): Promise<boolean> {
    const service = this.services.get(name)
    if (!service) {
      log.error(`Service not found: ${name}`)
      return false
    }

    if (service.status === "running") {
      log.warn(`Service already running: ${name}`)
      return true
    }

    // 檢查依賴
    if (service.dependsOn) {
      for (const dep of service.dependsOn) {
        const depService = this.services.get(dep)
        if (depService && depService.status !== "running") {
          log.info(`Starting dependency: ${dep}`)
          await this.startService(dep)
        }
      }
    }

    log.info(`Starting service: ${name}`)
    service.status = "starting"
    this.emit({ type: "service.started", service: name, message: `Starting ${name}`, timestamp: Date.now() })

    try {
      const cwd = service.cwd || process.cwd()
      const env = { ...process.env, ...service.env }

      const child = spawn(service.command, service.args || [], {
        cwd,
        env,
        stdio: "pipe",
        detached: false,
      })

      service.pid = child.pid
      service.status = "running"
      service.uptime = Date.now()
      service.lastError = undefined
      service.restartCount = 0

      this.processes.set(name, child)

      // 捕獲輸出
      child.stdout?.on("data", (data) => {
        this.writeLog(name, "stdout", data.toString())
      })

      child.stderr?.on("data", (data) => {
        this.writeLog(name, "stderr", data.toString())
      })

      child.on("error", (error) => {
        service.status = "error"
        service.lastError = error.message
        log.error(`Service error: ${name}`, { error })
        this.emit({
          type: "service.error",
          service: name,
          message: error.message,
          timestamp: Date.now(),
        })
      })

      child.on("exit", (code) => {
        service.status = "stopped"
        service.pid = undefined
        log.info(`Service exited: ${name}`, { code })
        this.emit({
          type: "service.stopped",
          service: name,
          message: `Service exited with code ${code}`,
          timestamp: Date.now(),
        })

        // 自動重啟
        if (this.config.autoRestart && service.autoRestart && service.restartCount < this.config.maxRestartAttempts) {
          service.restartCount++
          setTimeout(() => this.startService(name), this.config.restartCooldown)
        }
      })

      // 啟動健康檢查
      if (service.healthCheck) {
        this.startHealthCheck(name)
      }

      this.emit({
        type: "service.started",
        service: name,
        message: `Service started: ${name} (PID: ${service.pid})`,
        timestamp: Date.now(),
      })

      return true
    } catch (error: any) {
      service.status = "error"
      service.lastError = error.message
      log.error(`Failed to start service: ${name}`, { error })
      return false
    }
  }

  async stopService(name: string): Promise<boolean> {
    const service = this.services.get(name)
    if (!service) {
      log.error(`Service not found: ${name}`)
      return false
    }

    if (service.status !== "running" && service.status !== "starting") {
      log.warn(`Service not running: ${name}`)
      return true
    }

    log.info(`Stopping service: ${name}`)
    service.status = "stopping"

    const child = this.processes.get(name)
    if (child) {
      child.kill("SIGTERM")
      this.processes.delete(name)
    }

    // 停止健康檢查
    this.stopHealthCheck(name)

    service.status = "stopped"
    service.uptime = undefined
    service.pid = undefined

    this.emit({
      type: "service.stopped",
      service: name,
      message: `Service stopped: ${name}`,
      timestamp: Date.now(),
    })

    return true
  }

  async restartService(name: string): Promise<boolean> {
    log.info(`Restarting service: ${name}`)
    await this.stopService(name)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return await this.startService(name)
  }

  async startAll(): Promise<number> {
    let started = 0
    for (const [name, service] of this.services) {
      if (service.status !== "running") {
        const success = await this.startService(name)
        if (success) started++
        await new Promise((resolve) => setTimeout(resolve, 500)) // 順序啟動
      }
    }
    return started
  }

  async stopAll(): Promise<number> {
    let stopped = 0
    // 反順序停止
    const names = Array.from(this.services.keys()).reverse()
    for (const name of names) {
      const service = this.services.get(name)!
      if (service.status === "running") {
        const success = await this.stopService(name)
        if (success) stopped++
      }
    }
    return stopped
  }

  // ============================================
  // 健康檢查
  // ============================================

  private startHealthCheck(name: string): void {
    const service = this.services.get(name)
    if (!service || !service.healthCheck) return

    const interval = service.healthInterval || this.config.healthCheckInterval

    const timer = setInterval(async () => {
      const health = await this.checkServiceHealth(name)

      if (health.healthy) {
        this.emit({
          type: "service.health_ok",
          service: name,
          message: `Health check passed (${health.responseTime}ms)`,
          timestamp: Date.now(),
          data: health,
        })
      } else {
        this.emit({
          type: "service.health_fail",
          service: name,
          message: health.message || "Health check failed",
          timestamp: Date.now(),
          data: health,
        })

        // 自動重啟
        if (this.config.autoRestart && service.autoRestart) {
          log.warn(`Health check failed, restarting: ${name}`)
          await this.restartService(name)
        }
      }
    }, interval)

    this.healthTimers.set(name, timer)
  }

  private stopHealthCheck(name: string): void {
    const timer = this.healthTimers.get(name)
    if (timer) {
      clearInterval(timer)
      this.healthTimers.delete(name)
    }
  }

  async checkServiceHealth(name: string): Promise<ServiceHealth> {
    const service = this.services.get(name)
    if (!service) {
      return { healthy: false, message: "Service not found" }
    }

    if (!service.healthCheck) {
      // 沒有健康檢查，端看程序是否運行
      return {
        healthy: service.status === "running",
        message: service.status === "running" ? "Running (no health check)" : "Not running",
      }
    }

    const startTime = Date.now()

    try {
      // 簡單的 HTTP 健康檢查
      if (service.healthCheck.startsWith("http")) {
        const { stdout } = await execAsync(
          `curl -s -o /dev/null -w "%{http_code}" "${service.healthCheck}" --max-time 5`,
        )
        const healthy = stdout.trim() === "200"
        return {
          healthy,
          responseTime: Date.now() - startTime,
          message: healthy ? "OK" : `HTTP ${stdout.trim()}`,
        }
      }

      return { healthy: service.status === "running" }
    } catch (error: any) {
      return {
        healthy: false,
        message: error.message,
        responseTime: Date.now() - startTime,
      }
    }
  }

  // ============================================
  // 服務註冊
  // ============================================

  registerService(service: Omit<Service, "status" | "restartCount">): void {
    this.services.set(service.name, {
      ...service,
      status: "stopped",
      restartCount: 0,
    })
    log.info(`Service registered: ${service.name}`)
  }

  unregisterService(name: string): boolean {
    const service = this.services.get(name)
    if (service?.status === "running") {
      log.warn(`Cannot unregister running service: ${name}`)
      return false
    }
    return this.services.delete(name)
  }

  // ============================================
  // 查詢
  // ============================================

  getService(name: string): Service | undefined {
    return this.services.get(name)
  }

  getAllServices(): Service[] {
    return Array.from(this.services.values())
  }

  getRunningServices(): Service[] {
    return this.getAllServices().filter((s) => s.status === "running")
  }

  getStoppedServices(): Service[] {
    return this.getAllServices().filter((s) => s.status === "stopped")
  }

  getServiceStatus(): {
    total: number
    running: number
    stopped: number
    error: number
  } {
    const all = this.getAllServices()
    return {
      total: all.length,
      running: all.filter((s) => s.status === "running").length,
      stopped: all.filter((s) => s.status === "stopped").length,
      error: all.filter((s) => s.status === "error").length,
    }
  }

  // ============================================
  // 日誌
  // ============================================

  private writeLog(serviceName: string, type: "stdout" | "stderr", message: string): void {
    const logFile = join(this.config.logDir, `${serviceName}.log`)
    const timestamp = new Date().toISOString()
    const entry = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`

    try {
      writeFileSync(logFile, entry, { flag: "a" })
    } catch (error) {
      log.error("Failed to write log", { error })
    }
  }

  async getLogs(serviceName: string, lines: number = 100): Promise<string> {
    const logFile = join(this.config.logDir, `${serviceName}.log`)

    if (!existsSync(logFile)) {
      return `No logs for ${serviceName}`
    }

    try {
      const content = readFileSync(logFile, "utf-8")
      const allLines = content.split("\n").filter(Boolean)
      return allLines.slice(-lines).join("\n")
    } catch (error) {
      return `Failed to read logs: ${error}`
    }
  }

  // ============================================
  // 事件系統
  // ============================================

  onEvent(listener: (event: CommanderEvent) => void): void {
    this.listeners.push(listener)
  }

  private emit(event: CommanderEvent): void {
    this.events.push(event)

    // 只保留最近 100 個事件
    if (this.events.length > 100) {
      this.events = this.events.slice(-100)
    }

    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch (error) {
        log.error("Event listener error", { error })
      }
    }
  }

  getEvents(limit?: number): CommanderEvent[] {
    return limit ? this.events.slice(-limit) : [...this.events]
  }

  // ============================================
  // 初始化
  // ============================================

  async initialize(): Promise<void> {
    if (this.initialized) return

    log.info("Initializing Commander...")

    // 檢查是否有正在運行的服務
    for (const [name, service] of this.services) {
      try {
        if (service.pid) {
          process.kill(service.pid, 0) // 檢查進程是否存在
          service.status = "running"
        }
      } catch {
        service.status = "stopped"
        service.pid = undefined
      }
    }

    this.initialized = true
    this.emit({
      type: "commander.ready",
      message: "Commander initialized",
      timestamp: Date.now(),
    })

    log.info("Commander initialized")
  }

  // ============================================
  // 關閉
  // ============================================

  async shutdown(): Promise<void> {
    log.info("Shutting down Commander...")

    // 停止所有健康檢查
    for (const name of this.healthTimers.keys()) {
      this.stopHealthCheck(name)
    }

    // 停止所有服務
    await this.stopAll()

    this.initialized = false
    log.info("Commander shutdown complete")
  }
}

// ============================================
// 單例
// ============================================

let commanderInstance: Commander | null = null

export function getCommander(): Commander {
  if (!commanderInstance) {
    commanderInstance = new Commander()
  }
  return commanderInstance
}

export function resetCommander(): void {
  if (commanderInstance) {
    commanderInstance.shutdown()
  }
  commanderInstance = null
}
