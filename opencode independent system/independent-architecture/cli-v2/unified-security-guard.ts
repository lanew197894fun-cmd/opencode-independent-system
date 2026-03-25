// 統一安全守衛 - 插件與技能的安全防線

import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { homedir } from "os"
import { Log } from "../util/log"

export const log = Log.create({ service: "security-guard" })

// ============================================
// 安全等級
// ============================================

export type SecurityLevel = "safe" | "warning" | "dangerous" | "blocked"

export interface SecurityCheckResult {
  passed: boolean
  level: SecurityLevel
  entity: "plugin" | "skill"
  name: string
  issues: string[]
  warnings: string[]
  checkedAt: number
}

// ============================================
// 信任名單
// ============================================

const TRUSTED_PLUGINS = ["builtin-logger", "builtin-memory", "builtin-error", "ia-plugin-manager"]

const TRUSTED_SKILLS = ["ai-memory", "memory-pro", "important-notice", "user-rules"]

// ============================================
// 危險模式
// ============================================

const DANGEROUS_PATTERNS = [
  { pattern: /eval\s*\(/, reason: "動態程式碼執行 (eval)", severity: "critical" },
  { pattern: /exec\s*\(/, reason: "系統命令執行 (exec)", severity: "critical" },
  { pattern: /spawn\s*\(/, reason: "子程序生成 (spawn)", severity: "high" },
  { pattern: /fork\s*\(/, reason: "程序分支 (fork)", severity: "high" },
  { pattern: /child_process/, reason: "子程序模組引用", severity: "high" },
  { pattern: /process\.exit/, reason: "強制程序終止", severity: "critical" },
  { pattern: /rm\s*[-rRf]\s/, reason: "危險檔案刪除命令", severity: "critical" },
  { pattern: /curl\s.*\|.*sh/, reason: "管道下載執行", severity: "critical" },
  { pattern: /wget\s.*\|.*sh/, reason: "管道下載執行", severity: "critical" },
  { pattern: /chmod\s+777/, reason: "危險權限設定", severity: "high" },
  { pattern: /sudo\s+su/, reason: "提權至 root", severity: "critical" },
  { pattern: /\.ssh\//, reason: "SSH 目錄訪問", severity: "medium" },
  { pattern: /\.netrc/, reason: "認證檔案訪問", severity: "medium" },
  { pattern: /api[_-]?key.*=.*["']/, reason: "可能的 API Key 外洩", severity: "medium" },
  { pattern: /password.*=.*["']/, reason: "可能的密碼外洩", severity: "medium" },
]

const DANGEROUS_HOOKS = [
  { hook: "cli.shutdown", reason: "攔截系統關閉" },
  { hook: "session.save", reason: "訪問敏感會話資料" },
]

const DANGEROUS_SKILL_PATTERNS = [
  { pattern: /git\s+push\s+--force/, reason: "強制推送", severity: "high" },
  { pattern: /DROP\s+TABLE/i, reason: "資料庫刪除", severity: "critical" },
  { pattern: /DELETE\s+FROM/i, reason: "資料庫刪除", severity: "high" },
  { pattern: /TRUNCATE/i, reason: "資料庫清空", severity: "critical" },
]

// ============================================
// 高級繞過檢測模式 (防禦升級)
// ============================================

const BYPASS_DETECTION_PATTERNS = [
  { pattern: /(?:eval|exec|Function)\s*\(/, reason: "動態程式碼執行", severity: "critical" },
  { pattern: /\[.*\s*\+\s.*\]/, reason: "字串拼接隱藏", severity: "high" },
  { pattern: /["'`].*\.concat\(/, reason: "字串拼接隱藏", severity: "high" },
  { pattern: /Reflect\.(get|apply|construct)/, reason: "Reflect API 動態呼叫", severity: "high" },
  { pattern: /new\s+Function\s*\(/, reason: "Function 建構執行", severity: "critical" },
  { pattern: /Symbol\.(for|iterator)/, reason: "Symbol 隱藏呼叫", severity: "medium" },
  { pattern: /require\s*\(\s*\[.*\]/, reason: "動態 require", severity: "high" },
  { pattern: /import\s*\(\s*\)/, reason: "動態 import()", severity: "high" },
  { pattern: /process\./, reason: "Process 訪問", severity: "high" },
  { pattern: /__proto__|prototype/, reason: "原型鏈操作", severity: "medium" },
  { pattern: /decodeURIComponent|atob|Buffer/, reason: "解碼隱藏內容", severity: "medium" },
  { pattern: /setTimeout.*eval|setInterval.*eval/, reason: "延遲執行 eval", severity: "critical" },
  { pattern: /with\s*\(/, reason: "with 語句擴展作用域", severity: "medium" },
  { pattern: /Proxy|WeakMap|WeakSet/, reason: "Proxy/WeakRef 隱藏", severity: "medium" },
  { pattern: /vm\.|context|sandbox/, reason: "VM 沙盒操作", severity: "high" },
]

// ============================================
// 沙盒隔離所需的安全全域
// ============================================

const SAFE_GLOBALS: Record<string, unknown> = {
  console: console,
  setTimeout,
  setInterval,
  clearTimeout,
  clearInterval,
  Math,
  Date,
  JSON,
  Array,
  Object,
  String,
  Number,
  Boolean,
  RegExp,
  Map,
  Set,
  Promise,
  Error,
  TypeError,
  RangeError,
  SyntaxError,
}

// ============================================
// 危險全域 (需隔離)
// ============================================

const DANGEROUS_GLOBALS = [
  "eval",
  "execSync",
  "spawn",
  "spawnSync",
  "execFile",
  "execFileSync",
  "fork",
  "child_process",
  "process",
  "require",
  "import",
  "module",
  "exports",
  "__dirname",
  "__filename",
  "global",
  "globalThis",
  "Buffer",
  "WebAssembly",
]

// ============================================
// 統一安全守衛類別
// ============================================

export class UnifiedSecurityGuard {
  private enabled: boolean = true
  private strictMode: boolean = false
  private blockedPlugins: Set<string> = new Set()
  private blockedSkills: Set<string> = new Set()
  private auditLog: SecurityCheckResult[] = []
  private lastCheckCache: Map<string, SecurityCheckResult> = new Map()
  private cacheTTL: number = 60000 // 1 分鐘快取

  constructor(strictMode: boolean = false) {
    this.strictMode = strictMode
  }

  // ============================================
  // 插件安全檢查
  // ============================================

  async checkPlugin(plugin: {
    metadata: { name: string; version?: string; dependencies?: string[] }
    hooks?: Record<string, any>
  }): Promise<SecurityCheckResult> {
    const name = plugin.metadata.name
    const cacheKey = `plugin:${name}`

    // 檢查快取
    const cached = this.getCachedResult(cacheKey)
    if (cached) return cached

    const result = await this.performCheck({
      entity: "plugin",
      name,
      data: JSON.stringify(plugin),
      metadata: plugin.metadata,
    })

    this.cacheResult(cacheKey, result)
    return result
  }

  // ============================================
  // 技能安全檢查
  // ============================================

  async checkSkill(skill: {
    name: string
    description?: string
    commands?: string[]
    script?: string
  }): Promise<SecurityCheckResult> {
    const name = skill.name
    const cacheKey = `skill:${name}`

    // 檢查快取
    const cached = this.getCachedResult(cacheKey)
    if (cached) return cached

    const result = await this.performCheck({
      entity: "skill",
      name,
      data: JSON.stringify(skill),
      metadata: { dependencies: skill.commands },
    })

    this.cacheResult(cacheKey, result)
    return result
  }

  // ============================================
  // 執行檢查
  // ============================================

  private async performCheck(config: {
    entity: "plugin" | "skill"
    name: string
    data: string
    metadata: { dependencies?: string[] }
  }): Promise<SecurityCheckResult> {
    const result: SecurityCheckResult = {
      passed: true,
      level: "safe",
      entity: config.entity,
      name: config.name,
      issues: [],
      warnings: [],
      checkedAt: Date.now(),
    }

    const trustedList = config.entity === "plugin" ? TRUSTED_PLUGINS : TRUSTED_SKILLS
    const blockedList = config.entity === "plugin" ? this.blockedPlugins : this.blockedSkills

    // 1. 白名單快速通過
    if (trustedList.includes(config.name)) {
      log.debug(`${config.entity} ${config.name} is trusted`)
      return result
    }

    // 2. 黑名單阻擋
    if (blockedList.has(config.name)) {
      result.passed = false
      result.level = "blocked"
      result.issues.push(`${config.entity} ${config.name} 在黑名單中`)
      this.auditLog.push(result)
      return result
    }

    // 3. 檢查危險模式
    const dangerousResults = this.scanDangerousPatterns(config.data, config.entity)
    result.warnings.push(...dangerousResults.warnings)
    result.issues.push(...dangerousResults.issues)

    // 4. 高級繞過檢測 (防禦升級)
    const bypassResults = this.scanBypassPatterns(config.data)
    result.warnings.push(...bypassResults.warnings)
    result.issues.push(...bypassResults.issues)

    // 5. 檢查危險 Hooks（僅插件）
    if (config.entity === "plugin") {
      const hookWarnings = this.scanDangerousHooks(config.data)
      result.warnings.push(...hookWarnings)
    }

    // 6. 檢查外部依賴
    if (config.metadata.dependencies && config.metadata.dependencies.length > 0) {
      result.warnings.push(`外部依賴: ${config.metadata.dependencies.join(", ")}`)
    }

    // 7. 判定安全等級
    if (result.issues.some((i) => i.includes("critical"))) {
      result.passed = false
      result.level = this.strictMode ? "dangerous" : "warning"
    } else if (result.issues.length > 0) {
      result.level = this.strictMode ? "dangerous" : "warning"
    } else if (result.warnings.length > 0) {
      result.level = "warning"
    }

    // 8. 嚴格模式下警告視為阻擋
    if (this.strictMode && (result.issues.length > 0 || result.warnings.length > 0)) {
      result.passed = false
      result.level = "dangerous"
    }

    this.auditLog.push(result)
    return result
  }

  // ============================================
  // 高級繞過檢測
  // ============================================

  private scanBypassPatterns(data: string): { issues: string[]; warnings: string[] } {
    const issues: string[] = []
    const warnings: string[] = []

    for (const { pattern, reason, severity } of BYPASS_DETECTION_PATTERNS) {
      if (pattern.test(data)) {
        if (severity === "critical") {
          issues.push(`🚨 繞過嘗試: ${reason}`)
        } else {
          warnings.push(`🔍 可疑模式: ${reason}`)
        }
      }
    }

    return { issues, warnings }
  }

  private scanDangerousPatterns(data: string, entity: "plugin" | "skill"): { issues: string[]; warnings: string[] } {
    const issues: string[] = []
    const warnings: string[] = []
    const patterns = entity === "skill" ? [...DANGEROUS_PATTERNS, ...DANGEROUS_SKILL_PATTERNS] : DANGEROUS_PATTERNS

    for (const { pattern, reason, severity } of patterns) {
      if (pattern.test(data)) {
        if (severity === "critical") {
          issues.push(`⚠️ ${reason}`)
        } else {
          warnings.push(`⚡ ${reason}`)
        }
      }
    }

    return { issues, warnings }
  }

  private scanDangerousHooks(data: string): string[] {
    const warnings: string[] = []

    for (const { hook, reason } of DANGEROUS_HOOKS) {
      if (data.includes(`"${hook}"`) || data.includes(`'${hook}'`)) {
        warnings.push(`🔒 敏感 Hook: ${hook} - ${reason}`)
      }
    }

    return warnings
  }

  // ============================================
  // 快取
  // ============================================

  private getCachedResult(key: string): SecurityCheckResult | null {
    const cached = this.lastCheckCache.get(key)
    if (cached && Date.now() - cached.checkedAt < this.cacheTTL) {
      return cached
    }
    return null
  }

  private cacheResult(key: string, result: SecurityCheckResult): void {
    this.lastCheckCache.set(key, result)
  }

  clearCache(): void {
    this.lastCheckCache.clear()
    log.debug("Security check cache cleared")
  }

  // ============================================
  // 名單管理
  // ============================================

  allowPlugin(name: string): void {
    this.blockedPlugins.delete(name)
    if (!TRUSTED_PLUGINS.includes(name)) {
      TRUSTED_PLUGINS.push(name)
    }
    log.info(`Plugin whitelisted: ${name}`)
  }

  allowSkill(name: string): void {
    this.blockedSkills.delete(name)
    if (!TRUSTED_SKILLS.includes(name)) {
      TRUSTED_SKILLS.push(name)
    }
    log.info(`Skill whitelisted: ${name}`)
  }

  blockPlugin(name: string): void {
    this.blockedPlugins.add(name)
    log.warn(`Plugin blocked: ${name}`)
  }

  blockSkill(name: string): void {
    this.blockedSkills.add(name)
    log.warn(`Skill blocked: ${name}`)
  }

  // ============================================
  // 設定
  // ============================================

  enable(): void {
    this.enabled = true
    log.info("Security guard enabled")
  }

  disable(): void {
    this.enabled = false
    log.warn("Security guard disabled")
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setStrictMode(strict: boolean): void {
    this.strictMode = strict
    log.info(`Security strict mode: ${strict ? "ON" : "OFF"}`)
  }

  // ============================================
  // 審計日誌
  // ============================================

  getAuditLog(filter?: { entity?: "plugin" | "skill"; level?: SecurityLevel }): SecurityCheckResult[] {
    let results = [...this.auditLog]

    if (filter?.entity) {
      results = results.filter((r) => r.entity === filter.entity)
    }
    if (filter?.level) {
      results = results.filter((r) => r.level === filter.level)
    }

    return results
  }

  clearAuditLog(): void {
    this.auditLog = []
    log.debug("Audit log cleared")
  }

  // ============================================
  // 狀態
  // ============================================

  getStatus(): {
    enabled: boolean
    strictMode: boolean
    blockedPlugins: number
    blockedSkills: number
    auditLogSize: number
    cacheSize: number
  } {
    return {
      enabled: this.enabled,
      strictMode: this.strictMode,
      blockedPlugins: this.blockedPlugins.size,
      blockedSkills: this.blockedSkills.size,
      auditLogSize: this.auditLog.length,
      cacheSize: this.lastCheckCache.size,
    }
  }
}

// ============================================
// 沙盒隔離執行器
// ============================================

export interface SandboxConfig {
  allowFileRead?: boolean
  allowFileWrite?: boolean
  allowNetwork?: boolean
  allowChildProcess?: boolean
  maxMemory?: number
}

export function createSandbox(config: SandboxConfig = {}): Record<string, unknown> {
  const sandbox: Record<string, unknown> = { ...SAFE_GLOBALS }

  if (!config.allowFileRead) {
    sandbox.readFile = () => {
      throw new Error("File read blocked")
    }
    sandbox.readFileSync = () => {
      throw new Error("File read blocked")
    }
  }

  if (!config.allowFileWrite) {
    sandbox.writeFile = () => {
      throw new Error("File write blocked")
    }
    sandbox.writeFileSync = () => {
      throw new Error("File write blocked")
    }
    sandbox.unlink = () => {
      throw new Error("File delete blocked")
    }
    sandbox.rm = () => {
      throw new Error("File delete blocked")
    }
    sandbox.rmSync = () => {
      throw new Error("File delete blocked")
    }
  }

  if (!config.allowNetwork) {
    sandbox.fetch = () => {
      throw new Error("Network blocked")
    }
    sandbox.XMLHttpRequest = undefined
    sandbox.Net = undefined
  }

  if (!config.allowChildProcess) {
    sandbox.child_process = undefined
    sandbox.spawn = undefined
    sandbox.spawnSync = undefined
    sandbox.exec = undefined
    sandbox.execSync = undefined
    sandbox.fork = undefined
  }

  log.debug("Sandbox created", { config })
  return sandbox
}

// ============================================
// 權限最小化包裝器
// ============================================

export function createSecureContext(): Record<string, unknown> {
  const secureContext: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(SAFE_GLOBALS)) {
    secureContext[key] = value
  }

  const blockedGlobals = DANGEROUS_GLOBALS.filter((g) => !(g in secureContext))
  log.debug("Secure context created, blocked globals:", blockedGlobals)

  return secureContext
}

// ============================================
// 行為監控鉤子
// ============================================

type MonitorCallback = (operation: string, args: unknown[], blocked: boolean) => void

let monitorCallback: MonitorCallback | null = null

export function setMonitorCallback(callback: MonitorCallback): void {
  monitorCallback = callback
  log.info("Monitor callback set")
}

export function notifyMonitor(operation: string, args: unknown[], blocked: boolean = false): void {
  if (monitorCallback) {
    try {
      monitorCallback(operation, args, blocked)
    } catch (e) {
      log.error("Monitor callback error:", e)
    }
  }
}

// ============================================
// 單例
// ============================================

let guardInstance: UnifiedSecurityGuard | null = null

export function getSecurityGuard(strictMode?: boolean): UnifiedSecurityGuard {
  if (!guardInstance) {
    guardInstance = new UnifiedSecurityGuard(strictMode)
  }
  return guardInstance
}

export function resetSecurityGuard(): void {
  guardInstance = null
}
