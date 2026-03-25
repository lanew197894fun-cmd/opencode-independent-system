// 舊插件適配器 - 將舊插件介面轉換為 CLI v2 Hook

import { Log } from "../util/log"
import type { Plugin, HookName } from "./plugin-system"
import type { CLIContext, CLIState } from "./core"

export const log = Log.create({ service: "legacy-adapter" })

// ============================================
// 舊插件介面
// ============================================

interface PluginHooks {
  onInit?(): Promise<void>
  onLoad?(): Promise<void>
  onUnload?(): Promise<void>
  onProcess?(input: string, context: any): Promise<any>
  onHealth?(): Promise<any>
}

interface PluginMetadata {
  name: string
  version: string
  description?: string
}

// ============================================
// 舊插件到 CLI v2 Hook 的映射
// ============================================

const LEGACY_TO_HOOK: Record<string, HookName> = {
  memory: "chat.before",
  recall: "chat.before",
  store: "chat.after",
  security: "cli.init",
  menu: "cli.start",
  repair: "chat.after",
  channel: "chat.after",
}

// ============================================
// 適配器類別
// ============================================

export class LegacyPluginAdapter {
  private legacyPlugin: PluginHooks
  private metadata: PluginMetadata
  private enabled: boolean = true
  private context: CLIContext | null = null

  constructor(legacyPlugin: PluginHooks, metadata: PluginMetadata) {
    this.legacyPlugin = legacyPlugin
    this.metadata = metadata
  }

  setContext(context: CLIContext): void {
    this.context = context
  }

  async initialize(): Promise<void> {
    if (this.legacyPlugin.onInit) {
      await this.legacyPlugin.onInit()
    }
    if (this.legacyPlugin.onLoad) {
      await this.legacyPlugin.onLoad()
    }
    log.info(`Legacy plugin initialized: ${this.metadata.name}`)
  }

  async shutdown(): Promise<void> {
    if (this.legacyPlugin.onUnload) {
      await this.legacyPlugin.onUnload()
    }
    log.info(`Legacy plugin shutdown: ${this.metadata.name}`)
  }

  // 創建 CLI v2 Plugin
  toV2Plugin(): Plugin {
    const adapter = this

    return {
      metadata: this.metadata,
      hooks: {
        "cli.init": async ({ state }) => {
          adapter.setContext(state.getContext())
          await adapter.initialize()
        },
        "cli.start": async ({ state }) => {
          adapter.setContext(state.getContext())
        },
        "cli.shutdown": async () => {
          await adapter.shutdown()
        },
        "chat.before": async ({ message }) => {
          if (!adapter.enabled) return message

          // 嘗試讓舊插件處理
          if (adapter.legacyPlugin.onProcess) {
            try {
              const result = await adapter.legacyPlugin.onProcess(message, { context: adapter.context })
              if (result?.modifiedInput) {
                return result.modifiedInput
              }
            } catch (e) {
              log.warn(`Legacy plugin ${adapter.metadata.name} process error`, { error: String(e) })
            }
          }

          return message
        },
        "chat.after": async ({ message, response }) => {
          if (!adapter.enabled) return

          // 讓舊插件處理響應
          if (adapter.legacyPlugin.onProcess) {
            try {
              await adapter.legacyPlugin.onProcess(`[response] ${response}`, {
                context: adapter.context,
                originalInput: message,
              })
            } catch (e) {
              log.warn(`Legacy plugin ${adapter.metadata.name} process error`, { error: String(e) })
            }
          }
        },
        "chat.error": async ({ message, error }) => {
          log.error(`Chat error in ${adapter.metadata.name}`, { message, error: error.message })
        },
      },
    }
  }
}

// ============================================
// 舊插件創建工廠
// ============================================

export function createLegacyPluginAdapter(legacyPlugin: PluginHooks, metadata: PluginMetadata): LegacyPluginAdapter {
  return new LegacyPluginAdapter(legacyPlugin, metadata)
}

// ============================================
// Memory Plugin 適配器
// ============================================

