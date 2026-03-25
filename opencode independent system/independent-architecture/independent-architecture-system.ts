import { KnowledgeBase } from "./knowledge"
import { SearchEngine } from "./search"
import { ProblemSolver } from "./problem-solver"
import { AIMemory } from "./memory"
import { SelfMonitor } from "./monitor"
import { SecurityShield } from "./security"
import { ModelManager } from "./model"
import { Log } from "./util/log"
import { PluginManager, getDefaultPlugins } from "./plugin-system"

const log = Log.create({ service: "independent-architecture-system" })

export interface ProcessResult {
  success: boolean
  output: string
  confidence: number
  steps: string[]
  knowledgeUsed: string[]
  toolsUsed: string[]
  timeTaken: number
  modelUsed: string
  metadata?: Record<string, unknown>
}

export interface ProcessOptions {
  offline?: boolean
  debug?: boolean
  timeout?: number
  priority?: "high" | "normal" | "low"
  enablePlugins?: boolean
}

export interface HealthCheckResult {
  healthy: boolean
  details: {
    module: string
    status: "healthy" | "warning" | "critical"
    message: string
    confidence: number
  }[]
  overallScore: number
  recommendations: string[]
}

interface HealthCheckDetail {
  type: string
  status: "healthy" | "warning" | "critical"
  message: string
  confidence: number
  metrics?: Record<string, number>
}

export class IndependentArchitectureSystem {
  private knowledgeBase: KnowledgeBase
  private searchEngine: SearchEngine
  private problemSolver: ProblemSolver
  private memory: AIMemory
  private selfMonitor: SelfMonitor
  private securityShield: SecurityShield
  private modelManager: ModelManager
  private pluginManager: PluginManager | null = null
  private offlineMode: boolean = false
  private pluginEnabled: boolean = true

  constructor(options?: { enablePlugins?: boolean }) {
    log.info("initializing Ji San Ji System")
    this.knowledgeBase = new KnowledgeBase()
    this.searchEngine = new SearchEngine()
    this.problemSolver = new ProblemSolver()
    this.memory = new AIMemory()
    this.selfMonitor = new SelfMonitor()
    this.securityShield = new SecurityShield()
    this.modelManager = new ModelManager()
    this.pluginEnabled = options?.enablePlugins ?? true

    if (this.pluginEnabled) {
      this.initPlugins()
    }

    this.selfMonitor.monitorPerformance()
    log.info("system initialized")
  }

  private async initPlugins(): Promise<void> {
    try {
      this.pluginManager = new PluginManager()
      const plugins = getDefaultPlugins()
      for (const plugin of plugins) {
        await this.pluginManager.registerPlugin(plugin)
      }
      await this.pluginManager.initialize()
      log.info(`Plugin system initialized with ${plugins.length} plugins`)
    } catch (error) {
      log.error("Failed to initialize plugin system", error)
      this.pluginManager = null
    }
  }

