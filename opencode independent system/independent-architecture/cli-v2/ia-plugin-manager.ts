// 插件管理器 - 統一管理獨立架構插件系統

import { homedir } from "os"
import { join } from "path"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { Log } from "../util/log"
import type { CLIContext, CLIState } from "./core"
import type { Plugin, PluginMetadata } from "./plugin-system"

export const log = Log.create({ service: "ia-plugin-manager" })

// ============================================
// 插件配置
// ============================================

export interface PluginConfig {
  enabled: boolean
  priority: number
  settings?: Record<string, any>
}

export interface PluginRegistry {
  plugins: Record<string, PluginConfig>
  lastUpdated: number
}

// ============================================
// 插件管理器類別
// ============================================

export class IAPluginManager {
  private baseDir: string
  private configFile: string
  private registry: PluginRegistry
  private plugins: Map<string, Plugin> = new Map()
  private enabledPlugins: Set<string> = new Set()

  constructor(dataDir?: string) {
    this.baseDir = dataDir || join(homedir(), ".independent-architecture", "plugins")
    this.configFile = join(this.baseDir, "registry.json")
    this.ensureDirectory()
    this.registry = this.loadRegistry()
  }

  private ensureDirectory(): void {
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true })
      log.info(`Created plugin directory: ${this.baseDir}`)
    }
  }

  private loadRegistry(): PluginRegistry {
    if (existsSync(this.configFile)) {
      try {
        const content = readFileSync(this.configFile, "utf-8")
        return JSON.parse(content)
      } catch (error) {
        log.warn("Failed to load plugin registry, using empty one")
      }
    }
    return { plugins: {}, lastUpdated: Date.now() }
  }

  private saveRegistry(): void {
    this.registry.lastUpdated = Date.now()
    writeFileSync(this.configFile, JSON.stringify(this.registry, null, 2))
    log.debug("Plugin registry saved")
  }

  // ============================================
  // 插件註冊
  // ============================================

  register(plugin: Plugin): void {
    const name = plugin.metadata.name

    if (this.plugins.has(name)) {
      log.warn(`Plugin already registered: ${name}`)
      return
    }

    this.plugins.set(name, plugin)

    // 初始化配置（如果不存在）
    if (!this.registry.plugins[name]) {
      this.registry.plugins[name] = {
        enabled: true,
        priority: 100,
        settings: {},
      }
      this.saveRegistry()
    }

    // 如果啟用，加入 enabledPlugins
    if (this.registry.plugins[name].enabled) {
      this.enabledPlugins.add(name)
    }

    log.info(`Plugin registered: ${name} v${plugin.metadata.version}`)
  }

  // ============================================
  // 插件載入/卸載
  // ============================================

  async enable(name: string): Promise<boolean> {
    if (!this.plugins.has(name)) {
      log.error(`Plugin not found: ${name}`)
      return false
    }

    this.registry.plugins[name].enabled = true
    this.enabledPlugins.add(name)
    this.saveRegistry()

    log.info(`Plugin enabled: ${name}`)
    return true
  }

  async disable(name: string): Promise<boolean> {
    if (!this.plugins.has(name)) {
      log.error(`Plugin not found: ${name}`)
      return false
    }

    this.registry.plugins[name].enabled = false
    this.enabledPlugins.delete(name)
    this.saveRegistry()

    log.info(`Plugin disabled: ${name}`)
    return true
  }

  async reload(name: string): Promise<boolean> {
    if (!this.plugins.has(name)) {
      log.error(`Plugin not found: ${name}`)
      return false
    }

    const plugin = this.plugins.get(name)!

    // 執行 shutdown
    if (plugin.shutdown) {
      await plugin.shutdown()
    }

    // 執行 init
    if (plugin.init) {
      await plugin.init({} as CLIContext)
    }

    log.info(`Plugin reloaded: ${name}`)
    return true
  }

  async reloadAll(): Promise<void> {
    for (const name of this.enabledPlugins) {
      await this.reload(name)
    }
    log.info("All plugins reloaded")
  }

  // ============================================
  // 查詢
  // ============================================

  get(name: string): Plugin | undefined {
    return this.plugins.get(name)
  }

  isEnabled(name: string): boolean {
    return this.enabledPlugins.has(name)
  }

  list(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  listEnabled(): Plugin[] {
    return Array.from(this.enabledPlugins).map((name) => this.plugins.get(name)!)
  }

  listDisabled(): Plugin[] {
    return Array.from(this.plugins.keys())
      .filter((name) => !this.enabledPlugins.has(name))
      .map((name) => this.plugins.get(name)!)
  }

  getConfig(name: string): PluginConfig | undefined {
    return this.registry.plugins[name]
  }

  // ============================================
  // 設定
  // ============================================

  setPriority(name: string, priority: number): boolean {
    if (!this.registry.plugins[name]) {
      return false
    }
    this.registry.plugins[name].priority = priority
    this.saveRegistry()
    return true
  }

  setSettings(name: string, settings: Record<string, any>): boolean {
    if (!this.registry.plugins[name]) {
      return false
    }
    this.registry.plugins[name].settings = settings
    this.saveRegistry()
    return true
  }

  updateSettings(name: string, updates: Record<string, any>): boolean {
    if (!this.registry.plugins[name]) {
      return false
    }
    this.registry.plugins[name].settings = {
      ...this.registry.plugins[name].settings,
      ...updates,
    }
    this.saveRegistry()
    return true
  }

  // ============================================
  // 匯出
  // ============================================

  getRegistry(): PluginRegistry {
    return { ...this.registry }
  }

  exportConfig(): string {
    return JSON.stringify(this.registry, null, 2)
  }

  async importConfig(config: string): Promise<boolean> {
    try {
      const imported = JSON.parse(config) as PluginRegistry
      this.registry = imported
      this.saveRegistry()

      // 重新同步 enabledPlugins
      this.enabledPlugins.clear()
      for (const [name, cfg] of Object.entries(this.registry.plugins)) {
        if (cfg.enabled) {
          this.enabledPlugins.add(name)
        }
      }

      log.info("Configuration imported successfully")
      return true
    } catch (error) {
      log.error("Failed to import configuration", { error })
      return false
    }
  }
}

// ============================================
// 預設插件配置
// ============================================

export const DEFAULT_PLUGIN_CONFIG: Record<string, PluginConfig> = {
  "builtin-logger": {
    enabled: true,
    priority: 100,
    settings: { logLevel: "info" },
  },
  "builtin-memory": {
    enabled: true,
    priority: 90,
    settings: { maxHistory: 1000 },
  },
  "builtin-error": {
    enabled: true,
    priority: 80,
    settings: {},
  },
}
