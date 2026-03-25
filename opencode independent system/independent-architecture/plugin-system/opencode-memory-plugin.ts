// OpenCode 專屬記憶容器插件
// 整合長期記憶、偏好學習、專案上下文、技能索引於一體

import { join, dirname } from "path"
import { homedir } from "os"
import { readFile, writeFile, mkdir, access, readdir, stat } from "fs/promises"
import { existsSync } from "fs"
import {
  PluginMetadata,
  PluginHooks,
  PluginInstance,
  PluginContext,
  PluginResult,
  PluginAction,
  HealthCheckResult,
} from "./skill-plugin.interface"

interface MemoryBlock {
  id: string
  type: "preference" | "fact" | "decision" | "pattern" | "entity" | "event" | "case" | "lesson"
  content: string
  category: string
  tags: string[]
  importance: number
  confidence: number
  timestamp: number
  lastAccessed: number
  accessCount: number
  source?: string
  metadata?: Record<string, any>
  lifecycle: "core" | "working" | "peripheral"
  decayScore: number
  context?: {
    project?: string
    session?: string
    userId?: string
  }
}

interface UserProfile {
  id: string
  name?: string
  language: string
  style: "concise" | "detailed" | "balanced"
  avoidSimplified: boolean
  skillDescription: "zh-TW" | "zh-CN" | "en"
  detailLevel: "low" | "medium" | "high"
  codeStyle: {
    indent: number
    semicolons: boolean
    quotes: "single" | "double"
    naming: "camelCase" | "snake_case"
  }
  toolPreferences: string[]
  createdAt: number
  updatedAt: number
}

interface ProjectMemory {
  name: string
  path: string
  type: string
  stack: string[]
  decisions: string[]
  patterns: string[]
  issues: { id: string; title: string; solution?: string; timestamp: number }[]
  lastActive: number
  skills: string[]
}

interface SkillIndex {
  name: string
  path: string
  triggers: string[]
  description: string
  lastUsed?: number
  useCount: number
  category: string
}

interface ConversationChunk {
  id: string
  timestamp: number
  role: "user" | "assistant"
  content: string
  summary?: string
  embedded: boolean
}

interface RepairRecord {
  id: string
  title: string
  problem: string
  cause: string
  solution: string
  steps: string[]
  type: "system" | "network" | "config" | "dependency" | "runtime" | "hardware" | "unknown"
  severity: "critical" | "high" | "medium" | "low"
  status: "resolved" | "pending" | "recurring"
  tags: string[]
  timestamp: number
  resolvedAt?: number
  relatedMemories?: string[]
  examples?: string[]
}

export class OpenCodeMemoryPlugin implements PluginHooks {
  private baseDir: string
  private memories: Map<string, MemoryBlock> = new Map()
  private userProfile!: UserProfile
  private projects: Map<string, ProjectMemory> = new Map()
  private skillIndex: Map<string, SkillIndex> = new Map()
  private conversationHistory: ConversationChunk[] = []
  private repairRecords: Map<string, RepairRecord> = new Map()
  private preferencesFile: string
  private memoryFile: string
  private projectFile: string
  private skillFile: string
  private repairFile: string
  private maxChunkLength = 500
  private maxHistoryLength = 100
  private decayInterval: NodeJS.Timeout | null = null
  private maxMemoryAge = 14 * 24 * 60 * 60 * 1000
  private autoSave = true
  private saveInterval: NodeJS.Timeout | null = null

  constructor(baseDir?: string) {
    this.baseDir = baseDir || join(homedir(), ".independent-architecture", "opencode-memory")
    this.preferencesFile = join(this.baseDir, "profile.json")
    this.memoryFile = join(this.baseDir, "memories.json")
    this.projectFile = join(this.baseDir, "projects.json")
    this.skillFile = join(this.baseDir, "skills.json")
    this.repairFile = join(this.baseDir, "repairs.json")
  }

  async onInit(): Promise<void> {
    console.log("[opencode-memory] Initializing OpenCode Memory Container...")
    await this.ensureDirectory()
    await this.loadAll()
    this.initializeDefaultProfile()
    this.scheduleDecay()
    this.scheduleAutoSave()
    console.log(`[opencode-memory] Loaded ${this.memories.size} memories, ${this.projects.size} projects`)
  }

  async onLoad(): Promise<void> {
    console.log("[opencode-memory] OpenCode Memory Plugin loaded")
  }

  async onUnload(): Promise<void> {
    if (this.autoSave) {
      await this.saveAll()
    }
    if (this.decayInterval) {
      clearInterval(this.decayInterval)
    }
    if (this.saveInterval) {
      clearInterval(this.saveInterval)
    }
    console.log("[opencode-memory] OpenCode Memory Plugin unloaded")
  }

  async onProcess(input: string, context: PluginContext): Promise<PluginResult | null> {
    const lower = input.toLowerCase()

    if (this.matchesTriggers(lower, ["memory", "記憶", "remember", "記住"])) {
      return this.handleMemoryCommand(input, context)
    }

    if (this.matchesTriggers(lower, ["profile", "profile", "使用者", "偏好"])) {
      return this.handleProfileCommand(input)
    }

    if (this.matchesTriggers(lower, ["project", "專案", "項目"])) {
      return this.handleProjectCommand(input, context)
    }

    if (this.matchesTriggers(lower, ["skill", "skills", "技能"])) {
      return this.handleSkillCommand(input)
    }

    if (this.matchesTriggers(lower, ["learn", "lesson", "學習"])) {
      return this.handleLearnCommand(input, context)
    }

    if (this.matchesTriggers(lower, ["forget", "刪除", "刪除記憶"])) {
      return this.handleForgetCommand(input)
    }

    if (this.matchesTriggers(lower, ["stats", "統計", "狀態"])) {
      return this.showStats()
    }

    if (this.matchesTriggers(lower, ["conversation", "對話", "history", "歷史"])) {
      return this.handleHistoryCommand(input)
    }

    if (this.matchesTriggers(lower, ["repair", "fix", "維修", "修復"])) {
      return this.handleRepairCommand(input, context)
    }

    return null
  }