  async process(input: string, options: ProcessOptions = {}): Promise<ProcessResult> {
    const startTime = Date.now()
    const steps: string[] = []
    const knowledgeUsed: string[] = []
    const toolsUsed: string[] = []

    try {
      steps.push("1. 安全檢查")
      const securityResult = await this.securityShield.securityCheck(input)
      if (!securityResult.safe) {
        return {
          success: false,
          output: securityResult.message || "安全檢查失敗",
          confidence: 0,
          steps,
          knowledgeUsed,
          toolsUsed,
          timeTaken: Date.now() - startTime,
          modelUsed: "none",
        }
      }

      if (this.pluginManager && options.enablePlugins !== false) {
        steps.push("2. 插件處理")
        const pluginResults = await this.pluginManager.process(input)
        if (pluginResults.length > 0) {
          const primary = pluginResults[0]
          if (primary.success && primary.output) {
            return {
              success: true,
              output: primary.output,
              confidence: primary.confidence || 0.85,
              steps,
              knowledgeUsed,
              toolsUsed: ["plugin", ...toolsUsed],
              timeTaken: Date.now() - startTime,
              modelUsed: this.offlineMode ? "offline-mode" : "plugin",
              metadata: { pluginResults },
            }
          }
        }
      }

      steps.push("3. 知識庫搜尋")
      const kbResults = await this.knowledgeBase.search(input)
      if (kbResults.length > 0) {
        knowledgeUsed.push(...kbResults.slice(0, 3).map((k) => k.title))
      }

      steps.push("4. 程式碼搜尋")
      const searchResults = await this.searchEngine.searchCode(input)

      steps.push("5. 問題分析")
      const analysis = await this.problemSolver.analyzeError(input)

      steps.push("6. 生成回應")
      let output = ""

      if (kbResults.length > 0) {
        output += `📚 相關知識：\n`
        kbResults.slice(0, 3).forEach((k) => {
          output += `- ${k.title}: ${k.content.substring(0, 100)}...\n`
        })
        output += "\n"
      }

      if (searchResults.length > 0) {
        output += `🔍 相關程式碼：\n`
        searchResults.slice(0, 2).forEach((s) => {
          output += `- ${s.title}\n`
        })
        output += "\n"
      }

      if (analysis.pattern) {
        output += `💡 問題分析：\n`
        output += `- 錯誤代碼: ${analysis.errorCode}\n`
        output += `- 問題類型: ${analysis.pattern.name}\n`
        if (analysis.pattern.solutions.length > 0) {
          output += `- 解決方案: ${analysis.pattern.solutions[0]}\n`
        }
      }

      if (!output) {
        output = await this.generateResponse(input, options)
      }

      return {
        success: true,
        output,
        confidence: 0.85,
        steps,
        knowledgeUsed,
        toolsUsed: ["knowledge", "search", "problem-solver", "memory", ...toolsUsed],
        timeTaken: Date.now() - startTime,
        modelUsed: this.offlineMode ? "offline-mode" : "local-model",
      }
    } catch (error) {
      log.error("process error", { error, input })
      return {
        success: false,
        output: `處理過程發生錯誤: ${error instanceof Error ? error.message : "未知錯誤"}`,
        confidence: 0,
        steps,
        knowledgeUsed,
        toolsUsed,
        timeTaken: Date.now() - startTime,
        modelUsed: "none",
      }
    }
  }

