import { Log } from "./util/log"

const log = Log.create({ service: "ji-san-ji-knowledge" })

export class KnowledgeBase {
  private items: Map<string, KnowledgeItem> = new Map()
  private index: Map<string, Set<string>> = new Map()
  private initialized = false

  constructor() {
    this.initialize()
  }

  private initialize() {
    if (this.initialized) return
    this.seedDefaultKnowledge()
    this.initialized = true
  }

  private indexItem(id: string, item: KnowledgeItem) {
    const keywords = [...item.title.toLowerCase().split(" "), ...item.content.toLowerCase().split(" "), ...item.tags]
    keywords.forEach((keyword) => {
      if (!this.index.has(keyword)) {
        this.index.set(keyword, new Set())
      }
      this.index.get(keyword)!.add(id)
    })
  }

  private seedDefaultKnowledge() {
    const defaultKnowledge: KnowledgeItem[] = [
      {
        id: "kb-ts-config",
        type: "technical",
        title: "TypeScript Configuration",
        content: "tsconfig.json options: strict, target ES2020, module ESNext, moduleResolution bundler",
        tags: ["typescript", "config", "tsconfig"],
        confidence: 0.95,
        timestamp: Date.now(),
      },
      {
        id: "kb-bun-commands",
        type: "technical",
        title: "Bun Package Manager Commands",
        content: "bun install, bun run, bun test, bun add, bun remove",
        tags: ["bun", "package-manager", "commands"],
        confidence: 0.95,
        timestamp: Date.now(),
      },
      {
        id: "kb-solidjs",
        type: "technical",
        title: "SolidJS Best Practices",
        content: "Use createSignal, createEffect, createMemo. Avoid reactivity pitfalls.",
        tags: ["solidjs", "frontend", "framework"],
        confidence: 0.9,
        timestamp: Date.now(),
      },
      {
        id: "kb-ts-error-7006",
        type: "troubleshooting",
        title: "TS7006 Parameter Implicitly Has Any Type",
        content: "Add type annotation to function parameter or use explicit types.",
        tags: ["typescript", "error", "types"],
        confidence: 0.9,
        timestamp: Date.now(),
      },
      {
        id: "kb-ts-error-2307",
        type: "troubleshooting",
        title: "TS2307 Cannot Find Module",
        content: "Run bun install to install dependencies or check import path.",
        tags: ["typescript", "error", "module"],
        confidence: 0.9,
        timestamp: Date.now(),
      },
      {
        id: "kb-best-practice-error-handling",
        type: "best-practice",
        title: "Error Handling Best Practices",
        content: "Use Result pattern, avoid try-catch where possible, return error objects instead of throwing.",
        tags: ["error-handling", "best-practice", "pattern"],
        confidence: 0.9,
        timestamp: Date.now(),
      },
      {
        id: "kb-code-style-solidjs",
        type: "best-practice",
        title: "SolidJS Code Style",
        content: "Keep things in one function unless composable. Avoid unnecessary destructuring.",
        tags: ["solidjs", "code-style", "best-practice"],
        confidence: 0.85,
        timestamp: Date.now(),
      },
    ]

    defaultKnowledge.forEach((item) => {
      this.items.set(item.id, item)
      this.indexItem(item.id, item)
    })

    log.info("Default knowledge seeded", { count: defaultKnowledge.length })
  }

  async search(query: string, limit: number = 10): Promise<KnowledgeItem[]> {
    const queryTerms = query.toLowerCase().split(" ")
    const scoredItems = new Map<string, number>()

    queryTerms.forEach((term) => {
      const matched = this.index.get(term) || new Set()
      matched.forEach((id) => {
        const current = scoredItems.get(id) || 0
        scoredItems.set(id, current + 1)
      })
    })

    const results = Array.from(scoredItems.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => this.items.get(id))
      .filter(Boolean) as KnowledgeItem[]

    return results
  }

  async add(item: Omit<KnowledgeItem, "id" | "timestamp">): Promise<KnowledgeItem> {
    const id = `kb-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const newItem: KnowledgeItem = {
      ...item,
      id,
      timestamp: Date.now(),
    }

    this.items.set(id, newItem)
    this.indexItem(id, newItem)

    log.info("Knowledge item added", { id, type: item.type })
    return newItem
  }

  async remove(id: string): Promise<boolean> {
    const item = this.items.get(id)
    if (!item) return false

    this.items.delete(id)

    const keywords = [...item.title.toLowerCase().split(" "), ...item.content.toLowerCase().split(" "), ...item.tags]
    keywords.forEach((keyword) => {
      const set = this.index.get(keyword)
      if (set) {
        set.delete(id)
        if (set.size === 0) {
          this.index.delete(keyword)
        }
      }
    })

    return true
  }

  async getByType(type: KnowledgeItem["type"]): Promise<KnowledgeItem[]> {
    return Array.from(this.items.values()).filter((item) => item.type === type)
  }

  async getAll(): Promise<KnowledgeItem[]> {
    return Array.from(this.items.values())
  }

  async healthCheck(): Promise<HealthCheckDetail> {
    const items = Array.from(this.items.values())
    const typeCounts = {
      technical: items.filter((i) => i.type === "technical").length,
      troubleshooting: items.filter((i) => i.type === "troubleshooting").length,
      "best-practice": items.filter((i) => i.type === "best-practice").length,
      project: items.filter((i) => i.type === "project").length,
      domain: items.filter((i) => i.type === "domain").length,
    }

    return {
      type: "knowledge",
      status: items.length > 0 ? "healthy" : "warning",
      message: `${items.length} knowledge items loaded`,
      confidence: items.length > 0 ? 0.9 : 0.5,
      metrics: typeCounts,
    }
  }
}

export interface KnowledgeItem {
  id: string
  type: "technical" | "project" | "troubleshooting" | "best-practice" | "domain"
  title: string
  content: string
  tags: string[]
  confidence: number
  timestamp: number
}

export interface HealthCheckDetail {
  type: "model" | "search" | "knowledge" | "problem-solver" | "system" | "network" | "storage"
  status: "healthy" | "warning" | "critical"
  message: string
  confidence: number
  metrics?: Record<string, number>
}