  async onHealthCheck(): Promise<HealthCheckResult> {
    const memCount = this.memories.size
    const projCount = this.projects.size
    const skillCount = this.skillIndex.size
    const avgConfidence = this.calculateAverageConfidence()

    const storageSize = this.estimateStorageSize()

    return {
      status: memCount > 0 ? "healthy" : "warning",
      message: `OpenCode Memory: ${memCount} memories, ${projCount} projects, ${skillCount} skills indexed`,
      confidence: avgConfidence,
      metrics: {
        memories: memCount,
        projects: projCount,
        skills: skillCount,
        conversations: this.conversationHistory.length,
        avgConfidence,
        storageBytes: storageSize,
      },
    }
  }

  private handleMemoryCommand(input: string, context?: PluginContext): PluginResult {
    const lower = input.toLowerCase()

    if (lower.includes("recall") || lower.includes("搜") || lower.includes("找") || lower.includes("search")) {
      return this.recall(input, context)
    }

    if (lower.includes("store") || lower.includes("儲存") || lower.includes("記住")) {
      return this.store(input, context)
    }

    if (lower.includes("list") || lower.includes("列表") || lower.includes("全部")) {
      return this.listMemories(input)
    }

    return this.showMemoryHelp()
  }

  private recall(input: string, context?: PluginContext): PluginResult {
    const query = this.extractQuery(input) || this.extractTopic(input)
    if (!query) {
      return {
        success: false,
        output: "請提供搜尋關鍵詞，例如: /memory recall 關於這個專案的技術架構",
        confidence: 0.9,
      }
    }

    const results = this.searchMemories(query, {
      limit: 10,
      type: this.detectMemoryType(input),
      category: context?.project?.type,
      minConfidence: 0.3,
    })

    if (results.length === 0) {
      return {
        success: true,
        output: `🔍 沒有找到關於「${query}」的記憶\n\n嘗試：\n- /memory store <內容> - 儲存新記憶\n- /memory learn - 從對話中學習`,
        confidence: 0.5,
      }
    }

    let output = `🔍 找到 ${results.length} 個相關記憶:\n\n`

    for (const mem of results.slice(0, 5)) {
      const typeIcon = this.getTypeIcon(mem.type)
      const age = this.getRelativeTime(mem.timestamp)
      output += `${typeIcon} [${mem.type}] ${mem.content.substring(0, 100)}${mem.content.length > 100 ? "..." : ""}\n`
      output += `   信心: ${(mem.confidence * 100).toFixed(0)}% | 存取: ${mem.accessCount}次 | ${age}\n`
      if (mem.tags.length > 0) {
        output += `   標籤: ${mem.tags.join(", ")}\n`
      }
      output += "\n"
    }

    return {
      success: true,
      output,
      confidence: results[0]?.confidence || 0.7,
      actions: results.slice(0, 3).map((r) => ({
        type: "recall",
        target: r.id,
        params: { content: r.content },
      })),
    }
  }

  private store(input: string, context?: PluginContext): PluginResult {
    let content = this.extractMemoryContent(input)
    if (!content) {
      return {
        success: false,
        output: "請提供要儲存的內容，例如: /memory store 這個專案使用 React 框架",
        confidence: 0.9,
      }
    }

    const type = this.detectMemoryType(input) || "fact"
    const tags = this.extractTags(input)
    const category = context?.project?.type || "general"

    const block = this.createMemoryBlock(content, type, category, tags, context)

    this.memories.set(block.id, block)
    this.saveAsync()

    let output = `✅ 記憶已儲存\n\n`
    output += `ID: ${block.id}\n`
    output += `類型: ${this.getTypeIcon(block.type)} ${block.type}\n`
    output += `內容: ${block.content.substring(0, 80)}${block.content.length > 80 ? "..." : ""}\n`
    output += `信心度: ${(block.confidence * 100).toFixed(0)}%\n`
    output += `生命週期: ${block.lifecycle}\n`

    return {
      success: true,
      output,
      confidence: block.confidence,
      actions: [{ type: "store", target: block.id, params: { content: block.content } }],
    }
  }

  private listMemories(input: string): PluginResult {
    const type = this.detectMemoryType(input)
    const category = this.extractCategory(input)

    let memories = Array.from(this.memories.values())

    if (type) {
      memories = memories.filter((m) => m.type === type)
    }
    if (category) {
      memories = memories.filter((m) => m.category === category)
    }

    memories.sort((a, b) => b.importance - a.importance)

    if (memories.length === 0) {
      return {
        success: true,
        output: "目前沒有記憶",
        confidence: 0.9,
      }
    }

    let output = `📝 記憶列表 (${memories.length} 個)\n\n`

    for (const mem of memories.slice(0, 10)) {
      const typeIcon = this.getTypeIcon(mem.type)
      output += `${typeIcon} [${mem.id}] ${mem.content.substring(0, 60)}...\n`
    }

    if (memories.length > 10) {
      output += `\n... 還有 ${memories.length - 10} 個記憶`
    }

    return {
      success: true,
      output,
      confidence: 0.9,
    }
  }

  private handleProfileCommand(input: string): PluginResult {
    const lower = input.toLowerCase()

    if (lower.includes("show") || lower.includes("show") || lower.includes("顯示") || lower.includes("查看")) {
      return this.showProfile()
    }

    if (lower.includes("set") || lower.includes("update") || lower.includes("設定") || lower.includes("更新")) {
      return this.updateProfile(input)
    }

    return this.showProfile()
  }

  private showProfile(): PluginResult {
    const p = this.userProfile

    let output = `👤 OpenCode 使用者設定\n\n`
    output += `基本資訊:\n`
    output += `  語言: ${p.language}\n`
    output += `  風格: ${p.style}\n`
    output += `  避免簡體: ${p.avoidSimplified ? "是" : "否"}\n`
    output += `  詳細程度: ${p.detailLevel}\n\n`

    output += `程式碼風格:\n`
    output += `  縮排: ${p.codeStyle.indent} 空格\n`
    output += `  分號: ${p.codeStyle.semicolons ? "是" : "否"}\n`
    output += `  引號: ${p.codeStyle.quotes}\n`
    output += `  命名: ${p.codeStyle.naming}\n\n`

    output += `常用工具: ${p.toolPreferences.length > 0 ? p.toolPreferences.join(", ") : "無"}\n`
    output += `建立時間: ${new Date(p.createdAt).toLocaleString()}\n`
    output += `更新時間: ${new Date(p.updatedAt).toLocaleString()}\n`

    return {
      success: true,
      output,
      confidence: 0.95,
    }
  }

