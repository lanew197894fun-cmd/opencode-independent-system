// 插件安全守衛 - 驗證插件安全性，通過才放行

import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { homedir } from "os"
import { Log } from "../util/log"
import type { Plugin } from "./plugin-system"

export const log = Log.create({ service: "plugin-security" })

// ============================================
// 安全檢查結果
// ============================================

export interface SecurityCheckResult {
  passed: boolean
  level: "safe" | "warning" | "dangerous" | "blocked"
  issues: string[]
  warnings: string[]
}

// ============================================
// 信任的白名單
// ============================================

const TRUSTED_PLUGINS = ["builtin-logger", "builtin-memory", "builtin-error", "ia-plugin-manager"]

const DANGEROUS_PATTERNS = [
  { pattern: /eval\s*\(/, reason: "動態程式碼執行" },
  { pattern: /exec\s*\(/, reason: "系統命令執行" },
  { pattern: /spawn\s*\(/, reason: "子程序生成" },
  { pattern: /fork\s*\(/, reason: "程序分支" },
  { pattern: /process\.exit/, reason: "程序終止" },
  { pattern: /child_process/, reason: "子程序模組" },
  { pattern: /http\.request/, reason: "外部網路請求" },
  { pattern: /https?:\/\//, reason: "網址請求" },
]

const DANGEROUS_HOOKS = ["cli.shutdown", "session.save"]

// ============================================
// 插件安全守衛類別
// ============================================

export class PluginSecurityGuard {
  private enabled: boolean = true
  private strictMode: boolean = false
  private blockedPlugins: Set<string> = new Set()
  private allowedPlugins: Set<string> = new Set()
  private auditLog: SecurityCheckResult[] = []

  constructor(strictMode: boolean = false) {
    this.strictMode = strictMode

    // 預設信任的插件加入白名單
    TRUSTED_PLUGINS.forEach((name) => this.allowedPlugins.add(name))
  }

  // ============================================
  // 安全檢查
  // ============================================

  async check(plugin: Plugin): Promise<SecurityCheckResult> {
    const result: SecurityCheckResult = {
      passed: true,
      level: "safe",
      issues: [],
      warnings: [],
    }

    const name = plugin.metadata.name

    // 1. 檢查白名單
    if (this.allowedPlugins.has(name)) {
      log.debug(`Plugin ${name} is whitelisted`)
      return result
    }

    // 2. 檢查黑名單
    if (this.blockedPlugins.has(name)) {
      result.passed = false
      result.level = "blocked"
      result.issues.push(`插件 ${name} 在黑名單中`)
      return result
    }

    // 3. 檢查元數據完整性
    if (!plugin.metadata.name || !plugin.metadata.version) {
      result.passed = false
      result.level = "dangerous"
      result.issues.push("插件元數據不完整（缺少名稱或版本）")
      return result
    }

    // 4. 檢查危險程式碼模式
    const dangerousCode = this.detectDangerousCode(plugin)
    if (dangerousCode.length > 0) {
      result.warnings.push(...dangerousCode)

      if (this.strictMode) {
        result.passed = false
        result.level = "dangerous"
        result.issues.push("檢測到危險程式碼模式")
      }
    }

    // 5. 檢查危險 Hooks
    const dangerousHooks = this.detectDangerousHooks(plugin)
    if (dangerousHooks.length > 0) {
      result.warnings.push(...dangerousHooks)
    }

    // 6. 檢查外部依賴
    if (plugin.metadata.dependencies && plugin.metadata.dependencies.length > 0) {
      result.warnings.push(`外部依賴: ${plugin.metadata.dependencies.join(", ")}`)
    }

    // 7. 設定安全等級
    if (!result.passed) {
      result.level = "dangerous"
    } else if (result.warnings.length > 0) {
      result.level = "warning"
    }

    // 8. 記錄審計日誌
    this.auditLog.push(result)

    log.info(`Security check for ${name}: ${result.level}`, {
      passed: result.passed,
      warnings: result.warnings.length,
      issues: result.issues.length,
    })

    return result
  }

  private detectDangerousCode(plugin: Plugin): string[] {
    const warnings: string[] = []
    const pluginStr = JSON.stringify(plugin)

    for (const { pattern, reason } of DANGEROUS_PATTERNS) {
      if (pattern.test(pluginStr)) {
        warnings.push(`可能危險: ${reason}`)
      }
    }

    return warnings
  }

  private detectDangerousHooks(plugin: Plugin): string[] {
    const warnings: string[] = []

    if (!plugin.hooks) return warnings

    for (const hook of DANGEROUS_HOOKS) {
      if (hook in plugin.hooks) {
        warnings.push(`使用危險 Hook: ${hook}`)
      }
    }

    return warnings
  }

  // ============================================
  // 白名單管理
  // ============================================

  allow(pluginName: string): void {
    this.allowedPlugins.add(pluginName)
    this.blockedPlugins.delete(pluginName)
    log.info(`Plugin added to whitelist: ${pluginName}`)
  }

  allowMultiple(names: string[]): void {
    names.forEach((name) => this.allow(name))
  }

  // ============================================
  // 黑名單管理
  // ============================================

  block(pluginName: string): void {
    this.blockedPlugins.add(pluginName)
    this.allowedPlugins.delete(pluginName)
    log.info(`Plugin blocked: ${pluginName}`)
  }

  isBlocked(pluginName: string): boolean {
    return this.blockedPlugins.has(pluginName)
  }

  // ============================================
  // 設定
  // ============================================

  enable(): void {
    this.enabled = true
    log.info("Plugin security guard enabled")
  }

  disable(): void {
    this.enabled = false
    log.warn("Plugin security guard disabled - NOT RECOMMENDED")
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setStrictMode(strict: boolean): void {
    this.strictMode = strict
    log.info(`Strict mode ${strict ? "enabled" : "disabled"}`)
  }

  // ============================================
  // 審計日誌
  // ============================================

  getAuditLog(): SecurityCheckResult[] {
    return [...this.auditLog]
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
    blockedCount: number
    allowedCount: number
    auditLogSize: number
  } {
    return {
      enabled: this.enabled,
      strictMode: this.strictMode,
      blockedCount: this.blockedPlugins.size,
      allowedCount: this.allowedPlugins.size,
      auditLogSize: this.auditLog.length,
    }
  }
}

// ============================================
// 單例模式
// ============================================

let guardInstance: PluginSecurityGuard | null = null

export function getSecurityGuard(strictMode?: boolean): PluginSecurityGuard {
  if (!guardInstance) {
    guardInstance = new PluginSecurityGuard(strictMode)
  }
  return guardInstance
}
