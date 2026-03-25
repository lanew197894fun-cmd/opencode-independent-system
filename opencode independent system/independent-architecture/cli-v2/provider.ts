// Provider 系統 - 模型供應商管理（援用官方模式）

import { Log } from "../util/log"
import { homedir } from "os"
import { join } from "path"
import { existsSync } from "fs"
import { getWebServerConfig } from "./web-server"

export const log = Log.create({ service: "provider" })

// ============================================
// Provider 類型
// ============================================

export interface Model {
  id: string
  name: string
  provider: string
  description?: string
  capabilities: {
    text: boolean
    code: boolean
    reasoning: boolean
    toolcall: boolean
    vision: boolean
  }
  contextWindow?: number
  cost?: {
    input: number
    output: number
  }
}

export interface Provider {
  id: string
  name: string
  baseURL: string
  apiKeyEnv: string[]
  models: Model[]
  free: boolean
  status: "connected" | "disconnected" | "error"
  options?: Record<string, any>
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool"
  content: string
  name?: string
  toolCallId?: string
}

export interface ChatOptions {
  model?: string
  provider?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
  tools?: ToolDefinition[]
}

export interface ToolDefinition {
  type: "function"
  name: string
  description: string
  parameters: {
    type: "object"
    properties: Record<string, any>
    required?: string[]
  }
}

// ============================================
// 支援的 Providers 配置
// ============================================

export const PROVIDER_CONFIGS: Record<string, Omit<Provider, "models" | "status">> = {
  groq: {
    id: "groq",
    name: "Groq",
    baseURL: "https://api.groq.com/openai/v1",
    apiKeyEnv: ["GROQ_API_KEY"],
    free: true,
  },
  together: {
    id: "together",
    name: "Together AI",
    baseURL: "https://api.together.ai/v1",
    apiKeyEnv: ["TOGETHER_API_KEY"],
    free: true,
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    baseURL: "https://openrouter.ai/api/v1",
    apiKeyEnv: ["OPENROUTER_API_KEY"],
    free: true,
    options: {
      headers: {
        "HTTP-Referer": "https://independent-architecture.local",
        "X-Title": "IndependentArchitecture CLI",
      },
    },
  },
  deepinfra: {
    id: "deepinfra",
    name: "DeepInfra",
    baseURL: "https://api.deepinfra.com/v1/openai",
    apiKeyEnv: ["DEEPINFRA_API_KEY"],
    free: true,
  },
  cerebras: {
    id: "cerebras",
    name: "Cerebras",
    baseURL: "https://api.cerebras.ai/v1",
    apiKeyEnv: ["CEREBRAS_API_KEY"],
    free: true,
  },
  venice: {
    id: "venice",
    name: "Venice AI",
    baseURL: "https://api.venice.ai/api/v1",
    apiKeyEnv: ["VENICE_ADMIN_KEY", "VENICE_API_KEY"],
    free: true,
  },
  ollama: {
    id: "ollama",
    name: "Ollama (本地)",
    baseURL: "http://127.0.0.1:11434/v1",
    apiKeyEnv: [],
    free: true,
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    baseURL: "https://api.anthropic.com/v1",
    apiKeyEnv: ["ANTHROPIC_API_KEY"],
    free: false,
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    baseURL: "https://api.openai.com/v1",
    apiKeyEnv: ["OPENAI_API_KEY"],
    free: false,
  },
  mistral: {
    id: "mistral",
    name: "Mistral",
    baseURL: "https://api.mistral.ai/v1",
    apiKeyEnv: ["MISTRAL_API_KEY"],
    free: false,
  },
}

// ============================================
// 免費模型列表
// ============================================

export const FREE_MODELS: Record<string, string[]> = {
  groq: ["llama-3.3-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it", "llama-3.1-8b-instant"],
  together: ["meta-llama/Llama-3-8b-chat-hf", "mistralai/Mixtral-8x7B-Instruct-v0.1", "google/gemma-2-9b-it"],
  openrouter: ["openai/gpt-3.5-turbo", "anthropic/claude-3-haiku", "google/gemini-pro"],
  deepinfra: ["meta-llama/Llama-3-8B-Instruct", "mistralai/Mistral-7B-Instruct-v0.2"],
  cerebras: ["llama-3.3-70b"],
  venice: ["venice-main"],
  ollama: ["qwen2.5:7b", "llama3:8b", "codellama:7b", "mistral:7b", "phi3:latest"],
}

// ============================================
// Provider Manager
// ============================================

