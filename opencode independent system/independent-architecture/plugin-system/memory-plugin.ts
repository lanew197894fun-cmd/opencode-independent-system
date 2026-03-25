// 記憶系統插件 - 整合 memory-lancedb-pro 和 ai-memory 功能

import { homedir } from "os"
import { join } from "path"
import {
  PluginMetadata,
  PluginHooks,
  PluginInstance,
  PluginContext,
  PluginResult,
  PluginAction,
  HealthCheckResult,
} from "./skill-plugin.interface"

interface MemoryEntry {
  id: string
  type: "preference" | "fact" | "decision" | "entity" | "event" | "pattern" | "profile" | "case"
  content: string
  category: string
  importance: number
  confidence: number
  timestamp: number
  lastAccessed: number
  tags: string[]
  metadata?: Record<string, any>
  lifecycle?: "core" | "working" | "peripheral"
  decayScore?: number
}

interface MemoryStats {
  total: number
  byType: Record<string, number>
  byCategory: Record<string, number>
  avgConfidence: number
  avgImportance: number
}

export class MemoryPlugin implements PluginHooks {
  private storage: Map<string, MemoryEntry> = new Map()
  private storageFile: string
  private preferencesFile: string
  private maxMemoryAge = 7 * 24 * 60 * 60 * 1000
  private decayRate = 0.05

  constructor(dataDir?: string) {
    const baseDir = dataDir || join(homedir(), ".independent-architecture", "memory")
    this.storageFile = join(baseDir, "memory-store.json")
    this.preferencesFile = join(baseDir, "preferences.json")
  }

  async onInit(): Promise<void> {
    await this.loadStorage()
    this.scheduleDecay()
  }

  async onLoad(): Promise<void> {
    console.log("[memory-plugin] Memory system loaded")
  }

  async onUnload(): Promise<void> {
    await this.saveStorage()
  }

  async onProcess(input: string, context: PluginContext): Promise<PluginResult | null> {
    const lower = input.toLowerCase()

    if (lower.includes("memory") && (lower.includes("recall") || lower.includes("search") || lower.includes("find"))) {
      return this.handleRecall(input, context)
    }

    if (lower.includes("memory") && lower.includes("store")) {
      return this.handleStore(input, context)
    }

    if (lower.includes("memory") && (lower.includes("forget") || lower.includes("delete"))) {
      return this.handleForget(input)
    }

    if (lower.includes("memory") && lower.includes("stats")) {
      return this.handleStats()
    }

    if (
      lower.includes("preference") &&
      (lower.includes("set") || lower.includes("update") || lower.includes("learn"))
    ) {
      return this.handlePreference(input)
    }

    return null
  }

  async onHealthCheck(): Promise<HealthCheckResult> {
    const stats = this.getStats()
    const storageSize = JSON.stringify(Array.from(this.storage.values())).length

    return {
      status: stats.total > 0 ? "healthy" : "warning",
      message: `Memory: ${stats.total} entries, ${(storageSize / 1024).toFixed(1)}KB storage`,
      confidence: 0.95,
      metrics: {
        totalEntries: stats.total,
        storageBytes: storageSize,
        avgConfidence: stats.avgConfidence,
        avgImportance: stats.avgImportance,
      },
    }
  }

  private async handleRecall(input: string, context: PluginContext): Promise<PluginResult> {
    const query = this.extractQuery(input)
    const results = await this.recall(query, {
      limit: 10,
      type: this.detectType(input),
      category: context?.project?.type,
    })

    if (results.length === 0) {
      return {
        success: true,
        output: `沒有找到關於「${query}」的記憶`,
        confidence: 0.5,
        actions: [],
      }
    }

    const output = results
      .map((r) => `[${r.type}] ${r.content} (confidence: ${(r.confidence * 100).toFixed(0)}%)`)
      .join("\n")

    return {
      success: true,
      output,
      confidence: results[0].confidence,
      actions: results.slice(0, 3).map((r) => ({
        type: "recall" as const,
        target: r.id,
        params: { content: r.content },
      })),
    }
  }

  private async handleStore(input: string, context: PluginContext): Promise<PluginResult> {
    const content = this.extractMemoryContent(input)
    const type = this.detectType(input)
    const category = this.extractCategory(input, context)

    const entry = await this.store(content, type, category, {
      importance: 0.7,
      tags: this.extractTags(input),
      metadata: {
        project: context?.project?.name,
        userId: context?.user?.id,
      },
    })

    return {
      success: true,
      output: `記憶已儲存: ${entry.id} [${type}]`,
      confidence: entry.confidence,
      actions: [
        {
          type: "store",
          target: entry.id,
          params: { content: entry.content },
        },
      ],
    }
  }