  private updateProfile(input: string): PluginResult {
    const updates: Partial<UserProfile> = {}

    if (input.includes("language") || input.includes("語言")) {
      const match = input.match(/language[:\s]*(\S+)/i) || input.match(/語言[:\s]*(\S+)/)
      if (match) updates.language = match[1]
    }
    if (input.includes("style") || input.includes("風格")) {
      const match = input.match(/style[:\s]*(\S+)/i) || input.match(/風格[:\s]*(\S+)/)
      if (match) updates.style = match[1] as any
    }
    if (input.includes("simplified") || input.includes("簡體")) {
      updates.avoidSimplified = !input.includes("不") && !input.includes("don't")
    }

    Object.assign(this.userProfile, updates, { updatedAt: Date.now() })
    this.saveAsync()

    return {
      success: true,
      output: `✅ 偏好已更新\n\n${JSON.stringify(updates, null, 2)}`,
      confidence: 0.9,
    }
  }

  private handleProjectCommand(input: string, context?: PluginContext): PluginResult {
    const lower = input.toLowerCase()

    if (lower.includes("list") || lower.includes("列表")) {
      return this.listProjects()
    }

    if (lower.includes("add") || lower.includes("新增")) {
      return this.addProject(input, context)
    }

    if (lower.includes("context") || lower.includes("上下文")) {
      return this.getProjectContext(context)
    }

    return this.listProjects()
  }

  private listProjects(): PluginResult {
    const projects = Array.from(this.projects.values())

    if (projects.length === 0) {
      return {
        success: true,
        output: "目前沒有記錄的專案",
        confidence: 0.9,
      }
    }

    let output = `📁 專案列表 (${projects.length} 個)\n\n`

    for (const proj of projects) {
      output += `📂 ${proj.name} (${proj.type})\n`
      output += `   路徑: ${proj.path}\n`
      output += `   技術棧: ${proj.stack.join(", ")}\n`
      output += `   決策: ${proj.decisions.length} 個\n`
      output += `   問題: ${proj.issues.length} 個\n`
      output += `   最後活躍: ${this.getRelativeTime(proj.lastActive)}\n\n`
    }

    return {
      success: true,
      output,
      confidence: 0.9,
    }
  }

  private addProject(input: string, context?: PluginContext): PluginResult {
    const name = context?.project?.name || this.extractProjectName(input)
    if (!name) {
      return {
        success: false,
        output: "請提供專案名稱，例如: /memory project add my-project --type node --stack react,typescript",
        confidence: 0.8,
      }
    }

    const project: ProjectMemory = {
      name,
      path: context?.project?.name ? `/${name}` : "/",
      type: context?.project?.type || this.extractType(input),
      stack: context?.project?.stack || this.extractStack(input),
      decisions: [],
      patterns: [],
      issues: [],
      lastActive: Date.now(),
      skills: [],
    }

    this.projects.set(name, project)
    this.saveAsync()

    return {
      success: true,
      output: `✅ 專案已新增: ${name}\n\n類型: ${project.type}\n技術棧: ${project.stack.join(", ")}`,
      confidence: 0.95,
    }
  }

  private getProjectContext(context?: PluginContext): PluginResult {
    const name = context?.project?.name
    if (!name) {
      return {
        success: false,
        output: "請指定專案名稱或在工作目錄中執行",
        confidence: 0.8,
      }
    }

    const project = this.projects.get(name)
    if (!project) {
      return {
        success: true,
        output: `尚未記錄專案 ${name}，使用 /memory project add 新增`,
        confidence: 0.7,
      }
    }

    project.lastActive = Date.now()

    let output = `📋 專案上下文: ${name}\n\n`
    output += `類型: ${project.type}\n`
    output += `技術棧: ${project.stack.join(" > ")}\n\n`

    if (project.decisions.length > 0) {
      output += `💡 重要決策:\n`
      for (const d of project.decisions.slice(-5)) {
        output += `  - ${d}\n`
      }
      output += "\n"
    }

    if (project.patterns.length > 0) {
      output += `🔄 已知模式:\n`
      for (const p of project.patterns.slice(-5)) {
        output += `  - ${p}\n`
      }
      output += "\n"
    }

    if (project.issues.length > 0) {
      output += `🐛 記錄的問題:\n`
      for (const i of project.issues.slice(-3)) {
        output += `  - ${i.title}${i.solution ? ` → ${i.solution}` : ""}\n`
      }
    }

    return {
      success: true,
      output,
      confidence: 0.9,
    }
  }

  private handleSkillCommand(input: string): PluginResult {
    const lower = input.toLowerCase()

    if (lower.includes("list") || lower.includes("列表")) {
      return this.listSkills()
    }

    if (lower.includes("index") || lower.includes("索引")) {
      return this.indexSkills()
    }

    if (lower.includes("find") || lower.includes("找")) {
      return this.findSkill(input)
    }

    return this.listSkills()
  }

  private listSkills(): PluginResult {
    const skills = Array.from(this.skillIndex.values())

    if (skills.length === 0) {
      return {
        success: true,
        output: "技能索引為空，使用 /memory skill index 建立索引",
        confidence: 0.9,
      }
    }

    let output = `🛠️ 技能索引 (${skills.length} 個)\n\n`

    for (const skill of skills.sort((a, b) => b.useCount - a.useCount).slice(0, 15)) {
      const lastUsed = skill.lastUsed ? this.getRelativeTime(skill.lastUsed) : "從未"
      output += `📌 ${skill.name}\n`
      output += `   ${skill.description}\n`
      output += `   使用次數: ${skill.useCount} | 最後: ${lastUsed}\n`
      output += `   觸發: ${skill.triggers.slice(0, 3).join(", ")}\n\n`
    }

    return {
      success: true,
      output,
      confidence: 0.9,
    }
  }

  private indexSkills(skillDirs?: string[]): PluginResult {
    const dirs = skillDirs || [
      join(this.baseDir, "..", "skill"),
      "/home/reamaster/opencode-manager/opencode independent system/.opencode/skill",
      "/home/reamaster/opencode-manager/opencode independent system/independent-architecture/extensions",
    ]

    this.skillIndex.clear()
    let count = 0

    for (const dir of dirs) {
      if (!existsSync(dir)) continue

      const indexDir = async (d: string) => {
        try {
          const entries = await readdir(d)
          for (const entry of entries) {
            const fullPath = join(d, entry)
            const entryStat = await stat(fullPath)
            if (entryStat.isDirectory()) {
              const skillFile = join(fullPath, "SKILL.md")
              if (existsSync(skillFile)) {
                const content = await readFile(skillFile, "utf-8")
                const skill = this.parseSkillFile(entry, skillFile, content)
                this.skillIndex.set(entry, skill)
                count++
              }
              await indexDir(fullPath)
            }
          }
        } catch (e) {
          console.warn(`[opencode-memory] Failed to index ${d}:`, e)
        }
      }

      indexDir(dir)
    }

    this.saveAsync()

    return {
      success: true,
      output: `✅ 已建立技能索引\n\n索引了 ${count} 個技能`,
      confidence: 0.95,
    }
  }