export class ProviderManager {
  private providers: Map<string, Provider> = new Map()
  private activeProvider: string = "ollama"
  private activeModel: string = "qwen2.5:3b"
  private webServerConfig = getWebServerConfig()

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders(): void {
    // 初始化所有配置的 providers
    for (const [id, config] of Object.entries(PROVIDER_CONFIGS)) {
      // 優先從官方設定讀取 API Key
      const apiKey = this.webServerConfig.getProviderApiKey(id) || this.getApiKey(config.apiKeyEnv)
      const hasApiKey = !!apiKey

      // 檢查是否啟用
      if (!this.webServerConfig.isProviderEnabled(id)) {
        log.info(`Provider ${id} disabled by opencode config`)
        continue
      }

      // Ollama 不需要 API key
      const needsKey = id !== "ollama"

      // 創建 provider 但先設為 disconnected
      const provider: Provider = {
        ...config,
        models: this.getModelsForProvider(id),
        status: "disconnected",
      }

      this.providers.set(id, provider)

      // 在背景中測試連接（不阻塞初始化）
      if (!needsKey || hasApiKey) {
        this.testProviderConnection(id, apiKey).catch(() => {
          // 連接失敗時保持 disconnected 狀態
        })
      }
    }

    // 特別處理 Ollama 連接
    this.checkOllamaConnection().catch(() => {
      // Ollama 連接失敗時保持 disconnected 狀態
    })
  }

  private getApiKey(envVars: string[]): string | undefined {
    for (const envVar of envVars) {
      const key = process.env[envVar]
      if (key) return key
    }
    return undefined
  }

  private getModelsForProvider(providerId: string): Model[] {
    const modelIds = FREE_MODELS[providerId] || []
    return modelIds.map((id) => this.createModel(id, providerId))
  }

  private createModel(id: string, providerId: string): Model {
    const name = id.split("/").pop() || id
    return {
      id,
      name,
      provider: providerId,
      description: this.getModelDescription(name),
      capabilities: {
        text: true,
        code: name.includes("coder") || name.includes("code"),
        reasoning: name.includes("r1") || name.includes("reasoning"),
        toolcall: false,
        vision: false,
      },
    }
  }

  private getModelDescription(name: string): string {
    const lower = name.toLowerCase()
    if (lower.includes("coder") || lower.includes("code")) {
      return "程式碼生成、重構、Debug"
    }
    if (lower.includes("r1") || lower.includes("reasoning")) {
      return "思考鏈、數學推理、複雜問題分析"
    }
    if (lower.includes("vision") || lower.includes("llava")) {
      return "圖片理解、視覺分析"
    }
    if (lower.includes("llama")) {
      return "通用對話、多語言支援"
    }
    if (lower.includes("gemma")) {
      return "Google 輕量模型，高效推理"
    }
    if (lower.includes("mistral")) {
      return "法國開源模型，翻譯、摘要"
    }
    if (lower.includes("qwen")) {
      return "阿里通義千問，擅長中文對話"
    }
    return "通用語言模型"
  }

  private async testProviderConnection(providerId: string, apiKey?: string): Promise<void> {
    const provider = this.providers.get(providerId)
    if (!provider) return

    if (providerId === "ollama") {
      // Ollama 連接已在 checkOllamaConnection 中處理
      return
    }

    if (!apiKey) {
      // 無 API key，保持 disconnected 狀態
      return
    }

    try {
      const resp = await fetch(`${provider.baseURL}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...provider.options?.headers,
        },
        signal: AbortSignal.timeout(5000),
      })

      provider.status = resp.ok ? "connected" : "error"

      if (resp.ok) {
        log.info(`Provider ${providerId} connected`)

        // 嘗試獲取模型列表（並非所有提供者都支援）
        try {
          const modelsData = await resp.json()
          if (modelsData && typeof modelsData === "object") {
            // 這裡可以擴展以獲取實際模型列表
            log.debug(`Provider ${providerId} models endpoint responded`)
          }
        } catch (e) {
          // 無法解析模型列表，但連接正常
          log.debug(`Provider ${providerId} connected but cannot parse models`)
        }
      }
    } catch (e) {
      provider.status = "error"
      log.warn(`Provider ${providerId} connection failed`, { error: String(e) })
    }
  }

  private async checkOllamaConnection(): Promise<void> {
    try {
      const resp = await fetch("http://127.0.0.1:11434/api/tags", {
        signal: AbortSignal.timeout(3000),
      })

      if (resp.ok) {
        const ollama = this.providers.get("ollama")
        if (ollama) {
          ollama.status = "connected"

          // 獲取實際模型列表
          const data = await resp.json()
          const models: any[] = data.models || []

          ollama.models = models.map((m: any) => ({
            id: m.name,
            name: m.name,
            provider: "ollama",
            description: this.getModelDescription(m.name),
            capabilities: {
              text: true,
              code: m.name.includes("coder"),
              reasoning: m.name.includes("r1"),
              toolcall: false,
              vision: m.name.includes("vision"),
            },
          }))

          if (models.length > 0) {
            this.activeModel = models[0].name
            log.info("Ollama connected", { modelCount: models.length })
          }
        }
      }
    } catch (e) {
      log.warn("Ollama not connected", { error: String(e) })
    }
  }

  async checkProviderConnection(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId)
    if (!provider) return false

    const apiKey = this.getApiKey(provider.apiKeyEnv)
    if (!apiKey && providerId !== "ollama") {
      return false
    }

    try {
      const resp = await fetch(`${provider.baseURL}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...provider.options?.headers,
        },
        signal: AbortSignal.timeout(5000),
      })

