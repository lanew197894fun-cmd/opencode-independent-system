import { Log } from "./util/log"

const log = Log.create({ service: "ji-san-ji-search" })

export class SearchEngine {
  private codeIndex: Map<string, CodeSnippet[]> = new Map()
  private webCache: Map<string, WebResult[]> = new Map()
  private offlineAvailable = false

  constructor() {
    this.initialize()
  }

  private initialize() {
    this.seedCodeSearchIndex()
  }

  private seedCodeSearchIndex() {
    const snippets: CodeSnippet[] = [
      {
        id: "snippet-1",
        title: "Create Signal in SolidJS",
        code: "const [count, setCount] = createSignal(0)",
        language: "typescript",
        framework: "solidjs",
        tags: ["signal", "state", "reactivity"],
      },
      {
        id: "snippet-2",
        title: "TypeScript Interface",
        code: "interface User { id: string; name: string; email: string }",
        language: "typescript",
        framework: "general",
        tags: ["interface", "types"],
      },
      {
        id: "snippet-3",
        title: "Bun File Read",
        code: "const file = Bun.file(path); const content = await file.text();",
        language: "typescript",
        framework: "bun",
        tags: ["file", "io", "bun"],
      },
      {
        id: "snippet-4",
        title: "Zod Schema",
        code: "const UserSchema = z.object({ name: z.string(), age: z.number() })",
        language: "typescript",
        framework: "zod",
        tags: ["validation", "schema", "zod"],
      },
      {
        id: "snippet-5",
        title: "Error Result Pattern",
        code: "type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E }",
        language: "typescript",
        framework: "general",
        tags: ["error", "result", "pattern"],
      },
    ]

    snippets.forEach((snippet) => {
      snippet.tags.forEach((tag) => {
        if (!this.codeIndex.has(tag)) {
          this.codeIndex.set(tag, [])
        }
        this.codeIndex.get(tag)!.push(snippet)
      })
    })

    log.info("Code search index seeded", { count: snippets.length })
  }

  async searchCode(query: string, limit: number = 5): Promise<CodeSnippetResult[]> {
    const queryTags = query.toLowerCase().split(" ")
    const scored = new Map<string, number>()

    queryTags.forEach((tag) => {
      const matches = this.codeIndex.get(tag) || []
      matches.forEach((snippet) => {
        const current = scored.get(snippet.id) || 0
        scored.set(snippet.id, current + 1)
      })
    })

    const results = Array.from(scored.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => {
        for (const snippets of this.codeIndex.values()) {
          const found = snippets.find((s) => s.id === id)
          if (found) return found
        }
        return null
      })
      .filter(Boolean) as CodeSnippet[]

    return results.map((snippet) => ({
      id: snippet.id,
      type: "code" as const,
      title: snippet.title,
      snippet: snippet.code,
      language: snippet.language,
      relevance: 0.9,
      confidence: 0.85,
      source: "local" as const,
    }))
  }

  async searchWeb(query: string, limit: number = 5): Promise<WebResult[]> {
    if (this.offlineAvailable) {
      const cached = this.webCache.get(query)
      if (cached) return cached.slice(0, limit)
    }

    const mockResults: WebResult[] = [
      {
        id: `web-${Date.now()}-1`,
        type: "web",
        title: `Result for: ${query}`,
        snippet: `This is a cached result for "${query}". Network search available when online.`,
        url: "",
        relevance: 0.7,
        confidence: 0.6,
        source: "cached",
      },
    ]

    this.webCache.set(query, mockResults)
    return mockResults.slice(0, limit)
  }

  async searchDocumentation(query: string, limit: number = 5): Promise<SearchResult[]> {
    const docResults: SearchResult[] = [
      {
        id: "doc-tsconfig",
        type: "documentation",
        title: "TypeScript tsconfig.json Reference",
        snippet: "Compiler options for TypeScript projects",
        relevance: 0.8,
        confidence: 0.9,
        source: "local",
      },
      {
        id: "doc-solidjs",
        type: "documentation",
        title: "SolidJS Documentation",
        snippet: "Reactive JavaScript library for building user interfaces",
        relevance: 0.8,
        confidence: 0.9,
        source: "local",
      },
    ]

    return docResults.slice(0, limit)
  }

  async searchAll(query: string): Promise<SearchResult[]> {
    const [code, docs] = await Promise.all([this.searchCode(query, 3), this.searchDocumentation(query, 3)])

    return [...code, ...docs]
  }

  setOfflineMode(offline: boolean) {
    this.offlineAvailable = !offline
    log.info("Search engine offline mode changed", { offline: this.offlineAvailable })
  }

  async healthCheck(): Promise<HealthCheckDetail> {
    const codeCount = Array.from(this.codeIndex.values()).reduce((sum, arr) => sum + arr.length, 0)
    const cacheCount = this.webCache.size

    return {
      type: "search",
      status: codeCount > 0 ? "healthy" : "warning",
      message: `Indexed ${codeCount} code snippets, ${cacheCount} cached results`,
      confidence: 0.85,
      metrics: {
        codeSnippets: codeCount,
        cachedResults: cacheCount,
      },
    }
  }
}

export interface CodeSnippet {
  id: string
  title: string
  code: string
  language: string
  framework: string
  tags: string[]
}

export interface CodeSnippetResult {
  id: string
  type: "code"
  title: string
  snippet: string
  language: string
  relevance: number
  confidence: number
  source: "local"
}

export interface WebResult {
  id: string
  type: "web"
  title: string
  snippet: string
  url: string
  relevance: number
  confidence: number
  source: "cached" | "indexed" | "web"
}

export interface SearchResult {
  id: string
  type: "code" | "documentation" | "web" | "local"
  title: string
  snippet: string
  url?: string
  relevance: number
  confidence: number
  source: "local" | "indexed" | "cached" | "web"
}

export interface HealthCheckDetail {
  type: "model" | "search" | "knowledge" | "problem-solver" | "system" | "network" | "storage"
  status: "healthy" | "warning" | "critical"
  message: string
  confidence: number
  metrics?: Record<string, number>
}