  private findSkill(input: string): PluginResult {
    const query = this.extractQuery(input) || this.extractTopic(input)
    if (!query) {
      return {
        success: false,
        output: "請提供搜尋關鍵詞，例如: /memory skill find discord",
        confidence: 0.8,
      }
    }

    const results = Array.from(this.skillIndex.values()).filter(
      (s) => s.name.includes(query) || s.description.includes(query) || s.triggers.some((t) => t.includes(query)),
    )

    if (results.length === 0) {
      return {
        success: true,
        output: `沒有找到關於「${query}」的技能`,
        confidence: 0.5,
      }
    }

    let output = `🔍 找到 ${results.length} 個相關技能:\n\n`
    for (const skill of results) {
      output += `📌 ${skill.name} - ${skill.description}\n`
      output += `   觸發: ${skill.triggers.join(", ")}\n\n`
    }

    return {
      success: true,
      output,
      confidence: 0.8,
    }
  }

  private handleLearnCommand(input: string, context?: PluginContext): PluginResult {
    const lower = input.toLowerCase()

    let content = this.extractLearnContent(input)
    if (!content && context) {
      content = this.extractFromRecentConversation()
    }

    if (!content) {
      return {
        success: true,
        output: `📚 學習模式\n\n使用方式:\n/memory learn <內容> - 儲存為學習記憶\n/memory learn from-context - 從最近對話學習\n/memory learn pattern <模式描述> - 記錄為模式`,
        confidence: 0.9,
      }
    }

    const type = lower.includes("pattern") || lower.includes("模式") ? "pattern" : "lesson"
    const tags = ["learned", type]
    if (context?.project?.name) tags.push(context.project.name)

    const block = this.createMemoryBlock(content, type, "learning", tags, context)
    this.memories.set(block.id, block)
    this.saveAsync()

    return {
      success: true,
      output: `📚 已學習: ${block.content.substring(0, 80)}...\n\n類型: ${type}\n信心度: ${(block.confidence * 100).toFixed(0)}%`,
      confidence: 0.9,
    }
  }

  private handleForgetCommand(input: string): PluginResult {
    const id = this.extractMemoryId(input)

    if (!id && input.includes("all")) {
      this.memories.clear()
      this.saveAsync()
      return {
        success: true,
        output: "✅ 已清除所有記憶",
        confidence: 0.95,
      }
    }

    if (!id) {
      return {
        success: false,
        output: "請提供記憶 ID，例如: /memory forget mem-xxx 或 /memory forget all",
        confidence: 0.8,
      }
    }

    const deleted = this.memories.delete(id)
    if (deleted) {
      this.saveAsync()
      return {
        success: true,
        output: `✅ 已刪除記憶: ${id}`,
        confidence: 0.95,
      }
    }

    return {
      success: false,
      output: `找不到記憶: ${id}`,
      confidence: 0.8,
    }
  }

  private handleHistoryCommand(input: string): PluginResult {
    const lower = input.toLowerCase()

    if (lower.includes("clear") || lower.includes("清除")) {
      this.conversationHistory = []
      return {
        success: true,
        output: "✅ 對話歷史已清除",
        confidence: 0.95,
      }
    }

    const limit = parseInt(input.match(/last\s*(\d+)/i)?.[1] || "10")
    const recent = this.conversationHistory.slice(-limit)

    if (recent.length === 0) {
      return {
        success: true,
        output: "對話歷史為空",
        confidence: 0.9,
      }
    }

    let output = `💬 對話歷史 (最近 ${recent.length} 條)\n\n`

    for (const chunk of recent) {
      const role = chunk.role === "user" ? "👤" : "🤖"
      output += `${role} ${chunk.content.substring(0, 100)}${chunk.content.length > 100 ? "..." : ""}\n\n`
    }

    return {
      success: true,
      output,
      confidence: 0.9,
    }
  }

  private showStats(): PluginResult {
    const byType: Record<string, number> = {}
    const byLifecycle: Record<string, number> = { core: 0, working: 0, peripheral: 0 }
    let totalAccess = 0
    let avgDecay = 0

    for (const mem of this.memories.values()) {
      byType[mem.type] = (byType[mem.type] || 0) + 1
      byLifecycle[mem.lifecycle]++
      totalAccess += mem.accessCount
      avgDecay += mem.decayScore
    }

    avgDecay = this.memories.size > 0 ? avgDecay / this.memories.size : 1

    let output = `📊 OpenCode 記憶統計\n\n`
    output += `記憶總數: ${this.memories.size}\n`
    output += `專案記錄: ${this.projects.size}\n`
    output += `技能索引: ${this.skillIndex.size}\n`
    output += `對話歷史: ${this.conversationHistory.length}\n\n`

    output += `📈 按類型:\n`
    for (const [type, count] of Object.entries(byType)) {
      output += `  ${this.getTypeIcon(type)} ${type}: ${count}\n`
    }
    output += "\n"

    output += `🔄 按生命週期:\n`
    output += `  💎 Core: ${byLifecycle.core}\n`
    output += `  ⚡ Working: ${byLifecycle.working}\n`
    output += `  💨 Peripheral: ${byLifecycle.peripheral}\n\n`

    output += `📉 平均存取次數: ${(totalAccess / (this.memories.size || 1)).toFixed(1)}\n`
    output += `📉 衰減分數: ${(avgDecay * 100).toFixed(1)}%\n`
    output += `💾 預估儲存: ${(this.estimateStorageSize() / 1024).toFixed(1)} KB\n`

    return {
      success: true,
      output,
      confidence: 0.95,
    }
  }