      provider.status = resp.ok ? "connected" : "error"
      return resp.ok
    } catch (e) {
      provider.status = "error"
      return false
    }
  }

  getProvider(id: string): Provider | undefined {
    return this.providers.get(id)
  }

  listProviders(): Provider[] {
    return Array.from(this.providers.values())
  }

  listConnectedProviders(): Provider[] {
    return this.listProviders().filter((p) => p.status === "connected")
  }

  getActiveProvider(): Provider | undefined {
    return this.providers.get(this.activeProvider)
  }

  setActiveProvider(providerId: string): boolean {
    if (!this.providers.has(providerId)) return false
    this.activeProvider = providerId
    return true
  }

  setActiveModel(modelId: string): boolean {
    this.activeModel = modelId
    return true
  }

  getActiveModel(): string {
    return this.activeModel
  }

  getActiveProviderId(): string {
    return this.activeProvider
  }

  selectBestModel(task: "chat" | "code" | "reasoning" | "vision"): string {
    const connected = this.listConnectedProviders()

    for (const provider of connected) {
      for (const model of provider.models) {
        if (task === "code" && model.capabilities.code) return model.id
        if (task === "reasoning" && model.capabilities.reasoning) return model.id
        if (task === "vision" && model.capabilities.vision) return model.id
        if (task === "chat" && model.capabilities.text) return model.id
      }
    }

    return this.activeModel
  }

  // ============================================
  // Chat API
  // ============================================

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
    const providerId = options.provider || this.activeProvider
    const provider = this.providers.get(providerId)

    // 詳細日誌用於除錯
    log.debug("Chat request", {
      providerId,
      optionsProvider: options.provider,
      activeProvider: this.activeProvider,
      providerExists: !!provider,
      providerStatus: provider?.status,
      allProviders: Array.from(this.providers.entries()).map(([id, p]) => ({ id, status: p.status })),
    })

    // 檢查提供者是否存在且狀態為已連接
    if (!provider) {
      log.warn("Provider not found", { providerId, availableProviders: Array.from(this.providers.keys()) })
      // 回退到 Ollama
      return this.chatWithOllama(messages, options)
    }

    // 實時檢查連接狀態（而不是依賴緩存狀態）
    const isConnected = await this.checkProviderConnection(providerId)
    if (!isConnected) {
      log.warn("Provider not connected", { providerId, status: provider.status })
      // 回退到 Ollama
      return this.chatWithOllama(messages, options)
    }

    const apiKey = this.getApiKey(provider.apiKeyEnv)
    const model = options.model || this.activeModel

    try {
      const resp = await fetch(`${provider.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...provider.options?.headers,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 4096,
          ...(options.tools && { tools: options.tools }),
        }),
      })

      if (!resp.ok) {
        throw new Error(`API error: ${resp.status}`)
      }

      const data = await resp.json()
      return data.choices?.[0]?.message?.content || ""
    } catch (e) {
      log.error("Chat error", { provider: providerId, error: String(e) })
      throw e
    }
  }

  private async chatWithOllama(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
    const ollama = this.providers.get("ollama")
    if (!ollama || ollama.status !== "connected") {
      throw new Error("No available provider")
    }

    const model = options.model || this.activeModel

    // 轉換 messages 格式
    const ollamaMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    try {
      const resp = await fetch("http://127.0.0.1:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: ollamaMessages,
          stream: false,
        }),
      })

      if (!resp.ok) {
        throw new Error(`Ollama error: ${resp.status}`)
      }

      const data = await resp.json()
      return data.message?.content || ""
    } catch (e) {
      log.error("Ollama chat error", { error: String(e) })
      throw e
    }
  }

  // ============================================
  // 狀態格式化輸出
  // ============================================

  formatStatus(): string {
    let output = "模型供應商狀態\n═══════════════════════════════\n\n"

    for (const provider of this.listProviders()) {
      const icon = provider.status === "connected" ? "✅" : provider.status === "error" ? "⚠️" : "❌"
      const active = provider.id === this.activeProvider ? " [使用中]" : ""

      output += `${icon} ${provider.name}${active}\n`
      output += `   ID: ${provider.id}\n`

      if (provider.free) {
        output += `   免費: 是\n`
      }

      if (provider.models.length > 0) {
        output += `   模型: ${provider.models.length} 個\n`
        output += `   示例: ${provider.models
          .slice(0, 2)
          .map((m) => m.name)
          .join(", ")}\n`
      }

      output += "\n"
    }

    return output
  }
}