  private async handleForget(input: string): Promise<PluginResult> {
    const id = this.extractId(input)
    if (!id) {
      return {
        success: false,
        output: "請提供要刪除的記憶 ID",
        confidence: 0.9,
      }
    }

    const success = await this.forget(id)
    return {
      success,
      output: success ? `已刪除記憶: ${id}` : `找不到記憶: ${id}`,
      confidence: success ? 0.95 : 0.8,
    }
  }

  private handleStats(): PluginResult {
    const stats = this.getStats()
    const lines = [
      `記憶統計:`,
      `- 總數: ${stats.total}`,
      `- 按類型: ${JSON.stringify(stats.byType)}`,
      `- 按分類: ${JSON.stringify(stats.byCategory)}`,
      `- 平均信心: ${(stats.avgConfidence * 100).toFixed(1)}%`,
      `- 平均重要性: ${(stats.avgImportance * 100).toFixed(1)}%`,
    ]

    return {
      success: true,
      output: lines.join("\n"),
      confidence: 0.95,
    }
  }

  private handlePreference(input: string): PluginResult {
    const match = input.match(
      /(?:prefer|preference|喜歡|偏好|設定|set|update)\s*(?:language|style|語言|風格)?\s*(?:為|是|:|=)?\s*(.+)/i,
    )
    if (!match) {
      return {
        success: false,
        output: "無法解析偏好設定",
        confidence: 0.5,
      }
    }

    const value = match[1].trim()
    const category = this.detectPreferenceCategory(input)

    this.store(`User preference: ${category} = ${value}`, "preference", "user-preference", {
      importance: 0.9,
      tags: [category],
    })

    return {
      success: true,
      output: `已設定偏好: ${category} = ${value}`,
      confidence: 0.9,
    }
  }

  async recall(
    query: string,
    options: { limit?: number; type?: string; category?: string } = {},
  ): Promise<MemoryEntry[]> {
    const { limit = 10, type, category } = options
    let results = Array.from(this.storage.values())

    if (type) {
      results = results.filter((r) => r.type === type)
    }
    if (category) {
      results = results.filter((r) => r.category === category)
    }

    results = results
      .map((entry) => ({
        entry,
        score: this.calculateRelevance(entry, query),
      }))
      .filter((r) => r.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.entry)

    results.forEach((r) => {
      r.lastAccessed = Date.now()
    })

    return results
  }

  async store(
    content: string,
    type: MemoryEntry["type"] = "fact",
    category: string = "general",
    options: { importance?: number; tags?: string[]; metadata?: Record<string, any> } = {},
  ): Promise<MemoryEntry> {
    const id = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const existing = Array.from(this.storage.values()).find((r) => r.content === content && r.type === type)

    if (existing) {
      existing.importance = Math.min(1, existing.importance + 0.1)
      existing.confidence = Math.min(0.95, existing.confidence + 0.05)
      existing.timestamp = Date.now()
      existing.lastAccessed = Date.now()
      return existing
    }

    const entry: MemoryEntry = {
      id,
      type,
      content,
      category,
      importance: options.importance ?? 0.7,
      confidence: 0.7,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      tags: options.tags ?? [],
      metadata: options.metadata,
      lifecycle: this.assignLifecycle(options.importance ?? 0.7),
      decayScore: 1,
    }

    this.storage.set(id, entry)
    await this.saveStorage()

    return entry
  }

  async forget(id: string): Promise<boolean> {
    const deleted = this.storage.delete(id)
    if (deleted) {
      await this.saveStorage()
    }
    return deleted
  }

  async update(id: string, updates: Partial<MemoryEntry>): Promise<MemoryEntry | null> {
    const entry = this.storage.get(id)
    if (!entry) return null

    Object.assign(entry, updates, { timestamp: Date.now() })
    await this.saveStorage()
    return entry
  }

  getStats(): MemoryStats {
    const entries = Array.from(this.storage.values())
    if (entries.length === 0) {
      return {
        total: 0,
        byType: {},
        byCategory: {},
        avgConfidence: 0,
        avgImportance: 0,
      }
    }

    const byType: Record<string, number> = {}
    const byCategory: Record<string, number> = {}
    let totalConfidence = 0
    let totalImportance = 0

    for (const entry of entries) {
      byType[entry.type] = (byType[entry.type] || 0) + 1
      byCategory[entry.category] = (byCategory[entry.category] || 0) + 1
      totalConfidence += entry.confidence
      totalImportance += entry.importance
    }

    return {
      total: entries.length,
      byType,
      byCategory,
      avgConfidence: totalConfidence / entries.length,
      avgImportance: totalImportance / entries.length,
    }
  }

  private calculateRelevance(entry: MemoryEntry, query: string): number {
    const queryLower = query.toLowerCase()
    const contentLower = entry.content.toLowerCase()

    let score = 0

    if (contentLower.includes(queryLower)) {
      score += 0.5
    }

    for (const tag of entry.tags) {
      if (queryLower.includes(tag.toLowerCase())) {
        score += 0.2
      }
    }

    score += entry.confidence * 0.3
    score += entry.importance * 0.2
    score *= entry.decayScore || 1

    return Math.min(1, score)
  }

