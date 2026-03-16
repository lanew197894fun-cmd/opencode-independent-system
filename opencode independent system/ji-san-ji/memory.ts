import { Log } from "./util/log"

const log = Log.create({ service: "ji-san-ji-memory" })

export class AIMemory {
  private preferences: UserPreference[] = []
  private facts: FactMemory[] = []
  private instructions: InstructionMemory[] = []
  private context: ContextMemory[] = []

  constructor() {
    this.initialize()
  }

  private initialize() {
    this.seedDefaultPreferences()
  }

  private seedDefaultPreferences() {
    const defaults: UserPreference[] = [
      {
        id: "pref-1",
        category: "code-style",
        key: "variableNaming",
        value: "camelCase",
        confidence: 0.9,
        timestamp: Date.now(),
      },
      {
        id: "pref-2",
        category: "code-style",
        key: "indentSize",
        value: "2",
        confidence: 0.9,
        timestamp: Date.now(),
      },
      {
        id: "pref-3",
        category: "code-style",
        key: "semicolons",
        value: false,
        confidence: 0.85,
        timestamp: Date.now(),
      },
      {
        id: "pref-4",
        category: "response",
        key: "language",
        value: "Traditional Chinese",
        confidence: 0.95,
        timestamp: Date.now(),
      },
    ]

    this.preferences = defaults
    log.info("Default preferences seeded", { count: defaults.length })
  }

  async learnPreference(category: string, key: string, value: unknown) {
    const existing = this.preferences.find((p) => p.category === category && p.key === key)
    if (existing) {
      existing.value = value
      existing.confidence = Math.min(0.95, existing.confidence + 0.05)
      existing.timestamp = Date.now()
    } else {
      this.preferences.push({
        id: `pref-${Date.now()}`,
        category,
        key,
        value,
        confidence: 0.7,
        timestamp: Date.now(),
      })
    }
    log.info("Preference learned", { category, key, value })
  }

  async rememberFact(fact: Omit<FactMemory, "id" | "timestamp">) {
    const existing = this.facts.find((f) => f.content === fact.content && f.category === fact.category)
    if (existing) {
      existing.importance = Math.min(1, existing.importance + 0.1)
      existing.lastAccessed = Date.now()
    } else {
      this.facts.push({
        ...fact,
        id: `fact-${Date.now()}`,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
      })
    }
    log.info("Fact remembered", { category: fact.category })
  }

  async rememberInstruction(instruction: Omit<InstructionMemory, "id" | "timestamp">) {
    const existing = this.instructions.find((i) => i.command === instruction.command)
    if (existing) {
      existing.usageCount++
      existing.lastUsed = Date.now()
    } else {
      this.instructions.push({
        ...instruction,
        id: `inst-${Date.now()}`,
        timestamp: Date.now(),
        usageCount: 1,
        lastUsed: Date.now(),
      })
    }
    log.info("Instruction remembered", { command: instruction.command })
  }

  async updateContext(projectId: string, context: Record<string, unknown>) {
    const existing = this.context.find((c) => c.projectId === projectId)
    if (existing) {
      existing.data = { ...existing.data, ...context }
      existing.timestamp = Date.now()
    } else {
      this.context.push({
        id: `ctx-${Date.now()}`,
        projectId,
        data: context,
        timestamp: Date.now(),
      })
    }
  }

  async getPreference(category?: string): Promise<UserPreference[]> {
    if (category) {
      return this.preferences.filter((p) => p.category === category)
    }
    return this.preferences
  }

  async getFacts(category?: string): Promise<FactMemory[]> {
    if (category) {
      return this.facts.filter((f) => f.category === category)
    }
    return this.facts.sort((a, b) => b.importance - a.importance)
  }

  async getInstructions(): Promise<InstructionMemory[]> {
    return this.instructions.sort((a, b) => b.usageCount - a.usageCount)
  }

  async getContext(projectId: string): Promise<Record<string, unknown> | null> {
    const ctx = this.context.find((c) => c.projectId === projectId)
    return ctx?.data || null
  }

  async getLearningProgress(): Promise<number> {
    const total = this.preferences.length + this.facts.length + this.instructions.length
    const weighted =
      this.preferences.reduce((sum, p) => sum + p.confidence, 0) +
      this.facts.reduce((sum, f) => sum + f.importance, 0) +
      Math.min(
        1,
        this.instructions.reduce((sum, i) => sum + i.usageCount * 0.1, 0),
      )

    return Math.min(1, weighted / (total || 1))
  }

  async clearMemory() {
    this.preferences = []
    this.facts = []
    this.instructions = []
    this.context = []
    log.info("Memory cleared")
  }
}

export interface UserPreference {
  id: string
  category: string
  key: string
  value: unknown
  confidence: number
  timestamp: number
}

export interface FactMemory {
  id: string
  content: string
  category: "project" | "technical" | "preference" | "personal"
  importance: number
  timestamp: number
  lastAccessed: number
}

export interface InstructionMemory {
  id: string
  command: string
  description: string
  forbidden: boolean
  timestamp: number
  usageCount: number
  lastUsed: number
}

export interface ContextMemory {
  id: string
  projectId: string
  data: Record<string, unknown>
  timestamp: number
}
