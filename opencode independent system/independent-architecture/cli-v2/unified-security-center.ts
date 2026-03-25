// 統一安全管理中心 - 整合 VPN、RDP、24小時防禦、插件/技能檢測、衝突檢測

import { homedir } from "os"
import { join } from "path"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { exec } from "child_process"
import { promisify } from "util"
import { Log } from "../util/log"

const execAsync = promisify(exec)

export const log = Log.create({ service: "security-center" })

// ============================================
// 通知類型
// ============================================

export interface Notification {
  type: "conflict" | "blocked" | "warning" | "security"
  title: string
  message: string
  timestamp: number
  autoAction?: "blocked" | "disabled" | "ignored"
  read?: boolean
}

// ============================================
// 安全等級
// ============================================

export type SecurityLevel = "safe" | "warning" | "dangerous" | "blocked"
export type EntityType = "plugin" | "skill" | "network" | "system"

// ============================================
// 檢測結果
// ============================================

export interface SecurityCheckResult {
  id: string
  type: EntityType
  name: string
  status: "active" | "inactive" | "error" | "blocked"
  level: SecurityLevel
  issues: string[]
  warnings: string[]
  lastCheck: number
  uptime?: number
}

export interface ScamCheckResult {
  isScam: boolean
  level: SecurityLevel
  reasons: string[]
  suggestions: string[]
  riskScore: number
}

export interface ScamUrlResult {
  url: string
  risk: "safe" | "low" | "medium" | "high" | "error" | "unknown"
  isPhishing: boolean
  issues: string[]
  suggestions: string[]
  details: {
    domain: string
    hasSuspiciousTLD: boolean
    hasIPAddress: boolean
    hasSuspiciousWords: boolean
    hasRedirect: boolean
  }
}

export interface ScamEmailResult {
  risk: "safe" | "low" | "medium" | "high"
  isScam: boolean
  issues: string[]
  warnings: string[]
  suggestions: string[]
  analysis: {
    hasUrgency: boolean
    hasThreat: boolean
    hasPrize: boolean
    hasLink: boolean
    hasAttachment: boolean
    suspiciousSenders: string[]
    suspiciousLinks: string[]
    suspiciousDomains: string[]
  }
}

export interface SourceVerificationResult {
  isVerified: boolean
  authenticity: "real" | "likely_real" | "unverified" | "likely_fake" | "fake"
  trustScore: number
  issues: string[]
  warnings: string[]
  suggestions: string[]
  details: {
    domainAge?: string
    domainAgeDays?: number
    hasKnownPatterns: boolean
    clickbaitScore: number
    manipulationScore: number
    hasVerifiedSource: boolean
    sourceReputation: "high" | "medium" | "low" | "unknown"
  }
}

export interface VPNStatus {
  connected: boolean
  provider?: string
  ip?: string
  location?: string
  since?: number
}

export interface RDPStatus {
  enabled: boolean
  blocked: boolean
  allowedIPs: string[]
  blockCount: number
  lastBlock?: number
}

export interface Defense24Status {
  active: boolean
  threatCount: number
  blockedCount: number
  lastThreat?: number
  schedule: string
}

// ============================================
// 衝突檢測配置
// ============================================

interface ConflictPattern {
  pluginA: string
  pluginB: string
  reason: string
  severity: "high" | "critical"
}

const CONFLICT_PATTERNS: ConflictPattern[] = [
  { pluginA: "builtin-logger", pluginB: "silent-logger", reason: "重複日誌記錄", severity: "high" },
  { pluginA: "builtin-memory", pluginB: "external-memory", reason: "記憶系統衝突", severity: "critical" },
  { pluginA: "security-vpn", pluginB: "security-off", reason: "VPN 與關閉安全衝突", severity: "critical" },
  { pluginA: "openclaw-plugin", pluginB: "clawhub-offline", reason: "OpenClaw 衝突", severity: "high" },
]

// ============================================
// 統一安全管理中心
// ============================================

export class UnifiedSecurityCenter {
  private baseDir: string
  private configFile: string
  private logDir: string

  // 安全狀態
  private vpnStatus: VPNStatus = { connected: false }
  private rdpStatus: RDPStatus = { enabled: false, blocked: false, allowedIPs: [], blockCount: 0 }
  private defense24Status: Defense24Status = { active: false, threatCount: 0, blockedCount: 0, schedule: "24h" }

  // 審計日誌
  private auditLog: SecurityCheckResult[] = []

  // 通知列表
  private notifications: Notification[] = []

  // 已知的衝突
  private knownConflicts: Set<string> = new Set()

  // 設定
  private config = {
    vpn: {
      enabled: true,
      autoConnect: true,
      provider: "wireguard",
    },
    rdp: {
      enabled: true,
      autoBlock: true,
      whitelist: [] as string[],
    },
    defense24: {
      enabled: true,
      interval: 300, // 5分鐘檢查一次
      alerts: true,
    },
    pluginCheck: {
      enabled: true,
      strictMode: false,
      autoBlockDangerous: true,
    },
    skillCheck: {
      enabled: true,
      strictMode: false,
      autoBlockDangerous: true,
    },
  }

  constructor(dataDir?: string) {
    this.baseDir = dataDir || join(homedir(), ".independent-architecture", "security")
    this.configFile = join(this.baseDir, "security-center.json")
    this.logDir = join(this.baseDir, "logs")
    this.ensureDirectories()
    this.loadConfig()
  }