  private showMemoryHelp(): PluginResult {
    let output = `🧠 OpenCode 記憶容器\n\n`

    output += `📝 記憶指令:\n`
    output += `  /memory recall <關鍵詞>  - 搜尋記憶\n`
    output += `  /memory store <內容>    - 儲存新記憶\n`
    output += `  /memory list [類型]     - 列出記憶\n`
    output += `  /memory forget <id>      - 刪除記憶\n`
    output += `  /memory stats           - 統計資訊\n\n`

    output += `👤 偏好指令:\n`
    output += `  /profile show           - 查看設定\n`
    output += `  /profile set language=繁體中文 - 更新設定\n\n`

    output += `📁 專案指令:\n`
    output += `  /memory project list    - 專案列表\n`
    output += `  /memory project add     - 新增專案\n`
    output += `  /memory project context - 專案上下文\n\n`

    output += `🛠️ 技能指令:\n`
    output += `  /memory skill list      - 技能列表\n`
    output += `  /memory skill index     - 建立索引\n`
    output += `  /memory skill find <關鍵詞> - 搜尋技能\n\n`

    output += `📚 學習指令:\n`
    output += `  /memory learn <內容>    - 學習新知識\n`
    output += `  /memory learn pattern <模式> - 記錄模式\n`

    return {
      success: true,
      output,
      confidence: 0.9,
    }
  }

  private searchMemories(
    query: string,
    options: { limit?: number; type?: string; category?: string; minConfidence?: number } = {},
  ): MemoryBlock[] {
    const { limit = 10, type, category, minConfidence = 0.3 } = options
    const queryLower = query.toLowerCase()

    let results = Array.from(this.memories.values())

    if (type) results = results.filter((m) => m.type === type)
    if (category) results = results.filter((m) => m.category === category)

    results = results
      .map((mem) => ({
        mem,
        score: this.calculateRelevance(mem, queryLower),
      }))
      .filter((r) => r.score > minConfidence)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => {
        r.mem.accessCount++
        r.mem.lastAccessed = Date.now()
        return r.mem
      })

