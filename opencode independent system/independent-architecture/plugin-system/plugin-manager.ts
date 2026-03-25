// 插件管理器 - 統一管理所有技能插件

import { EventEmitter } from "events"
import { join } from "path"
import { homedir, hostname, platform } from "os"
import {
  PluginMetadata,
  PluginHooks,
  PluginInstance,
  PluginContext,
  PluginResult,
  PluginEvent,
  PluginConfig,
  PluginStatus,
  HealthCheckResult,
} from "./skill-plugin.interface"
import { PluginLoader, LoadedSkill } from "./plugin-loader"
import { MemoryPlugin, createMemoryPlugin } from "./memory-plugin"

const log = {
  info: (msg: string, ...args: any[]) => console.log(`[plugin-manager] ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) => console.warn(`[plugin-manager] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) => console.error(`[plugin-manager] ${msg}`, ...args),
}

export interface PluginRegistry {
  name: string
  version: string
  description: string
  plugins: Map<string, PluginInstance>
  skills: LoadedSkill[]
  hooks: Map<string, EventEmitter>
}

export interface PluginManagerConfig {
  pluginDirs: string[]
  skillDirs: string[]
  dataDir?: string
  autoLoad: boolean
  maxPlugins: number
}

export class PluginManager extends EventEmitter {
  private plugins: Map<string, PluginInstance> = new Map()
  private skills: Map<string, LoadedSkill> = new Map()
  private triggers: Map<string, string[]> = new Map()
  private hooks: Map<string, EventEmitter> = new Map()
  private loader: PluginLoader
  private memory: MemoryPlugin
  private config: PluginManagerConfig
  private initialized: boolean = false

  constructor(config?: Partial<PluginManagerConfig>) {
    super()

    const baseDir = config?.dataDir || join(homedir(), ".independent-architecture")

    this.config = {
      pluginDirs: config?.pluginDirs || [join(baseDir, "plugins"), join(baseDir, "plugin-system")],
      skillDirs: config?.skillDirs || [
        join(baseDir, "skill"),
        join(baseDir, ".opencode", "skill"),
        "/home/reamaster/opencode-manager/opencode independent system/.opencode/skill",
        "/home/reamaster/opencode-manager/opencode independent system/independent-architecture/extensions",
      ],
      dataDir: baseDir,
      autoLoad: config?.autoLoad ?? true,
      maxPlugins: config?.maxPlugins ?? 100,
    }

    this.loader = new PluginLoader(this.config.skillDirs)
    this.memory = new MemoryPlugin(this.config.dataDir)
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      log.warn("PluginManager already initialized")
      return
    }

    log.info("Initializing PluginManager...")