  private async generateResponse(input: string, options: ProcessOptions): Promise<string> {
    const preferences = await this.memory.getPreference()

    let response = `🤖 獨立架構回應：\n\n`
    response += `收到輸入: "${input}"\n\n`

    // 嘗試使用 Ollama
    if (!this.offlineMode && !options.offline && this.modelManager.isConnected()) {
      try {
        const result = await this.modelManager.chat([{ role: "user", content: input }])

        response += `💬 AI 回應：\n${result.message.content}\n`
        return response
      } catch (error) {
        log.warn("Ollama chat failed, falling back to knowledge base", {
          error: String(error),
        })
      }
    }

    if (this.offlineMode || options.offline) {
      response += `📴 目前運行於離線模式\n\n`
      response += `可用功能：\n`
      response += `- 知識庫搜尋\n`
      response += `- 程式碼搜尋\n`
      response += `- 錯誤分析\n`
      response += `- 記憶系統\n\n`

      const kbResults = await this.knowledgeBase.search(input)
      if (kbResults.length > 0) {
        response += `根據知識庫，這可能與以下主題相關：\n`
        kbResults.slice(0, 3).forEach((k) => {
          response += `- ${k.title}\n`
        })
      } else {
        response += `抱歉，離線模式下無法找到相關資訊。\n`
        response += `建議：\n`
        response += `1. 連接網路以啟用完整功能\n`
        response += `2. 安裝本地模型（如 Ollama）\n`
        response += `3. 擴充知識庫\n`
      }
    } else {
      // 顯示可用模型
      const models = await this.modelManager.getAvailableModels()
      response += `✅ Ollama 已連接！\n\n`
      response += `📦 可用模型：\n`
      models.forEach((m) => {
        response += `- ${m.name} (${m.provider}, ${m.size})\n`
      })
      response += `\n`

      const kbResults = await this.knowledgeBase.search(input)
      if (kbResults.length > 0) {
        response += `以下是知識庫中的相關資訊：\n`
        kbResults.slice(0, 3).forEach((k) => {
          response += `\n📖 ${k.title}\n`
          response += `${k.content}\n`
        })
      }
    }

    return response
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const details: HealthCheckResult["details"] = []

    const kbHealth = await this.knowledgeBase.healthCheck()
    details.push({
      module: "知識庫",
      status: kbHealth.status,
      message: kbHealth.message,
      confidence: kbHealth.confidence,
    })

    const searchHealth = await this.searchEngine.healthCheck()
    details.push({
      module: "搜尋引擎",
      status: searchHealth.status,
      message: searchHealth.message,
      confidence: searchHealth.confidence,
    })

    const psHealth = await this.problemSolver.healthCheck()
    details.push({
      module: "問題解決器",
      status: psHealth.status,
      message: psHealth.message,
      confidence: psHealth.confidence,
    })

    const monitorHealth = await this.selfMonitor.healthCheck()
    details.push({
      module: "監控系統",
      status: monitorHealth.details[0]?.status || "healthy",
      message: monitorHealth.details[0]?.message || "OK",
      confidence: monitorHealth.overallScore,
    })

    const securityHealth = await this.securityShield.healthCheck()
    details.push({
      module: "安全防護",
      status: securityHealth.status,
      message: securityHealth.message,
      confidence: securityHealth.confidence,
    })

    const modelHealth = await this.modelManager.healthCheck()
    details.push({
      module: "模型管理器",
      status: modelHealth.status,
      message: modelHealth.message,
      confidence: modelHealth.confidence,
    })

    if (this.pluginManager) {
      const pluginHealth = await this.pluginManager.healthCheck()
      details.push({
        module: "插件系統",
        status: pluginHealth.overall,
        message: `${pluginHealth.plugins.size} plugins loaded, ${pluginHealth.skills} skills`,
        confidence: 0.95,
      })
    }

    const healthy = details.every((d) => d.status === "healthy")
    const overallScore = details.reduce((sum, d) => sum + d.confidence, 0) / details.length

    const recommendations: string[] = []
    if (!healthy) {
      const critical = details.filter((d) => d.status === "critical")
      if (critical.length > 0) {
        recommendations.push(`有 ${critical.length} 個模組處於危險狀態`)
      }
    }

    return {
      healthy,
      details,
      overallScore,
      recommendations,
    }
  }

  async securityCheck(input: string) {
    return this.securityShield.securityCheck(input)
  }

  async isOffline(): Promise<boolean> {
    return this.offlineMode
  }

  setOfflineMode(offline: boolean) {
    this.offlineMode = offline
    log.info("offline mode changed", { offline })
  }

  getKnowledgeBase(): KnowledgeBase {
    return this.knowledgeBase
  }

  getSearchEngine(): SearchEngine {
    return this.searchEngine
  }

  getProblemSolver(): ProblemSolver {
    return this.problemSolver
  }

  getMemory(): AIMemory {
    return this.memory
  }

  getSelfMonitor(): SelfMonitor {
    return this.selfMonitor
  }

  getSecurityShield(): SecurityShield {
    return this.securityShield
  }

  getModelManager(): ModelManager {
    return this.modelManager
  }

  async shutdown(): Promise<void> {
    log.info("shutting down system")
    if (this.pluginManager) {
      await this.pluginManager.shutdown()
    }
    await this.selfMonitor.shutdown()
  }

  getPluginManager(): PluginManager | null {
    return this.pluginManager
  }

  isPluginEnabled(): boolean {
    return this.pluginEnabled
  }
}

export default IndependentArchitectureSystem