export function createMemoryAdapter(dataDir?: string): LegacyPluginAdapter {
  const MemoryPlugin = class implements PluginHooks {
    private storage: Map<string, any> = new Map()
    private storageFile: string

    constructor() {
      this.storageFile = `${dataDir || "~/.independent-architecture/memory"}/memory-store.json`
    }

    async onInit(): Promise<void> {
      log.info("Memory adapter initialized")
    }

    async onLoad(): Promise<void> {
      log.info("Memory adapter loaded")
    }

    async onProcess(input: string, context: any): Promise<any> {
      const lower = input.toLowerCase()

      // 記憶召回
      if (lower.includes("recall") || lower.includes("記住") || lower.includes("搜尋")) {
        const query = lower.replace(/.*recall|記住|搜尋/g, "").trim()
        return { type: "recall", query }
      }

      // 記憶存儲
      if (lower.includes("store") || lower.includes("記住")) {
        return { type: "store", input }
      }

      return null
    }
  }

  return createLegacyPluginAdapter(new MemoryPlugin(), {
    name: "memory-adapter",
    version: "1.0.0",
    description: "記憶系統適配器",
  })
}

// ============================================
// Security Plugin 適配器
// ============================================

export function createSecurityAdapter(dataDir?: string): LegacyPluginAdapter {
  const SecurityPlugin = class implements PluginHooks {
    private enabled: boolean = false

    async onInit(): Promise<void> {
      log.info("Security adapter initialized")
    }

    async onLoad(): Promise<void> {
      log.info("Security adapter loaded")
    }

    async onProcess(input: string, context: any): Promise<any> {
      const lower = input.toLowerCase()

      // 安全檢查
      if (lower.includes("security") || lower.includes("安全")) {
        return { type: "security-check" }
      }

      // 危險指令檢測
      const dangerous = ["rm -rf", "sudo rm", ":(){ :|:& };:", "curl | sh", "dd if="]
      for (const d of dangerous) {
        if (input.includes(d)) {
          log.warn("Dangerous command detected", { pattern: d })
          return {
            type: "block",
            modifiedInput: `[安全警告] 已攔截危險指令: ${d}`,
          }
        }
      }

      return null
    }
  }

  return createLegacyPluginAdapter(new SecurityPlugin(), {
    name: "security-adapter",
    version: "1.0.0",
    description: "安全系統適配器",
  })
}

// ============================================
// Repair Plugin 適配器
// ============================================

export function createRepairAdapter(): LegacyPluginAdapter {
  const repairs: { date: string; items: string[] }[] = [
    { date: "2026-03-22", items: ["CLI v2 插件系統建立", "CLI v2 Hook 系統實作"] },
    { date: "2026-03-21", items: ["獨立 CLI v1 建立"] },
  ]

  const RepairPlugin = class implements PluginHooks {
    async onInit(): Promise<void> {
      log.info("Repair adapter initialized")
    }

    async onLoad(): Promise<void> {
      log.info("Repair adapter loaded")
    }

    async onProcess(input: string, context: any): Promise<any> {
      const lower = input.toLowerCase()

      if (lower.includes("repair") || lower.includes("維修") || lower.includes("修復")) {
        if (lower.includes("list") || lower.includes("列表")) {
          return { type: "repair-list", repairs }
        }
        if (lower.includes("add") || lower.includes("新增")) {
          const item = input.replace(/.*add|新增/g, "").trim()
          repairs[0].items.push(item)
          return { type: "repair-added", item }
        }
        return { type: "repair-info", repairs }
      }

      return null
    }
  }

  return createLegacyPluginAdapter(new RepairPlugin(), {
    name: "repair-adapter",
    version: "1.0.0",
    description: "維修記錄適配器",
  })
}

// ============================================
// 導出所有舊插件適配器
// ============================================

export function getLegacyAdapters(dataDir?: string): LegacyPluginAdapter[] {
  return [createMemoryAdapter(dataDir), createSecurityAdapter(dataDir), createRepairAdapter()]
}
