export { KnowledgeBase } from "./knowledge"
export type { KnowledgeItem, HealthCheckDetail as KnowledgeHealthDetail } from "./knowledge"

export { SearchEngine } from "./search"
export type { SearchResult, CodeSnippet, WebResult } from "./search"

export { ProblemSolver } from "./problem-solver"
export type { Solution, ProblemAnalysis, ErrorPattern } from "./problem-solver"

export { AIMemory } from "./memory"
export type { UserPreference, FactMemory, InstructionMemory, ContextMemory } from "./memory"

export { SelfMonitor } from "./monitor"
export type { SystemHealth, PerformanceMetrics, HealthCheckResult } from "./monitor"

export { SecurityShield } from "./security"
export type { SecurityCheckResult } from "./security"

export { ModelManager } from "./model"
export type { ModelPerformance } from "./model"

export { EnvManager, getEnvManager, initEnvManager } from "./env-manager"
export type { PortableEnvPaths, EnvManagerConfig, OpenClawConfig } from "./env-manager"

export interface LocalModel {
  id: string
  name: string
  provider: string
  size: string
  capabilities: {
    text: boolean
    code: boolean
    reasoning: boolean
    toolcall: boolean
  }
  status: "active" | "inactive" | "error"
  latency: number
  confidence: number
}