  private ensureDirectories(): void {
    if (!existsSync(this.baseDir)) mkdirSync(this.baseDir, { recursive: true })
    if (!existsSync(this.logDir)) mkdirSync(this.logDir, { recursive: true })
  }

  private loadConfig(): void {
    if (existsSync(this.configFile)) {
      try {
        const content = readFileSync(this.configFile, "utf-8")
        const saved = JSON.parse(content)
        Object.assign(this.config, saved)
      } catch (error) {
        log.warn("Failed to load security config")
      }
    }
  }

  private saveConfig(): void {
    writeFileSync(this.configFile, JSON.stringify(this.config, null, 2))
  }

  // ============================================
  // VPN 管理
  // ============================================

  async checkVPN(): Promise<SecurityCheckResult> {
    const result: SecurityCheckResult = {
      id: "vpn",
      type: "network",
      name: "VPN",
      status: "inactive",
      level: "safe",
      issues: [],
      warnings: [],
      lastCheck: Date.now(),
    }

    try {
      // 檢查 WireGuard 狀態
      const { stdout } = await execAsync("wg show 2>/dev/null || echo 'not_found'")

      if (stdout.includes("interface") || stdout.includes("peer")) {
        result.status = "active"
        this.vpnStatus.connected = true

        // 嘗試獲取 IP
        try {
          const { stdout: ip } = await execAsync("curl -s ifconfig.me 2>/dev/null || echo 'unknown'")
          this.vpnStatus.ip = ip.trim()
        } catch {}
      } else {
        result.status = "inactive"
        this.vpnStatus.connected = false

        if (this.config.vpn.autoConnect) {
          result.warnings.push("VPN 未連接，已自動嘗試連接")
          // await this.connectVPN();
        }
      }
    } catch (error) {
      result.status = "error"
      result.level = "warning"
      result.warnings.push("無法檢測 VPN 狀態")
    }

    this.auditLog.push(result)
    return result
  }

  async connectVPN(config?: string): Promise<boolean> {
    try {
      if (config) {
        await execAsync(`sudo wg-quick up ${config}`)
      } else {
        await execAsync("sudo wg-quick up wg0")
      }
      this.vpnStatus.connected = true
      this.vpnStatus.since = Date.now()
      log.info("VPN connected")
      return true
    } catch (error) {
      log.error("VPN connection failed", { error })
      return false
    }
  }

  async disconnectVPN(): Promise<boolean> {
    try {
      await execAsync("sudo wg-quick down wg0")
      this.vpnStatus.connected = false
      log.info("VPN disconnected")
      return true
    } catch (error) {
      log.error("VPN disconnect failed", { error })
      return false
    }
  }

  getVPNStatus(): VPNStatus {
    return { ...this.vpnStatus }
  }

  // ============================================
  // RDP 防護
  // ============================================

  async checkRDP(): Promise<SecurityCheckResult> {
    const result: SecurityCheckResult = {
      id: "rdp",
      type: "network",
      name: "RDP 防護",
      status: "inactive",
      level: "safe",
      issues: [],
      warnings: [],
      lastCheck: Date.now(),
    }

    try {
      // 檢查 ufw 規則
      const { stdout } = await execAsync("sudo ufw status 2>/dev/null | grep -i rdp || echo 'not_found'")

      if (stdout.includes("3389") || stdout.includes("RDP")) {
        result.status = "active"
        this.rdpStatus.enabled = true
      }

      // 檢查是否被阻擋
      if (this.rdpStatus.blocked) {
        result.level = "warning"
        result.warnings.push("RDP 連接已被阻擋")
      }
    } catch (error) {
      result.status = "error"
      result.warnings.push("無法檢測 RDP 狀態")
    }

    this.auditLog.push(result)
    return result
  }

  async blockRDP(): Promise<boolean> {
    try {
      await execAsync("sudo ufw deny 3389/tcp")
      this.rdpStatus.blocked = true
      this.rdpStatus.blockCount++
      this.rdpStatus.lastBlock = Date.now()
      log.info("RDP blocked")
      return true
    } catch (error) {
      log.error("Failed to block RDP", { error })
      return false
    }
  }

  async allowRDP(ip: string): Promise<boolean> {
    try {
      await execAsync(`sudo ufw allow from ${ip} to any port 3389`)
      this.rdpStatus.allowedIPs.push(ip)
      log.info(`RDP allowed for IP: ${ip}`)
      return true
    } catch (error) {
      log.error("Failed to allow RDP", { error })
      return false
    }
  }

  getRDPStatus(): RDPStatus {
    return { ...this.rdpStatus }
  }

  // ============================================
  // 24小時防禦
  // ============================================

  async checkDefense24(): Promise<SecurityCheckResult> {
    const result: SecurityCheckResult = {
      id: "defense24",
      type: "system",
      name: "24小時防禦",
      status: this.defense24Status.active ? "active" : "inactive",
      level: "safe",
      issues: [],
      warnings: [],
      lastCheck: Date.now(),
    }

    // 檢查 fail2ban 狀態
    try {
      const { stdout } = await execAsync("sudo fail2ban-client status 2>/dev/null | head -5 || echo 'not_found'")

      if (stdout.includes("Number of jail")) {
        result.status = "active"
        this.defense24Status.active = true
      }
    } catch {
      result.warnings.push("fail2ban 未運行")
    }

    // 檢查最近的威脅日誌
    try {
      const { stdout } = await execAsync(
        "sudo tail -100 /var/log/auth.log 2>/dev/null | grep -i 'failed\\|invalid' | wc -l || echo '0'",
      )
      const recentThreats = parseInt(stdout.trim()) || 0
      this.defense24Status.threatCount += recentThreats

      if (recentThreats > 10) {
        result.level = "warning"
        result.warnings.push(`最近有 ${recentThreats} 次失敗登入嘗試`)
      }
    } catch {}

    this.auditLog.push(result)
    return result
  }