    return results
  }

  private calculateRelevance(mem: MemoryBlock, query: string): number {
    let score = 0
    const contentLower = mem.content.toLowerCase()

    if (contentLower.includes(query)) score += 0.4
    if (mem.tags.some((t) => query.includes(t.toLowerCase()))) score += 0.2
    if (mem.category.includes(query)) score += 0.1

    score += mem.confidence * 0.2
    score += mem.importance * 0.15
    score *= mem.decayScore

    return Math.min(1, score)
  }

  private createMemoryBlock(
    content: string,
    type: MemoryBlock["type"],
    category: string,
    tags: string[],
    context?: PluginContext,
  ): MemoryBlock {
    return {
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      content,
      category,
      tags,
      importance: this.inferImportance(content, type),
      confidence: 0.7,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
      source: "manual",
      metadata: {},
      lifecycle: this.assignLifecycle(this.inferImportance(content, type)),
      decayScore: 1,
      context: context?.project
        ? {
            project: context.project.name,
            userId: context.user?.id,
          }
        : undefined,
    }
  }

  private inferImportance(content: string, type: string): number {
    const lower = content.toLowerCase()
    if (type === "preference" || type === "decision") return 0.9
    if (lower.includes("important") || lower.includes("重要")) return 0.85
    if (lower.includes("never") || lower.includes("always") || lower.includes("從不") || lower.includes("總是"))
      return 0.8
    if (content.length > 200) return 0.6
    return 0.5
  }

  private assignLifecycle(importance: number): "core" | "working" | "peripheral" {
    if (importance >= 0.8) return "core"
    if (importance >= 0.5) return "working"
    return "peripheral"
  }

  private scheduleDecay(): void {
    this.decayInterval = setInterval(
      () => {
        const now = Date.now()
        for (const [id, mem] of this.memories) {
          const age = now - mem.lastAccessed

          if (age > this.maxMemoryAge) {
            this.memories.delete(id)
            continue
          }

          mem.decayScore = Math.max(0.1, 1 - (age / this.maxMemoryAge) * 0.5)

          if (mem.lifecycle === "peripheral" && mem.decayScore < 0.3) {
            mem.importance = Math.max(0.1, mem.importance - 0.05)
            mem.lifecycle = this.assignLifecycle(mem.importance)
          }
        }
      },
      60 * 60 * 1000,
    )
  }

  private scheduleAutoSave(): void {
    this.saveInterval = setInterval(
      () => {
        this.saveAll()
      },
      5 * 60 * 1000,
    )
  }

  private saveAsync(): void {
    setTimeout(() => this.saveAll(), 100)
  }

  private async saveAll(): Promise<void> {
    try {
      await this.saveJson(this.memoryFile, this.simpleSerialize(this.memories))
      await this.saveJson(this.preferencesFile, this.userProfile)
      await this.saveJson(this.projectFile, this.simpleSerialize(this.projects))
      await this.saveJson(this.skillFile, this.simpleSerialize(this.skillIndex))
      await this.saveJson(this.repairFile, this.simpleSerialize(this.repairRecords))
    } catch (e) {
      console.error("[opencode-memory] Save failed:", e)
    }
  }

  private async saveJson(file: string, data: any): Promise<void> {
    const content = JSON.stringify(data)
    await writeFile(file, content, "utf-8")
  }

  private simpleSerialize(map: Map<string, any>): any[] {
    return Array.from(map.entries())
  }

  private async loadAll(): Promise<void> {
    try {
      if (existsSync(this.memoryFile)) {
        const data = await this.loadJson(this.memoryFile)
        if (data && Array.isArray(data)) {
          this.memories = new Map(data)
        }
      }

      if (existsSync(this.preferencesFile)) {
        const data = await this.loadJson(this.preferencesFile)
        if (data) this.userProfile = data
      }

      if (existsSync(this.projectFile)) {
        const data = await this.loadJson(this.projectFile)
        if (data && Array.isArray(data)) {
          this.projects = new Map(data)
        }
      }

      if (existsSync(this.skillFile)) {
        const data = await this.loadJson(this.skillFile)
        if (data && Array.isArray(data)) {
          this.skillIndex = new Map(data)
        }
      }

      if (existsSync(this.repairFile)) {
        const data = await this.loadJson(this.repairFile)
        if (data && Array.isArray(data)) {
          this.repairRecords = new Map(data)
        }
      }
    } catch (e) {
      console.error("[opencode-memory] Load failed:", e)
    }
  }

  private async loadJson(file: string): Promise<any> {
    try {
      const data = await readFile(file, "utf-8")
      return JSON.parse(data)
    } catch {
      return null
    }
  }

  private async ensureDirectory(): Promise<void> {
    if (!existsSync(this.baseDir)) {
      await mkdir(this.baseDir, { recursive: true })
    }
  }

  private initializeDefaultProfile(): void {
    if (!this.userProfile) {
      this.userProfile = {
        id: "default",
        language: "繁體中文",
        style: "balanced",
        avoidSimplified: true,
        skillDescription: "zh-TW",
        detailLevel: "medium",
        codeStyle: {
          indent: 2,
          semicolons: false,
          quotes: "double",
          naming: "camelCase",
        },
        toolPreferences: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    }
  }

  private parseSkillFile(name: string, path: string, content: string): SkillIndex {
    const triggers: string[] = []
    const descMatch = content.match(/description:\s*"?([^"\n]+)"?/i)
    const catMatch = content.match(/category:\s*"?([^"\n]+)"?/i)

    const triggerMatch = content.match(/triggers?:\s*\[([^\]]+)\]/i)
    if (triggerMatch) {
      triggers.push(...triggerMatch[1].split(",").map((t) => t.trim().replace(/["']/g, "")))
    }

    const lines = content.split("\n")
    for (const line of lines) {
      const cmdMatch = line.match(/^\s*[-/]\s*`([^`]+)`/)
      if (cmdMatch && !triggers.includes(cmdMatch[1])) {
        triggers.push(cmdMatch[1])
      }
    }

    return {
      name,
      path,
      triggers: triggers.length > 0 ? triggers : [name],
      description: descMatch?.[1] || "No description",
      useCount: 0,
      category: catMatch?.[1] || "utility",
    }
  }

  private matchesTriggers(lower: string, triggers: string[]): boolean {
    return triggers.some((t) => lower.includes(t.toLowerCase()))
  }

  private extractQuery(input: string): string {
    const patterns = [
      /recall\s+(?:about|for|搜尋|找|about)[:\s]*(.+)/i,
      /search\s+(?:for|找)[:\s]*(.+)/i,
      /find\s+(?:about|找)[:\s]*(.+)/i,
      /(?:搜尋|找|關於)\s*(.+)/,
    ]
    for (const p of patterns) {
      const match = input.match(p)
      if (match) return match[1].trim()
    }
    return input.replace(/memory|recall|search|find|搜|找/gi, "").trim()
  }

  private extractTopic(input: string): string {
    return input.replace(/memory|skill|project|profile|lesson|learn|stats|列表|搜|找|顯示/gi, "").trim()
  }

  private extractMemoryContent(input: string): string {
    const patterns = [
      /store[:\s]+(.+)/i,
      /記住[:\s]*(.+)/,
      /記得[:\s]*(.+)/,
      /remember[:\s]*(.+)/i,
      /(?:儲存|新增)[:\s]*(.+)/,
    ]
    for (const p of patterns) {
      const match = input.match(p)
      if (match) return match[1].trim()
    }
    return input.replace(/memory|store|記住|儲存/gi, "").trim()
  }

  private extractMemoryId(input: string): string | null {
    const match = input.match(/mem-[a-z0-9-]+/)
    return match ? match[0] : null
  }

  private extractTags(input: string): string[] {
    const matches = input.match(/#[a-zA-Z0-9_]+/g)
    return matches ? matches.map((t) => t.slice(1)) : []
  }

  private extractCategory(input: string): string | null {
    const match = input.match(/category[:\s]*(\S+)/i)
    return match ? match[1] : null
  }

  private extractProjectName(input: string): string | null {
    const match = input.match(/add\s+(\S+)/i) || input.match(/專案[:\s]*(\S+)/)
    return match ? match[1] : null
  }

  private extractType(input: string): string {
    const match = input.match(/type[:\s]*(\S+)/i)
    return match ? match[1] : "unknown"
  }

  private extractStack(input: string): string[] {
    const match = input.match(/stack[:\s]*([^\s]+)/i)
    return match ? match[1].split(",") : []
  }

  private extractLearnContent(input: string): string {
    const patterns = [/learn\s+(?:from[- ]context|from[- ]conversation)/i, /learn\s+pattern\s+(.+)/i, /學習[:\s]*(.+)/]
    for (const p of patterns) {
      const match = input.match(p)
      if (match) return match[1].trim()
    }
    return input.replace(/memory|learn|lesson|學習/gi, "").trim()
  }

  private extractFromRecentConversation(): string {
    const recent = this.conversationHistory.slice(-5)
    if (recent.length < 2) return ""

    return recent
      .filter((c) => c.role === "assistant")
      .map((c) => c.content)
      .join(" ")
      .substring(0, 500)
  }

  private detectMemoryType(input: string): MemoryBlock["type"] | null {
    const lower = input.toLowerCase()
    if (lower.includes("preference") || lower.includes("偏好")) return "preference"
    if (lower.includes("fact") || lower.includes("事實")) return "fact"
    if (lower.includes("decision") || lower.includes("決定")) return "decision"
    if (lower.includes("pattern") || lower.includes("模式")) return "pattern"
    if (lower.includes("entity") || lower.includes("實體")) return "entity"
    if (lower.includes("event") || lower.includes("事件")) return "event"
    if (lower.includes("case") || lower.includes("案例")) return "case"
    if (lower.includes("lesson") || lower.includes("learn") || lower.includes("學習")) return "lesson"
    return null
  }

  private getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      preference: "⚙️",
      fact: "📖",
      decision: "⚖️",
      pattern: "🔄",
      entity: "🏷️",
      event: "📅",
      case: "📁",
      lesson: "📚",
    }
    return icons[type] || "📝"
  }

  private getRelativeTime(timestamp: number): string {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "剛剛"
    if (minutes < 60) return `${minutes} 分鐘前`
    if (hours < 24) return `${hours} 小時前`
    if (days < 30) return `${days} 天前`
    return new Date(timestamp).toLocaleDateString()
  }

  private calculateAverageConfidence(): number {
    if (this.memories.size === 0) return 0.9
    let sum = 0
    for (const mem of this.memories.values()) {
      sum += mem.confidence
    }
    return sum / this.memories.size
  }

  private estimateStorageSize(): number {
    const memSize = JSON.stringify(Array.from(this.memories.values())).length
    const projSize = JSON.stringify(Array.from(this.projects.values())).length
    const skillSize = JSON.stringify(Array.from(this.skillIndex.values())).length
    const repairSize = JSON.stringify(Array.from(this.repairRecords.values())).length
    return memSize + projSize + skillSize + repairSize
  }

  public addConversationChunk(role: "user" | "assistant", content: string): void {
    this.conversationHistory.push({
      id: `conv-${Date.now()}`,
      timestamp: Date.now(),
      role,
      content,
      embedded: false,
    })

    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength)
    }
  }

  public getUserProfile(): UserProfile {
    return this.userProfile
  }

  public getProject(name: string): ProjectMemory | undefined {
    return this.projects.get(name)
  }

  private handleRepairCommand(input: string, context?: PluginContext): PluginResult {
    const lower = input.toLowerCase()

    if (lower.includes("list") || lower.includes("列表")) {
      return this.listRepairs()
    }

    if (lower.includes("add") || lower.includes("新增") || lower.includes("記錄")) {
      return this.addRepair(input)
    }

    if (lower.includes("find") || lower.includes("搜尋") || lower.includes("找")) {
      return this.searchRepairs(input)
    }

    if (lower.includes("example") || lower.includes("範例")) {
      return this.showRepairExamples()
    }

    if (lower.includes("help") || lower.includes("說明")) {
      return this.showRepairHelp()
    }

    return this.listRepairs()
  }

  private listRepairs(): PluginResult {
    const repairs = Array.from(this.repairRecords.values())

    if (repairs.length === 0) {
      return {
        success: true,
        output: "目前沒有維修記錄\n\n使用 /repair add 記錄維修方案",
        confidence: 0.9,
      }
    }

    const sorted = repairs.sort((a, b) => b.timestamp - a.timestamp)
    let output = "🔧 維修記錄列表 (" + repairs.length + "筆)\n\n"

    for (const r of sorted.slice(0, 10)) {
      const icon = r.status === "resolved" ? "✅" : r.status === "pending" ? "⏳" : "🔄"
      const sevIcon =
        r.severity === "critical" ? "🔴" : r.severity === "high" ? "🟠" : r.severity === "medium" ? "🟡" : "🟢"
      output += icon + " " + sevIcon + " [" + r.id + "] " + r.title + "\n"
      output += "   問題: " + r.problem.substring(0, 50) + (r.problem.length > 50 ? "..." : "") + "\n"
      output += "   類型: " + r.type + " | 時間: " + this.getRelativeTime(r.timestamp) + "\n\n"
    }

    if (sorted.length > 10) {
      output += "... 還有 " + (sorted.length - 10) + " 筆記錄"
    }

    return {
      success: true,
      output,
      confidence: 0.9,
    }
  }

  private addRepair(input: string): PluginResult {
    const title = this.extractRepairTitle(input)
    const problem = this.extractRepairProblem(input)
    const solution = this.extractRepairSolution(input)
    const type = this.extractRepairType(input)
    const severity = this.extractRepairSeverity(input)

    if (!title && !problem) {
      return {
        success: false,
        output:
          "請提供維修標題或問題描述\n\n/memory repair add --title 標題 --problem 問題 --solution 解決方案 --type system --severity high",
        confidence: 0.8,
      }
    }

    const record: RepairRecord = {
      id: "fix-" + Date.now(),
      title: title || problem.substring(0, 30),
      problem: problem,
      cause: this.extractRepairCause(input),
      solution: solution,
      steps: this.extractRepairSteps(input),
      type: type || "unknown",
      severity: severity || "medium",
      status: solution ? "resolved" : "pending",
      tags: this.extractTags(input),
      timestamp: Date.now(),
      resolvedAt: solution ? Date.now() : undefined,
      examples: this.extractRepairExamples(input),
    }

    this.repairRecords.set(record.id, record)
    this.saveAsync()

    let output = "✅ 維修記錄已新增\n\n"
    output += "ID: " + record.id + "\n"
    output += "標題: " + record.title + "\n"
    output += "問題: " + record.problem + "\n"
    if (record.solution) {
      output += "解決方案: " + record.solution + "\n"
    }
    output += "類型: " + record.type + "\n"
    output += "嚴重性: " + record.severity + "\n"
    output += "狀態: " + record.status + "\n"

    return {
      success: true,
      output,
      confidence: 0.95,
      actions: [{ type: "store", target: record.id, params: { title: record.title } }],
    }
  }

  private searchRepairs(input: string): PluginResult {
    const query = this.extractQuery(input)
    if (!query) {
      return {
        success: false,
        output: "請提供搜尋關鍵詞\n/memory repair find 關鍵詞",
        confidence: 0.8,
      }
    }

    const results = Array.from(this.repairRecords.values()).filter(
      (r) =>
        r.title.includes(query) ||
        r.problem.includes(query) ||
        r.solution.includes(query) ||
        r.tags.some((t) => t.includes(query)),
    )

    if (results.length === 0) {
      return {
        success: true,
        output: "沒有找到關於「" + query + "」的維修記錄",
        confidence: 0.5,
      }
    }

    let output = "🔧 找到 " + results.length + " 筆記錄:\n\n"

    for (const r of results.slice(0, 5)) {
      output += "📌 [" + r.id + "] " + r.title + "\n"
      output += "   問題: " + r.problem + "\n"
      if (r.solution) {
        output += "   解決: " + r.solution + "\n"
      }
      if (r.examples && r.examples.length > 0) {
        output += "   範例:\n"
        for (const ex of r.examples.slice(0, 2)) {
          output += "   - " + ex.substring(0, 60) + (ex.length > 60 ? "..." : "") + "\n"
        }
      }
      output += "\n"
    }

    return {
      success: true,
      output,
      confidence: 0.8,
    }
  }

  private showRepairExamples(): PluginResult {
    let output = "📚 維修記錄範例 (AI學習素材)\n\n"

    const examples = [
      {
        title: "網路連線失敗",
        problem: "curl: (7) Failed to connect to example.com port 443",
        cause: "防火牆阻止或DNS解析失敗",
        solution: "檢查防火牆規則或更新DNS設定",
        steps: ["檢查網路連線", "測試DNS解析", "檢查防火牆規則"],
        type: "network",
        severity: "high",
      },
      {
        title: "依賴安裝失敗",
        problem: "npm ERR! code ENOENT package not found",
        cause: "模組路徑錯誤或未正確安裝",
        solution: "清除node_modules後重新安裝",
        steps: ["刪除node_modules", "清除npm快取", "執行npm install"],
        type: "dependency",
        severity: "medium",
      },
      {
        title: "權限不足",
        problem: "Permission denied: /var/log/app.log",
        cause: "執行用戶沒有寫入權限",
        solution: "修改檔案權限或擁有者",
        steps: ["檢查目前用戶", "變更檔案擁有者", "設定適當權限"],
        type: "system",
        severity: "high",
      },
      {
        title: "服務無法啟動",
        problem: "Service failed to start: port already in use",
        cause: "端口被其他程序佔用",
        solution: "找出並停止佔用端口的程序",
        steps: ["使用lsof找出程序", "停止該程序", "重新啟動服務"],
        type: "runtime",
        severity: "high",
      },
      {
        title: "設定檔錯誤",
        problem: "Config Error: undefined property 'database'",
        cause: "設定檔格式錯誤或缺少必要欄位",
        solution: "檢查並修正設定檔",
        steps: ["檢查設定檔語法", "比對範本", "填入必要欄位"],
        type: "config",
        severity: "medium",
      },
    ]

    for (const ex of examples) {
      output += "═══════════════════════════════════════\n"
      output += "📌 標題: " + ex.title + "\n"
      output += "🔴 問題: " + ex.problem + "\n"
      output += "⚠️ 原因: " + ex.cause + "\n"
      output += "✅ 解決: " + ex.solution + "\n"
      output += "📋 步驟:\n"
      for (const step of ex.steps) {
        output += "   " + (ex.steps.indexOf(step) + 1) + ". " + step + "\n"
      }
      output += "🏷️ 類型: " + ex.type + " | 嚴重: " + ex.severity + "\n"
      output += "\n"
    }

    output += "═══════════════════════════════════════\n"
    output += "使用 /memory repair add 記錄自己的維修方案\n"

    return {
      success: true,
      output,
      confidence: 0.95,
    }
  }

  private showRepairHelp(): PluginResult {
    let output = "🔧 維修記錄指令說明\n\n"

    output += "基本指令:\n"
    output += "  /repair list              - 列出所有維修記錄\n"
    output += "  /repair add              - 新增維修記錄\n"
    output += "  /repair find <關鍵詞>    - 搜尋維修記錄\n"
    output += "  /repair example          - 查看範例(AI學習素材)\n\n"

    output += "新增格式:\n"
    output += "  /repair add --title 標題\n"
    output += "         --problem 問題描述\n"
    output += "         --solution 解決方案\n"
    output += "         --type system|network|config|dependency|runtime|hardware\n"
    output += "         --severity critical|high|medium|low\n\n"

    output += "範例:\n"
    output += "  /repair add --title 網站無法訪問\n"
    output += "         --problem HTTP 500 Error\n"
    output += "         --solution 重啟Apache服務\n"
    output += "         --type system --severity high\n"

    return {
      success: true,
      output,
      confidence: 0.9,
    }
  }

  private extractRepairTitle(input: string): string {
    const match = input.match(/--title\s+(\S+.*?)(?:\s+--|\s+$|$)/i) || input.match(/title[:\s]+(.+?)(?:\s+--|$)/i)
    return match ? match[1].trim() : ""
  }

  private extractRepairProblem(input: string): string {
    const match = input.match(/--problem\s+(\S+.*?)(?:\s+--|\s+$|$)/i) || input.match(/problem[:\s]+(.+?)(?:\s+--|$)/i)
    return match ? match[1].trim() : ""
  }

  private extractRepairSolution(input: string): string {
    const match =
      input.match(/--solution\s+(\S+.*?)(?:\s+--|\s+$|$)/i) || input.match(/solution[:\s]+(.+?)(?:\s+--|$)/i)
    return match ? match[1].trim() : ""
  }

  private extractRepairCause(input: string): string {
    const match = input.match(/--cause\s+(\S+.*?)(?:\s+--|\s+$|$)/i) || input.match(/cause[:\s]+(.+?)(?:\s+--|$)/i)
    return match ? match[1].trim() : ""
  }

  private extractRepairSteps(input: string): string[] {
    const match = input.match(/--steps?\s+(.+?)(?:\s+--|$)/i)
    if (!match) return []
    return match[1].split("|").map((s) => s.trim())
  }

  private extractRepairExamples(input: string): string[] {
    const match = input.match(/--example[s]?\s+(.+?)(?:\s+--|$)/i)
    if (!match) return []
    return match[1].split("|").map((s) => s.trim())
  }

  private extractRepairType(input: string): RepairRecord["type"] {
    const match = input.match(/--type\s+(\S+)/i)
    if (!match) return "unknown"
    const types: RepairRecord["type"][] = ["system", "network", "config", "dependency", "runtime", "hardware"]
    return types.includes(match[1] as any) ? (match[1] as any) : "unknown"
  }

  private extractRepairSeverity(input: string): RepairRecord["severity"] {
    const match = input.match(/--severity\s+(\S+)/i)
    if (!match) return "medium"
    const severities: RepairRecord["severity"][] = ["critical", "high", "medium", "low"]
    return severities.includes(match[1] as any) ? (match[1] as any) : "medium"
  }

  public getRepairRecords(): RepairRecord[] {
    return Array.from(this.repairRecords.values())
  }

  public getRepair(id: string): RepairRecord | undefined {
    return this.repairRecords.get(id)
  }
}

export const createOpenCodeMemoryPlugin = (baseDir?: string): PluginInstance => {
  const plugin = new OpenCodeMemoryPlugin(baseDir)

  return {
    metadata: {
      name: "opencode-memory",
      version: "1.0.0",
      description: "OpenCode 專屬記憶容器 - 長期記憶、偏好學習、專案上下文、技能索引、維修記錄於一體",
      category: "memory",
      triggers: [
        "memory",
        "記憶",
        "profile",
        "使用者",
        "偏好",
        "project",
        "專案",
        "項目",
        "skill",
        "skills",
        "技能",
        "learn",
        "lesson",
        "學習",
        "stats",
        "統計",
        "forget",
        "忘記",
        "刪除",
        "conversation",
        "history",
        "對話",
        "歷史",
        "repair",
        "fix",
        "維修",
        "修復",
      ],
      autoLoad: true,
    },
    hooks: plugin,
    status: "unloaded",
    config: {
      enabled: true,
      priority: 100,
      settings: {
        baseDir: baseDir || join(homedir(), ".independent-architecture", "opencode-memory"),
        autoSave: true,
        maxMemoryAge: 14 * 24 * 60 * 60 * 1000,
        decayEnabled: true,
        skillIndexDirs: ["/home/reamaster/opencode-manager/opencode independent system/.opencode/skill"],
      },
    },
  }
}

export default OpenCodeMemoryPlugin