  private assignLifecycle(importance: number): "core" | "working" | "peripheral" {
    if (importance >= 0.8) return "core"
    if (importance >= 0.5) return "working"
    return "peripheral"
  }

  private scheduleDecay() {
    setInterval(
      () => {
        const now = Date.now()
        for (const [id, entry] of this.storage) {
          const age = now - entry.lastAccessed
          if (age > this.maxMemoryAge) {
            this.storage.delete(id)
          } else {
            entry.decayScore = Math.max(0, 1 - (age / this.maxMemoryAge) * this.decayRate)
            if (entry.importance > 0.3) {
              entry.lifecycle = this.assignLifecycle(entry.importance * (entry.decayScore || 1))
            }
          }
        }
      },
      60 * 60 * 1000,
    )
  }

  private async loadStorage(): Promise<void> {
    try {
      const { readFile } = await import("fs/promises")
      const data = await readFile(this.storageFile, "utf-8")
      const entries: MemoryEntry[] = JSON.parse(data)
      for (const entry of entries) {
        this.storage.set(entry.id, entry)
      }
      console.log(`[memory-plugin] Loaded ${entries.length} memories`)
    } catch {
      console.log("[memory-plugin] No existing storage, starting fresh")
    }
  }

  private async saveStorage(): Promise<void> {
    try {
      const { mkdir, writeFile } = await import("fs/promises")
      await mkdir(join(this.storageFile, ".."), { recursive: true })
      const data = JSON.stringify(Array.from(this.storage.values()), null, 2)
      await writeFile(this.storageFile, data, "utf-8")
    } catch (error) {
      console.error("[memory-plugin] Failed to save storage:", error)
    }
  }

  private extractQuery(input: string): string {
    const patterns = [
      /recall\s+(?:about|for|搜尋|找)[:\s]*(.+)/i,
      /search\s+(?:for|找)[:\s]*(.+)/i,
      /find\s+(?:about|找)[:\s]*(.+)/i,
      /記憶[裡的]?\s*(.+)/,
    ]
    for (const p of patterns) {
      const match = input.match(p)
      if (match) return match[1].trim()
    }
    return input.replace(/memory|recall|search|find/gi, "").trim()
  }

  private extractMemoryContent(input: string): string {
    const patterns = [/store[:\s]+(.+)/i, /記住[:\s]*(.+)/, /記得[:\s]*(.+)/, /remember[:\s]*(.+)/i]
    for (const p of patterns) {
      const match = input.match(p)
      if (match) return match[1].trim()
    }
    return input
  }

  private extractId(input: string): string | null {
    const match = input.match(/mem-[a-z0-9-]+/)
    return match ? match[0] : null
  }

  private detectType(input: string): MemoryEntry["type"] {
    const lower = input.toLowerCase()
    if (lower.includes("preference") || lower.includes("偏好") || lower.includes("喜歡")) return "preference"
    if (lower.includes("fact") || lower.includes("事實")) return "fact"
    if (lower.includes("decision") || lower.includes("決定")) return "decision"
    if (lower.includes("pattern") || lower.includes("模式")) return "pattern"
    if (lower.includes("entity") || lower.includes("實體")) return "entity"
    if (lower.includes("event") || lower.includes("事件")) return "event"
    return "fact"
  }

  private extractCategory(input: string, context?: PluginContext): string {
    if (context?.project?.type) return context.project.type
    return "general"
  }

  private extractTags(input: string): string[] {
    const matches = input.match(/#[a-zA-Z0-9_]+/g)
    return matches ? matches.map((t) => t.slice(1)) : []
  }

  private detectPreferenceCategory(input: string): string {
    const lower = input.toLowerCase()
    if (lower.includes("language") || lower.includes("語言")) return "language"
    if (lower.includes("style") || lower.includes("風格")) return "style"
    if (lower.includes("detail") || lower.includes("詳細")) return "detailLevel"
    return "general"
  }
}

export const createMemoryPlugin = (dataDir?: string): PluginInstance => {
  const plugin = new MemoryPlugin(dataDir)

  return {
    metadata: {
      name: "memory-plugin",
      version: "1.0.0",
      description: "記憶系統插件 - 整合長期記憶、偏好學習、Hybrid檢索",
      category: "memory",
      triggers: ["memory", "memory_recall", "memory_store", "memory_forget", "preference", "偏好", "記住", "recall"],
      autoLoad: true,
    },
    hooks: plugin,
    status: "unloaded",
    config: {
      enabled: true,
      priority: 80,
      settings: {
        maxMemoryAge: 7 * 24 * 60 * 60 * 1000,
        decayRate: 0.05,
        autoSave: true,
      },
    },
  }
}

export default MemoryPlugin