    try {
      await this.memory.onInit()

      if (this.config.autoLoad) {
        await this.loadBuiltInPlugins()
        await this.scanSkills()
        await this.buildTriggerIndex()
      }

      this.initialized = true
      this.emit("initialized")
      log.info(`PluginManager ready: ${this.plugins.size} plugins, ${this.skills.size} skills`)
    } catch (error) {
      log.error("Failed to initialize PluginManager", error)
      throw error
    }
  }

  private async loadBuiltInPlugins(): Promise<void> {
    const builtInPlugins: PluginInstance[] = [createMemoryPlugin(this.config.dataDir)]

    for (const plugin of builtInPlugins) {
      await this.registerPlugin(plugin)
    }
  }

  private async scanSkills(): Promise<void> {
    const loadedSkills = await this.loader.scanSkills()

    for (const skill of loadedSkills) {
      this.skills.set(skill.name, skill)

      for (const trigger of skill.definition.triggers) {
        if (!this.triggers.has(trigger)) {
          this.triggers.set(trigger, [])
        }
        this.triggers.get(trigger)!.push(skill.name)
      }
    }

    log.info(`Scanned ${loadedSkills.length} skills`)
  }

  private buildTriggerIndex(): void {
    for (const [name, skill] of this.skills) {
      for (const trigger of skill.definition.triggers) {
        if (!this.triggers.has(trigger)) {
          this.triggers.set(trigger, [])
        }
        const list = this.triggers.get(trigger)!
        if (!list.includes(name)) {
          list.push(name)
        }
      }

      for (const cmd of skill.definition.commands || []) {
        if (!this.triggers.has(cmd)) {
          this.triggers.set(cmd, [])
        }
        const list = this.triggers.get(cmd)!
        if (!list.includes(name)) {
          list.push(name)
        }
      }
    }
  }

  async registerPlugin(plugin: PluginInstance): Promise<boolean> {
    if (this.plugins.has(plugin.metadata.name)) {
      log.warn(`Plugin ${plugin.metadata.name} already registered`)
      return false
    }

    if (this.plugins.size >= this.config.maxPlugins) {
      log.error("Maximum plugin limit reached")
      return false
    }

    try {
      plugin.status = "initializing"
      this.plugins.set(plugin.metadata.name, plugin)
      this.emit("plugin:registered", { name: plugin.metadata.name })

      for (const trigger of plugin.metadata.triggers || []) {
        if (!this.triggers.has(trigger)) {
          this.triggers.set(trigger, [])
        }
        this.triggers.get(trigger)!.push(plugin.metadata.name)
      }

      if (plugin.hooks.onInit) {
        await plugin.hooks.onInit()
      }

      if (plugin.config.enabled) {
        await this.enablePlugin(plugin.metadata.name)
      }

      log.info(`Registered plugin: ${plugin.metadata.name} v${plugin.metadata.version}`)
      return true
    } catch (error) {
      log.error(`Failed to register plugin ${plugin.metadata.name}`, error)
      this.plugins.delete(plugin.metadata.name)
      return false
    }
  }

  async unregisterPlugin(name: string): Promise<boolean> {
    const plugin = this.plugins.get(name)
    if (!plugin) {
      return false
    }

    try {
      if (plugin.hooks.onUnload) {
        await plugin.hooks.onUnload()
      }

      this.plugins.delete(name)

      for (const [trigger, list] of this.triggers) {
        this.triggers.set(
          trigger,
          list.filter((n) => n !== name),
        )
      }

      this.emit("plugin:unregistered", { name })
      log.info(`Unregistered plugin: ${name}`)
      return true
    } catch (error) {
      log.error(`Failed to unregister plugin ${name}`, error)
      return false
    }
  }

  async enablePlugin(name: string): Promise<boolean> {
    const plugin = this.plugins.get(name)
    if (!plugin) return false

    try {
      if (plugin.hooks.onLoad) {
        await plugin.hooks.onLoad()
      }
      plugin.status = "loaded"
      plugin.loadedAt = Date.now()
      plugin.config.enabled = true
      this.emit("plugin:enabled", { name })
      return true
    } catch (error) {
      log.error(`Failed to enable plugin ${name}`, error)
      plugin.status = "error"
      return false
    }
  }

  async disablePlugin(name: string): Promise<boolean> {
    const plugin = this.plugins.get(name)
    if (!plugin) return false

    try {
      if (plugin.hooks.onUnload) {
        await plugin.hooks.onUnload()
      }
      plugin.status = "unloaded"
      plugin.config.enabled = false
      this.emit("plugin:disabled", { name })
      return true
    } catch (error) {
      log.error(`Failed to disable plugin ${name}`, error)
      return false
    }
  }

  async process(input: string, context?: PluginContext): Promise<PluginResult[]> {
    const results: PluginResult[] = []
    const matchedPlugins = this.findMatchedPlugins(input)

    for (const name of matchedPlugins) {
      const plugin = this.plugins.get(name)
      if (!plugin || !plugin.config.enabled) continue

      try {
        if (plugin.hooks.onProcess) {
          const result = await plugin.hooks.onProcess(input, context || {})
          if (result) {
            results.push(result)
          }
        }
      } catch (error) {
        log.error(`Plugin ${name} process error`, error)
        results.push({
          success: false,
          output: `Plugin ${name} error: ${error instanceof Error ? error.message : "Unknown"}`,
          confidence: 0,
        })
      }
    }

    return results.sort((a, b) => (b.priority || 50) - (a.priority || 50))
  }

  private findMatchedPlugins(input: string): string[] {
    const matched = new Set<string>()
    const lower = input.toLowerCase()

    for (const [trigger, names] of this.triggers) {
      const triggerLower = trigger.toLowerCase()

      if (lower.includes(triggerLower) || triggerLower.includes(lower)) {
        for (const name of names) {
          matched.add(name)
        }
      }
    }

    return Array.from(matched)
  }

  async healthCheck(): Promise<{
    overall: "healthy" | "warning" | "critical"
    plugins: Map<string, HealthCheckResult>
    skills: number
  }> {
    const pluginHealth = new Map<string, HealthCheckResult>()
    let healthy = 0
    let warnings = 0
    let critical = 0

    for (const [name, plugin] of this.plugins) {
      try {
        if (plugin.hooks.onHealthCheck) {
          const result = await plugin.hooks.onHealthCheck()
          pluginHealth.set(name, result)

          if (result.status === "healthy") healthy++
          else if (result.status === "warning") warnings++
          else critical++
        }
      } catch (error) {
        pluginHealth.set(name, {
          status: "critical",
          message: `Health check failed: ${error instanceof Error ? error.message : "Unknown"}`,
          confidence: 0,
        })
        critical++
      }
    }

    return {
      overall: critical > 0 ? "critical" : warnings > 0 ? "warning" : "healthy",
      plugins: pluginHealth,
      skills: this.skills.size,
    }
  }

  getPlugin(name: string): PluginInstance | undefined {
    return this.plugins.get(name)
  }

  getPlugins(category?: string): PluginInstance[] {
    const all = Array.from(this.plugins.values())
    if (!category) return all
    return all.filter((p) => p.metadata.category === category)
  }

  getSkill(name: string): LoadedSkill | undefined {
    return this.skills.get(name)
  }

  getAllSkills(): LoadedSkill[] {
    return Array.from(this.skills.values())
  }

  getSkillsByCategory(category: string): LoadedSkill[] {
    return Array.from(this.skills.values()).filter((s) =>
      s.definition.description.toLowerCase().includes(category.toLowerCase()),
    )
  }

  getTriggers(): Map<string, string[]> {
    return this.triggers
  }

  getRegistry(): PluginRegistry {
    return {
      name: "independent-architecture-plugin-registry",
      version: "1.0.0",
      description: "獨立架構插件註冊表",
      plugins: this.plugins,
      skills: Array.from(this.skills.values()),
      hooks: this.hooks,
    }
  }

  async shutdown(): Promise<void> {
    log.info("Shutting down PluginManager...")

    for (const [name, plugin] of this.plugins) {
      try {
        if (plugin.hooks.onUnload) {
          await plugin.hooks.onUnload()
        }
      } catch (error) {
        log.error(`Error unloading plugin ${name}`, error)
      }
    }

    this.plugins.clear()
    this.skills.clear()
    this.triggers.clear()

    this.emit("shutdown")
    log.info("PluginManager shutdown complete")
  }
}

export default PluginManager
