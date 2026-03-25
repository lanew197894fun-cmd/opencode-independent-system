import { Log } from "./util/log"

const log = Log.create({ service: "independent-architecture-knowledge" })

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
        id: "kb-security-scan-results",
        type: "technical",
        title: "本地技能掃描結果",
        content:
          "掃描結果:full-reference.md有字串拼接誤判(技術文檔)。建議:白名單、技術文檔跳過掃描、嚴格模式僅用於高風險場景。",
        tags: ["安全", "掃描", "audit", "security"],
        confidence: 0.8,
        timestamp: Date.now(),
      },
      {
        id: "kb-lobster-workflow",
        type: "domain",
        title: "Lobster 工作流引擎",
        content:
          "OpenClaw原生工作流shell:typed JSON pipelines、jobs、approval gates。命令:exec/run、where/pick/json、llm.invoke、approve。危險:執行Shell命令、LLM調用、檔案操作。需隔離權限。",
        tags: ["lobster", "workflow", "工作流", "shell", "openclaw"],
        confidence: 0.9,
        timestamp: Date.now(),
      },
      {
        id: "kb-lobster-security",
        type: "technical",
        title: "Lobster 安全整合方案",
        content:
          "安全要點:(1)Shell隔離-使用權限最小化shell (2)LLM調用-審批閘道確認 (3)環境變數-避免注入使用LOBSTER_ARG_* (4)輸出審計-記錄所有執行 (5)審批恢復-token管理。",
        tags: ["lobster", "安全", "shell", "審批"],
        confidence: 0.85,
        timestamp: Date.now(),
      },
      {
        id: "kb-fix-startjs-shebang",
        type: "troubleshooting",
        title: "start.js 執行失敗 - ERR_MODULE_NOT_FOUND",
        content:
          "問題:執行 start.js 出現 'Cannot find module independent-architecture-system'。原因:shebang 為 #!/usr/bin/env node，但引入的是 .ts 檔案。修復:將 shebang 改為 #!/usr/bin/env bun，或使用 bun run start.js。",
        tags: ["修復", "shebang", "bun", "node", "module"],
        confidence: 0.95,
        timestamp: Date.now(),
      },
      {
        id: "kb-fix-bun-dev-effect",
        type: "troubleshooting",
        title: "bun dev 失敗 - effect/unstable/http not found",
        content:
          "問題:執行 bun dev 出現 'Cannot find module effect/unstable/http'。原因:package.json 指定 effect@4.0.0-beta.35，但 bun 1.3.11 不相容導致 unstable 模組未正確安裝。解決:(1)使用 baseline 預編譯版本 /home/reamaster/opencode-linux-x64-baseline/opencode (2)或將 opencode-linux-x64-baseline 加入 PATH。",
        tags: ["修復", "bun", "effect", "版本", "相容性"],
        confidence: 0.9,
        timestamp: Date.now(),
      },
      {
        id: "kb-compile-independent-architecture",
        type: "technical",
        title: "編譯獨立架構為可執行檔",
        content:
          "方法:cd independent-architecture && bun build cli-v2/index.ts --compile --outfile ia-binary。產出:約95MB ELF 64-bit executable。可用選項:--web 網頁版、--cli 互動模式、--gateway 閘道模式。",
        tags: ["編譯", "binary", "bun", "可執行檔"],
        confidence: 0.95,
        timestamp: Date.now(),
      },
      {
        id: "kb-fix-opentui-jsxdev",
        type: "troubleshooting",
        title: "bun dev 失敗 - jsxDEV not found in @opentui/solid",
        content:
          "問題:執行 bun dev 出現 'Export named jsxDEV not found in module @opentui/solid/jsx-runtime.d.ts'。原因:@opentui/solid@0.1.90 與 bun 1.3.11 不相容。解決:(1)Web模式使用baseline: /home/reamaster/opencode-manager/opencode-linux-x64-baseline/opencode web (2)CLI模式使用獨立架構: cd independent-architecture && bun run cli 或 ./ia-binary。",
        tags: ["修復", "opentui", "jsx", "bun", "相容性"],
        confidence: 0.9,
        timestamp: Date.now(),
      },
      {
        id: "kb-independent-architecture-usage",
        type: "best-practice",
        title: "獨立架構使用方法",
        content:
          "獨立架構不依賴 @opentui/solid，可正常運行。使用方式:(1)CLI互動: cd independent-architecture && bun run cli 或 ./ia-binary (2)網頁版: 使用 baseline 版本 /home/reamaster/opencode-linux-x64-baseline/opencode web (3)開發模式: bun dev 有 @opentui/solid 相容性問題，需使用上述替代方案。預設模型:qwen2.5:3b (本地Ollama)。",
        tags: ["獨立架構", "用法", "cli", "web"],
        confidence: 0.95,
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