  // ============================================
  // 防詐騙檢測 - 兩種模式
  // ============================================

  // 自動監控開關
  private scamAutoMonitor: boolean = false
  private scamMonitorChannels: Set<string> = new Set()

  // 啟動自動監控
  startScamAutoMonitor(channel: string): void {
    this.scamAutoMonitor = true
    this.scamMonitorChannels.add(channel)
    log.info(`Scam auto-monitor started for channel: ${channel}`)
  }

  // 停止自動監控
  stopScamAutoMonitor(channel?: string): void {
    if (channel) {
      this.scamMonitorChannels.delete(channel)
      log.info(`Scam auto-monitor stopped for channel: ${channel}`)
    } else {
      this.scamAutoMonitor = false
      this.scamMonitorChannels.clear()
      log.info("Scam auto-monitor stopped")
    }
  }

  // 是否正在監控
  isScamAutoMonitorEnabled(): boolean {
    return this.scamAutoMonitor
  }

  getMonitoredChannels(): string[] {
    return Array.from(this.scamMonitorChannels)
  }

  // 自動檢測訊息（監控時調用）
  async autoCheckScam(content: string, source: string = "unknown"): Promise<ScamCheckResult> {
    const result = await this.checkScam(content)

    // 如果是詐騙，記錄並警告
    if (result.isScam) {
      const alert: SecurityCheckResult = {
        id: `scam-alert-${Date.now()}`,
        type: "system",
        name: `🚨 詐騙警告 [${source}]`,
        status: "blocked",
        level: result.level,
        issues: result.reasons,
        warnings: [],
        lastCheck: Date.now(),
      }
      this.auditLog.push(alert)

      log.warn(`Scam detected from ${source}`, {
        reasons: result.reasons,
        level: result.level,
      })
    }

    return result
  }

  // 手動檢測 - 訊息/文字
  async checkScamMessage(message: string): Promise<ScamCheckResult> {
    return this.checkScam(message)
  }

  // 手動檢測 - 網址
  async checkScamUrl(url: string): Promise<ScamUrlResult> {
    const result: ScamUrlResult = {
      url,
      risk: "unknown",
      isPhishing: false,
      issues: [],
      suggestions: [],
      details: {
        domain: "",
        hasSuspiciousTLD: false,
        hasIPAddress: false,
        hasSuspiciousWords: false,
        hasRedirect: false,
      },
    }

    try {
      // 提取域名
      const urlObj = new URL(url)
      result.details.domain = urlObj.hostname

      // 檢查可疑 TLD
      const suspiciousTLDs = [".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".buzz"]
      for (const tld of suspiciousTLDs) {
        if (urlObj.hostname.endsWith(tld)) {
          result.details.hasSuspiciousTLD = true
          result.issues.push(`可疑域名後綴: ${tld}`)
        }
      }

      // 檢查 IP 地址
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(urlObj.hostname)) {
        result.details.hasIPAddress = true
        result.issues.push("直接使用 IP 地址（非正常網站）")
      }

      // 檢查可疑關鍵詞
      const suspiciousWords = ["login", "signin", "verify", "account", "secure", "update", "confirm", "bank"]
      for (const word of suspiciousWords) {
        if (urlObj.pathname.toLowerCase().includes(word)) {
          result.details.hasSuspiciousWords = true
          result.issues.push(`可疑路徑關鍵詞: ${word}`)
        }
      }

      // 檢查重定向
      if (url.includes("redirect=") || url.includes("url=") || url.includes("goto=")) {
        result.details.hasRedirect = true
        result.issues.push("包含重定向參數")
      }

      // 計算風險
      let riskScore = 0
      if (result.details.hasSuspiciousTLD) riskScore += 30
      if (result.details.hasIPAddress) riskScore += 40
      if (result.details.hasSuspiciousWords) riskScore += 20
      if (result.details.hasRedirect) riskScore += 25

      if (riskScore >= 50) {
        result.risk = "high"
        result.isPhishing = true
      } else if (riskScore >= 30) {
        result.risk = "medium"
      } else if (riskScore >= 10) {
        result.risk = "low"
      } else {
        result.risk = "safe"
      }

      // 建議
      if (result.isPhishing) {
        result.suggestions.push("⚠️ 強烈建議不要訪問此網址")
        result.suggestions.push("🔍 確認網址是否為官方網站")
        result.suggestions.push("🔒 使用官方網站的書籤訪問")
      }
    } catch (error) {
      result.risk = "error"
      result.issues.push("無法解析網址")
    }

    // 記錄審計
    this.auditLog.push({
      id: `scam-url-${Date.now()}`,
      type: "system",
      name: "防詐騙 URL 檢測",
      status: result.isPhishing ? "blocked" : "active",
      level: result.isPhishing ? "dangerous" : result.risk === "medium" ? "warning" : "safe",
      issues: result.issues,
      warnings: [],
      lastCheck: Date.now(),
    })

    return result
  }

