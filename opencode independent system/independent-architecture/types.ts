// 獨立架構 - 完全獨立系統設計

import z from "zod"
import { Log } from "./util/log"

const log = Log.create({ service: "independent-architecture" })

// 模型層定義
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

// 知識庫項目
export interface KnowledgeItem {
  id: string
  type: "technical" | "project" | "troubleshooting" | "best-practice" | "domain"
  title: string
  content: string
  tags: string[]
  confidence: number
  timestamp: number
}

// 搜尋結果
export interface SearchResult {
  id: string
  type: "code" | "documentation" | "web" | "local"
  title: string
  snippet: string
  url?: string
  relevance: number
  confidence: number
  source: "local" | "indexed" | "cached"
}

// 問題解決結果
export interface ProblemSolution {
  success: boolean
  steps: string[]
  confidence: number
  timeTaken: number
  knowledgeUsed: string[]
  toolsUsed: string[]
  nextSteps?: string[]
}

// 處理結果
export interface ProcessResult {
  success: boolean
  output: string
  confidence: number
  steps: string[]
  knowledgeUsed: string[]
  toolsUsed: string[]
  timeTaken: number
  modelUsed: string
  metadata?: Record<string, any>
}

// 個人化模型設定
export interface PersonalModel {
  codeStyle: {
    variableNaming: "camelCase" | "snake_case" | "PascalCase" | "UPPER_SNAKE"
    constantNaming: "camelCase" | "snake_case" | "PascalCase" | "UPPER_SNAKE"
    componentNaming: "camelCase" | "snake_case" | "PascalCase"
    indentStyle: "spaces" | "tabs"
    indentSize: 2 | 4
    semicolons: boolean
    quotes: "single" | "double" | "template"
    importStyle: "named" | "default" | "namespace"
    errorHandling: "try-catch" | "early-return" | "result-pattern"
    commentStyle: "jsdoc" | "line" | "block"
  }
  responseFormat: {
    language: string
    detailLevel: "low" | "medium" | "high"
    autoExecute: boolean
    preferredStrategy: "auto" | "step-by-step" | "rollback" | "parallel"
  }
  confidence: number
  learningProgress: number
  preferences: Record<string, any>
}

// 處理選項
export interface ProcessOptions {
  offline?: boolean
  debug?: boolean
  timeout?: number
  priority?: "high" | "normal" | "low"
  context?: ProcessContext
}

// 處理上下文
export interface ProcessContext {
  project?: ProjectInfo
  user?: UserInfo
  environment?: EnvironmentInfo
  preferences?: UserPreferences
}

// 專案資訊
export interface ProjectInfo {
  name: string
  type: "IDE" | "website" | "backend" | "fullstack" | "mobile" | "desktop" | "library"
  stack: string[]
  dependencies: Record<string, string>
  version: string
  lastBuild: string
  buildStatus: "success" | "failed" | "pending"
  buildTime: number
}

// 用戶資訊
export interface UserInfo {
  id: string
  name: string
  preferences: UserPreferences
  history: Interaction[]
}

// 用戶偏好
export interface UserPreferences {
  language: string
  detailLevel: "low" | "medium" | "high"
  autoExecute: boolean
  preferredStrategy: "auto" | "step-by-step" | "rollback" | "parallel"
  codeStyle: Partial<PersonalModel["codeStyle"]>
  toolPreferences: Record<string, any>
}

// 環境資訊
export interface EnvironmentInfo {
  os: string
  arch: string
  memory: number
  cpu: number
  diskSpace: number
  networkStatus: "online" | "offline"
  availableModels: string[]
}

// 互動記錄
export interface Interaction {
  id: string
  timestamp: number
  input: string
  output: string
  feedback: {
    success: boolean
    edited: boolean
    rejected: boolean
  }
  context: ProcessContext
  confidence: number
  timeTaken: number
}

// 健康檢查結果
export interface HealthCheckResult {
  healthy: boolean
  details: HealthCheckDetail[]
  overallScore: number
  recommendations: string[]
}

// 健康檢查細節
export interface HealthCheckDetail {
  type: "model" | "search" | "knowledge" | "problem-solver" | "system" | "network" | "storage"
  status: "healthy" | "warning" | "critical"
  message: string
  confidence: number
  metrics?: Record<string, number>
}

// 安全性檢查結果
export interface SecurityCheckResult {
  safe: boolean
  confidence: number
  message?: string
  sanitized?: string
  sensitiveData?: string[]
  dangerousCommands?: string[]
  networkRestrictions?: string[]
}
