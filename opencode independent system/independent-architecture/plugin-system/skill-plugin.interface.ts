// 插件系統核心介面

export interface PluginMetadata {
  name: string
  version: string
  description: string
  author?: string
  dependencies?: string[]
  triggers?: string[]
  category?: "memory" | "security" | "search" | "model" | "knowledge" | "monitor" | "utility"
  color?: string
  autoLoad?: boolean
}

export interface PluginHooks {
  onInit?: () => Promise<void>
  onLoad?: () => Promise<void>
  onUnload?: () => Promise<void>
  onProcess?: (input: string, context: PluginContext) => Promise<PluginResult | null>
  onHealthCheck?: () => Promise<HealthCheckResult>
}

export interface PluginContext {
  project?: {
    name: string
    type: string
    stack: string[]
  }
  user?: {
    preferences: Record<string, any>
    id: string
  }
  environment?: {
    os: string
    memory: number
    networkStatus: "online" | "offline"
  }
  options?: Record<string, any>
}

export interface PluginResult {
  success: boolean
  output?: string
  confidence?: number
  metadata?: Record<string, any>
  actions?: PluginAction[]
  priority?: number
}

export interface PluginAction {
  type: "store" | "recall" | "check" | "analyze" | "execute"
  target?: string
  params?: Record<string, any>
}

export interface HealthCheckResult {
  status: "healthy" | "warning" | "critical"
  message: string
  confidence: number
  metrics?: Record<string, number>
}

export interface SkillDefinition {
  triggers: string[]
  description: string
  tools: string[]
  commands?: string[]
  examples?: string[]
  references?: string[]
}

export interface PluginConfig {
  enabled: boolean
  priority: number
  settings: Record<string, any>
}

export type PluginStatus = "loaded" | "unloaded" | "error" | "initializing"

export interface PluginInstance {
  metadata: PluginMetadata
  hooks: PluginHooks
  status: PluginStatus
  config: PluginConfig
  loadedAt?: number
  lastHealthCheck?: number
}

export interface PluginEvent {
  type: "plugin:loaded" | "plugin:unloaded" | "plugin:error" | "plugin:health-check"
  plugin: string
  timestamp: number
  data?: any
}