  // 手動檢測 - 郵件內容
  async checkScamEmail(emailContent: string): Promise<ScamEmailResult> {
    const result: ScamEmailResult = {
      risk: "safe",
      isScam: false,
      issues: [],
      warnings: [],
      suggestions: [],
      analysis: {
        hasUrgency: false,
        hasThreat: false,
        hasPrize: false,
        hasLink: false,
        hasAttachment: false,
        suspiciousSenders: [],
        suspiciousLinks: [],
        suspiciousDomains: [],
      },
    }

    // 提取郵件內容
    const lines = emailContent.split("\n")

    // 檢查緊迫性
    if (/立即|馬上|馬上就|限時|立刻|馬上行動/.test(emailContent)) {
      result.analysis.hasUrgency = true
      result.warnings.push("⚡ 包含緊迫性語言")
    }

    // 檢查威脅
    if (/帳戶.*鎖|法院.*傳票|法律.*責任|起訴/.test(emailContent)) {
      result.analysis.hasThreat = true
      result.warnings.push("🚨 包含威脅性內容")
    }

    // 檢查中獎
    if (/中獎|恭喜|抽獎|贏得|免費獲得/.test(emailContent)) {
      result.analysis.hasPrize = true
      result.warnings.push("🎁 包含中獎/優惠內容")
    }

    // 提取連結
    const urlMatches = emailContent.match(/https?:\/\/[^\s<>"]+/g) || []
    result.analysis.hasLink = urlMatches.length > 0

    // 提取域名
    for (const url of urlMatches) {
      try {
        const urlObj = new URL(url)
        result.analysis.suspiciousLinks.push(url)
        result.analysis.suspiciousDomains.push(urlObj.hostname)
      } catch {}
    }

    // 檢查附件
    if (/附件|attach|file|document/i.test(emailContent)) {
      result.analysis.hasAttachment = true
      result.warnings.push("📎 提及附件")
    }

    // 提取發件人（假設格式）
    const fromMatch = emailContent.match(/From:\s*<?([^<\n>]+@[^<\n>]+)>?/i)
    if (fromMatch) {
      result.analysis.suspiciousSenders.push(fromMatch[1])
    }

    // 計算風險
    let riskScore = 0
    if (result.analysis.hasUrgency) riskScore += 20
    if (result.analysis.hasThreat) riskScore += 30
    if (result.analysis.hasPrize) riskScore += 25
    if (result.analysis.suspiciousLinks.length > 0) riskScore += 30
    if (result.analysis.hasAttachment) riskScore += 15

    if (riskScore >= 60) {
      result.risk = "high"
      result.isScam = true
    } else if (riskScore >= 40) {
      result.risk = "medium"
    } else if (riskScore >= 20) {
      result.risk = "low"
    }

    // 生成建議
    if (result.isScam) {
      result.suggestions.push("🚨 高度懷疑為詐騙郵件")
      result.suggestions.push("❌ 不要點擊任何連結")
      result.suggestions.push("❌ 不要下載附件")
      result.suggestions.push("❌ 不要回覆郵件")
      result.suggestions.push("🔍 透過官方管道確認")
    } else if (result.risk === "medium") {
      result.suggestions.push("⚠️ 建議謹慎處理")
      result.suggestions.push("🔍 核實發件人身份")
    }

    // 記錄審計
    this.auditLog.push({
      id: `scam-email-${Date.now()}`,
      type: "system",
      name: "防詐騙郵件檢測",
      status: result.isScam ? "blocked" : "active",
      level: result.isScam ? "dangerous" : result.risk === "medium" ? "warning" : "safe",
      issues: result.isScam ? ["高度懷疑為詐騙郵件"] : [],
      warnings: result.warnings,
      lastCheck: Date.now(),
    })

    return result
  }

  // ============================================
  // 消息來源真假度驗證
  // ============================================

  async verifySource(content: string, source?: string, url?: string): Promise<SourceVerificationResult> {
    const result: SourceVerificationResult = {
      isVerified: false,
      authenticity: "unverified",
      trustScore: 50,
      issues: [],
      warnings: [],
      suggestions: [],
      details: {
        hasKnownPatterns: false,
        clickbaitScore: 0,
        manipulationScore: 0,
        hasVerifiedSource: false,
        sourceReputation: "unknown",
      },
    }

    if (source) {
      result.details.hasVerifiedSource = this.isKnownTrustedSource(source)
      if (result.details.hasVerifiedSource) {
        result.trustScore += 20
        result.details.sourceReputation = "high"
      }
    }

    if (url) {
      try {
        const urlObj = new URL(url)
        result.details.domainAgeDays = await this.getDomainAge(urlObj.hostname)
        if (result.details.domainAgeDays !== undefined) {
          if (result.details.domainAgeDays < 30) {
            result.issues.push(`🔴 域名年齡僅 ${result.details.domainAgeDays} 天（新域名風險高）`)
            result.trustScore -= 30
          } else if (result.details.domainAgeDays < 180) {
            result.warnings.push(`🟡 域名年齡 ${result.details.domainAgeDays} 天（較新）`)
            result.trustScore -= 10
          }
          result.details.domainAge = `${result.details.domainAgeDays} 天`
        }
      } catch {}
    }

    const clickbaitPatterns = [
      { pattern: /震驚|驚呆了|不可思議|99%.*人|所有人都/, score: 15, reason: "震驚式標題" },
      { pattern: /快轉發|趕快分享|你一定不知道|終於曝光/, score: 15, reason: "病毒式傳播誘導" },
      { pattern: /獨家|爆料|內幕|秘密/, score: 10, reason: "神秘感標題" },
      { pattern: /看完.*淚流|看完.*崩潰|.*結局.*想不到/, score: 15, reason: "情緒操控標題" },
      { pattern: /央視曝光|人民網.*證實|官方.*證實/, score: 20, reason: "假冒官方引用" },
      { pattern: /專家.*說|醫生.*警告|研究.*發現.*驚人/, score: 10, reason: "專家話術" },
    ]

    for (const { pattern, score, reason } of clickbaitPatterns) {
      if (pattern.test(content)) {
        result.details.clickbaitScore += score
        result.warnings.push(`📢 ${reason}`)
      }
    }

    const manipulationPatterns = [
      { pattern: /美國|中國|台灣.*完蛋|經濟.*崩潰/, score: 25, reason: "煽動性政治內容" },
      { pattern: /股市.*必漲|明天.*暴漲|重大.*利好/, score: 20, reason: "股市操控意圖" },
      { pattern: /疫苗.*副作用|轉基因.*危害|5G.*致癌/, score: 25, reason: "科學假訊息" },
      { pattern: /粉絲.*百萬|點讚.*破萬|轉發.*十萬/, score: 10, reason: "虛假互動數據" },
      { pattern: /恐怖|戰爭.*爆發|災難.*來臨/, score: 20, reason: "恐懼散播" },
    ]

    for (const { pattern, score, reason } of manipulationPatterns) {
      if (pattern.test(content)) {
        result.details.manipulationScore += score
        result.warnings.push(`🎭 ${reason}`)
      }
    }

    if (result.details.clickbaitScore >= 30 || result.details.manipulationScore >= 30) {
      result.details.hasKnownPatterns = true
    }

    result.trustScore -= Math.floor(result.details.clickbaitScore * 0.5)
    result.trustScore -= Math.floor(result.details.manipulationScore * 0.5)

    if (result.trustScore >= 70) {
      result.authenticity = "likely_real"
      result.isVerified = true
    } else if (result.trustScore >= 50) {
      result.authenticity = "unverified"
    } else if (result.trustScore >= 30) {
      result.authenticity = "likely_fake"
    } else {
      result.authenticity = "fake"
    }

    if (result.authenticity === "fake" || result.authenticity === "likely_fake") {
      result.suggestions.push("⚠️ 高度懷疑為假訊息")
      result.suggestions.push("🔍 查證其他新聞來源")
      result.suggestions.push("🌐 使用事實查核網站驗證")
      result.suggestions.push("📱 透過官方管道確認")
    } else if (result.authenticity === "unverified") {
      result.suggestions.push("⚠️ 訊息真實性未確認")
      result.suggestions.push("🔍 建議多方查證")
    }

    this.auditLog.push({
      id: `source-verify-${Date.now()}`,
      type: "system",
      name: "來源真假度驗證",
      status: result.isVerified ? "active" : "inactive",
      level: result.authenticity === "fake" ? "dangerous" : result.authenticity === "likely_fake" ? "warning" : "safe",
      issues: result.issues,
      warnings: result.warnings,
      lastCheck: Date.now(),
    })

    return result
  }

  private isKnownTrustedSource(source: string): boolean {
    const trustedSources = [
      "中央社",
      "中央廣播電台",
      "公視",
      "UDN",
      "聯合報",
      "自由時報",
      "蘋果日報",
      "BBC",
      "Reuters",
      "AP",
      "AFP",
      "新華社",
      "人民網",
      "環球時報",
      "NYT",
      "Washington Post",
      "The Guardian",
    ]
    return trustedSources.some((s) => source.includes(s))
  }

  private async getDomainAge(domain: string): Promise<number | undefined> {
    return undefined
  }

  async verifyNews(content: string): Promise<SourceVerificationResult> {
    return this.verifySource(content)
  }

  // 通用檢測介面
  async checkScam(message: string): Promise<ScamCheckResult> {
    const reasons: string[] = []
    const suggestions: string[] = []

    // 詐騙關鍵詞
    const scamKeywords = [
      { pattern: /您的.*帳戶.*被鎖|帳戶.*異常/, reason: "假冒官方帳戶警告" },
      { pattern: /立即.*轉帳|馬上.*匯款/, reason: "要求緊急匯款" },
      { pattern: /優惠.*限時|錯過就沒了/, reason: "限時優惠話術" },
      { pattern: /點擊.*連結|點此.*領取/, reason: "可疑連結" },
      { pattern: /驗證.*銀行|確認.*帳戶/, reason: "假冒銀行驗證" },
      { pattern: /比特幣|虛擬貨幣.*投資/, reason: "加密貨幣投資詐騙" },
      { pattern: /個人.*資料.*更新|補繳.*費用/, reason: "假冒費用/資料更新" },
      { pattern: /海關.*包裹|包裹.*被扣/, reason: "假冒海關/包裹" },
      { pattern: /法院.*傳票|帳戶.*涉及/, reason: "假冒司法威脅" },
      { pattern: /中獎|抽獎.*通知/, reason: "假冒中獎通知" },
    ]

    // 評估風險
    let riskScore = 0

    for (const { pattern, reason } of scamKeywords) {
      if (pattern.test(message)) {
        reasons.push(reason)
        riskScore += 20
      }
    }

    // 檢查可疑特徵
    if (/https?:\/\/[^\s]*[0-9a-z]{20,}/.test(message)) {
      reasons.push("包含可疑短連結")
      riskScore += 15
    }

    if (/[A-Z]{5,}/.test(message)) {
      reasons.push("大量大寫字母（情緒操控）")
      riskScore += 10
    }

    if (/！{2,}/.test(message)) {
      reasons.push("過多驚嘆號（製造緊迫感）")
      riskScore += 10
    }

    if (!/[a-z]/.test(message) && message.length > 50) {
      reasons.push("全大寫文字")
      riskScore += 15
    }

    // 判定結果
    const isScam = riskScore >= 40
    let level: SecurityLevel = "safe"

    if (riskScore >= 60) level = "dangerous"
    else if (riskScore >= 40) level = "warning"

    // 提供建議
    if (isScam) {
      suggestions.push("不要點擊任何連結")
      suggestions.push("不要提供任何個人資料")
      suggestions.push("不要轉帳或匯款")
      suggestions.push("透過官方管道確認訊息真實性")
    }

    return { isScam, level, reasons, suggestions, riskScore }
  }

  analyzeScam(message: string): SecurityCheckResult {
    const result: SecurityCheckResult = {
      id: "scam-check",
      type: "system",
      name: "防詐騙檢測",
      status: "active",
      level: "safe",
      issues: [],
      warnings: [],
      lastCheck: Date.now(),
    }

    // 這個方法同步檢測
    const reasons: string[] = []

    const scamPatterns = [
      { pattern: /您的.*帳戶.*被鎖|帳戶.*異常/, reason: "假冒官方帳戶警告" },
      { pattern: /立即.*轉帳|馬上.*匯款/, reason: "要求緊急匯款" },
      { pattern: /優惠.*限時|錯過就沒了/, reason: "限時優惠話術" },
      { pattern: /點擊.*連結|點此.*領取/, reason: "可疑連結" },
      { pattern: /驗證.*銀行|確認.*帳戶/, reason: "假冒銀行驗證" },
    ]

    let riskScore = 0

    for (const { pattern, reason } of scamPatterns) {
      if (pattern.test(message)) {
        reasons.push(reason)
        riskScore += 20
      }
    }

    if (riskScore >= 40) {
      result.level = "warning"
      result.warnings.push(...reasons)
    }

    this.auditLog.push(result)
    return result
  }

  startDefense24(): void {
    this.defense24Status.active = true
    this.defense24Status.lastThreat = Date.now()
    log.info("24-hour defense activated")
  }

  stopDefense24(): void {
    this.defense24Status.active = false
    log.info("24-hour defense deactivated")
  }

  getDefense24Status(): Defense24Status {
    return { ...this.defense24Status }
  }

  // ============================================
  // 插件安全檢測
  // ============================================

  async checkPlugin(plugin: {
    metadata: { name: string; version?: string; dependencies?: string[]; author?: string }
    hooks?: Record<string, any>
  }): Promise<SecurityCheckResult> {
    const result: SecurityCheckResult = {
      id: `plugin:${plugin.metadata.name}`,
      type: "plugin",
      name: plugin.metadata.name,
      status: "active",
      level: "safe",
      issues: [],
      warnings: [],
      lastCheck: Date.now(),
    }

    if (!this.config.pluginCheck.enabled) {
      return result
    }

    // 1. 危險程式碼檢測
    const dangerousPatterns = [
      { pattern: /eval\s*\(/, reason: "動態程式碼執行", level: "critical" },
      { pattern: /exec\s*\(/, reason: "系統命令執行", level: "critical" },
      { pattern: /child_process/, reason: "子程序模組", level: "high" },
      { pattern: /process\.exit/, reason: "強制終止程序", level: "critical" },
      { pattern: /fetch\s*\(.*\)/, reason: "外部網路請求", level: "medium" },
      { pattern: /http\.request|https?:\/\//, reason: "HTTP 請求", level: "medium" },
    ]

    const pluginStr = JSON.stringify(plugin)

    for (const { pattern, reason, level } of dangerousPatterns) {
      if (pattern.test(pluginStr)) {
        result.issues.push(`⚠️ 危險: ${reason}`)
        if (level === "critical") {
          result.level = this.config.pluginCheck.strictMode ? "blocked" : "dangerous"
        }
        if (this.config.pluginCheck.autoBlockDangerous) {
          result.status = "blocked"
        }
      }
    }

    // 2. 防詐騙檢測 - 插件隱藏詐騙程式碼
    const scamPatterns = [
      { pattern: /api[_-]?key.*=.*["'][A-Za-z0-9]{20,}/, reason: "疑似 API Key 外洩" },
      { pattern: /password.*=.*["'][^"']{8,}/, reason: "疑似密碼外洩" },
      { pattern: /steal|extract|screen.*shot|key.*log/, reason: "疑似盜取資料", level: "critical" },
      { pattern: /redirect.*https?:\/\//, reason: "可疑 URL 重定向" },
      { pattern: /fake|mock.*api|intercept.*request/, reason: "攔截請求/假冒 API" },
      { pattern: /crypto.*wallet|seed.*phrase|private.*key/, reason: "加密貨幣錢包盜取", level: "critical" },
      { pattern: /credit.*card|bank.*account|payment.*info/, reason: "金融資料盜取", level: "critical" },
    ]

    for (const { pattern, reason, level } of scamPatterns) {
      if (pattern.test(pluginStr)) {
        result.issues.push(`🚨 詐騙風險: ${reason}`)
        result.level = "dangerous"
        result.status = "blocked"
      }
    }

    // 3. 檢查危險 Hooks
    const dangerousHooks = ["cli.shutdown", "session.save"]
    for (const hook of dangerousHooks) {
      if (pluginStr.includes(`"${hook}"`)) {
        result.warnings.push(`🔒 敏感 Hook: ${hook}`)
      }
    }

    // 4. 檢查作者可信度
    if (!plugin.metadata.author && plugin.metadata.dependencies?.length) {
      result.warnings.push("⚡ 無作者資訊但有外部依賴")
    }

    this.auditLog.push(result)
    return result
  }

  // ============================================
  // 技能安全檢測
  // ============================================

  async checkSkill(skill: {
    name: string
    commands?: string[]
    script?: string
    author?: string
  }): Promise<SecurityCheckResult> {
    const result: SecurityCheckResult = {
      id: `skill:${skill.name}`,
      type: "skill",
      name: skill.name,
      status: "active",
      level: "safe",
      issues: [],
      warnings: [],
      lastCheck: Date.now(),
    }

    if (!this.config.skillCheck.enabled) {
      return result
    }

    const skillStr = JSON.stringify(skill)

    // 1. 危險操作檢測
    const dangerousPatterns = [
      { pattern: /git\s+push\s+--force/, reason: "強制推送", level: "high" },
      { pattern: /DROP\s+TABLE/i, reason: "資料庫刪除", level: "critical" },
      { pattern: /DELETE\s+FROM\s+\w+/i, reason: "資料庫刪除", level: "high" },
      { pattern: /curl\s.*\|.*sh/, reason: "管道下載執行", level: "critical" },
      { pattern: /wget\s.*\|.*sh/, reason: "管道下載執行", level: "critical" },
      { pattern: /sudo\s+su/, reason: "提權至 root", level: "critical" },
      { pattern: /rm\s+[-rRf]+\s+\//, reason: "危險刪除命令", level: "critical" },
      { pattern: /chmod\s+777/, reason: "危險權限設定", level: "high" },
    ]

    for (const { pattern, reason, level } of dangerousPatterns) {
      if (pattern.test(skillStr)) {
        result.issues.push(`⚠️ 危險: ${reason}`)
        if (level === "critical") {
          result.level = "dangerous"
        }
      }
    }

    // 2. 防詐騙檢測 - 技能隱藏詐騙
    const scamPatterns = [
      { pattern: /api[_-]?key.*=.*["'][A-Za-z0-9]{20,}/, reason: "疑似 API Key 外洩" },
      { pattern: /password.*=.*["'][^"']{8,}/, reason: "疑似密碼外洩" },
      { pattern: /send.*telegram.*key|discord.*webhook.*http/, reason: "隱秘資料外送" },
      { pattern: /steal|extract|scrape.*data/, reason: "資料盜取意圖" },
      { pattern: /fake.*login|phishing/, reason: "假冒登入頁面" },
      { pattern: /inject.*html|xss|cross.*site/, reason: "跨站腳本攻擊" },
      { pattern: /crypto.*transfer|nft.*mint.*scam/, reason: "加密貨幣詐騙" },
      { pattern: /bank.*transfer.*request|payment.*redirect/, reason: "金融詐騙" },
      { pattern: /social.*engineering|phish/, reason: "社交工程攻擊" },
    ]

    for (const { pattern, reason } of scamPatterns) {
      if (pattern.test(skillStr)) {
        result.issues.push(`🚨 詐騙風險: ${reason}`)
        result.level = "dangerous"
        result.status = "blocked"
      }
    }

    // 3. 可疑描述檢測
    const suspiciousDescriptions = [
      /免費.*破解|免費.* license/i,
      /hack.*tool|exploit.*framework/i,
      /spyware|malware|trojan/i,
      /crack.*password|password.*break/i,
    ]

    for (const pattern of suspiciousDescriptions) {
      if (pattern.test(skillStr)) {
        result.warnings.push("⚡ 描述可能涉及不當用途")
      }
    }

    for (const { pattern, reason } of dangerousPatterns) {
      if (pattern.test(skillStr)) {
        result.issues.push(`⚠️ 危險操作: ${reason}`)
        result.level = this.config.skillCheck.strictMode ? "blocked" : "warning"
      }
    }

    this.auditLog.push(result)
    return result
  }

  // ============================================
  // 插件衝突檢測
  // ============================================

  async checkConflict(
    newPluginName: string,
    existingPlugins: string[],
  ): Promise<{
    hasConflict: boolean
    conflicts: ConflictPattern[]
    blocked: boolean
    notification?: Notification
  }> {
    const conflicts: ConflictPattern[] = []

    // 檢查已知衝突
    for (const pattern of CONFLICT_PATTERNS) {
      if (pattern.pluginA === newPluginName && existingPlugins.includes(pattern.pluginB)) {
        conflicts.push(pattern)
      }
      if (pattern.pluginB === newPluginName && existingPlugins.includes(pattern.pluginA)) {
        conflicts.push(pattern)
      }
    }

    // 檢查名稱相似度衝突（同名前綴）
    for (const existing of existingPlugins) {
      if (existing.startsWith(newPluginName.split("-")[0]) && existing !== newPluginName) {
        conflicts.push({
          pluginA: newPluginName,
          pluginB: existing,
          reason: `同名系列衝突: ${newPluginName} vs ${existing}`,
          severity: "high",
        })
      }
    }

    // 檢查 Hook 衝突
    const hookConflicts = await this.checkHookConflicts(newPluginName, existingPlugins)
    conflicts.push(...hookConflicts)

    const hasConflict = conflicts.length > 0
    const blocked = conflicts.some((c) => c.severity === "critical")

    let notification: Notification | undefined
    if (hasConflict) {
      notification = {
        type: blocked ? "conflict" : "warning",
        title: `插件衝突: ${newPluginName}`,
        message: conflicts.map((c) => `• ${c.pluginA} ↔ ${c.pluginB}: ${c.reason}`).join("\n"),
        timestamp: Date.now(),
        autoAction: blocked ? "blocked" : "disabled",
      }
      this.addNotification(notification)

      log.warn(`Plugin conflict detected: ${newPluginName}`, { conflicts })
    }

    return { hasConflict, conflicts, blocked, notification }
  }

  private async checkHookConflicts(newPlugin: string, existingPlugins: string[]): Promise<ConflictPattern[]> {
    // 檢測多個插件是否使用相同的稀有 Hook
    const rareHooks = ["cli.shutdown", "session.save", "error.handle"]
    const conflicts: ConflictPattern[] = []

    // 這裡應該讀取實際的 Hook 註冊情況
    // 簡化版本：僅檢測名稱衝突
    return conflicts
  }

  // ============================================
  // 衝突白名單管理
  // ============================================

  private conflictWhitelist: Set<string> = new Set()

  allowConflict(pluginA: string, pluginB: string): void {
    const key = [pluginA, pluginB].sort().join("|")
    this.conflictWhitelist.add(key)
    log.info(`Conflict whitelisted: ${key}`)
  }

  isConflictAllowed(pluginA: string, pluginB: string): boolean {
    const key = [pluginA, pluginB].sort().join("|")
    return this.conflictWhitelist.has(key)
  }

  // ============================================
  // 通知系統
  // ============================================

  addNotification(notification: Notification): void {
    this.notifications.unshift(notification)

    // 只保留最近 50 條通知
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50)
    }

    // 記錄到審計日誌
    this.auditLog.push({
      id: `notification:${Date.now()}`,
      type: notification.type === "conflict" ? "plugin" : "system",
      name: notification.title,
      status: notification.autoAction === "blocked" ? "blocked" : "active",
      level: notification.type === "conflict" ? "dangerous" : "warning",
      issues: [notification.message],
      warnings: [],
      lastCheck: notification.timestamp,
    })
  }

  getNotifications(limit?: number): Notification[] {
    return limit ? this.notifications.slice(0, limit) : this.notifications
  }

  getUnreadNotifications(): Notification[] {
    return this.notifications.filter((n) => !n.read)
  }

  clearNotifications(): void {
    this.notifications = []
  }

  // ============================================
  // 完整安全檢查
  // ============================================

  async fullSecurityCheck(): Promise<{
    vpn: SecurityCheckResult
    rdp: SecurityCheckResult
    defense24: SecurityCheckResult
    plugins: SecurityCheckResult[]
    skills: SecurityCheckResult[]
    notifications: Notification[]
  }> {
    const [vpn, rdp, defense24] = await Promise.all([this.checkVPN(), this.checkRDP(), this.checkDefense24()])

    return {
      vpn,
      rdp,
      defense24,
      plugins: [],
      skills: [],
      notifications: this.getNotifications(10),
    }
  }

  // ============================================
  // 設定
  // ============================================

  updateConfig(updates: Partial<typeof this.config>): void {
    Object.assign(this.config, updates)
    this.saveConfig()
    log.info("Security config updated")
  }

  getConfig(): typeof this.config {
    return JSON.parse(JSON.stringify(this.config))
  }

  // ============================================
  // 審計日誌
  // ============================================

  getAuditLog(limit?: number): SecurityCheckResult[] {
    const logs = [...this.auditLog].reverse()
    return limit ? logs.slice(0, limit) : logs
  }

  clearAuditLog(): void {
    this.auditLog = []
    log.debug("Audit log cleared")
  }

  // ============================================
  // 狀態摘要
  // ============================================

  getStatus(): {
    vpn: VPNStatus
    rdp: RDPStatus
    defense24: Defense24Status
    auditLogSize: number
    config: typeof this.config
  } {
    return {
      vpn: this.vpnStatus,
      rdp: this.rdpStatus,
      defense24: this.defense24Status,
      auditLogSize: this.auditLog.length,
      config: this.getConfig(),
    }
  }
}

// ============================================
// 單例
// ============================================

let centerInstance: UnifiedSecurityCenter | null = null

export function getSecurityCenter(dataDir?: string): UnifiedSecurityCenter {
  if (!centerInstance) {
    centerInstance = new UnifiedSecurityCenter(dataDir)
  }
  return centerInstance
}

export function resetSecurityCenter(): void {
  centerInstance = null
}
