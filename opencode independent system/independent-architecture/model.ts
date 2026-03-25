import z from "zod"
import { Log } from "./util/log"
import { homedir } from "os"
import { join } from "path"
import { existsSync } from "fs"

const log = Log.create({ service: "independent-architecture-model" })

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
    vision: boolean
  }
  status: "active" | "inactive" | "error"
  latency: number
  confidence: number
}

export interface CloudProvider {
  id: string
  name: string
  apiKey: string | undefined
  baseURL?: string
  status: "connected" | "disconnected" | "error"
  models: string[]
  free: boolean
}

export const SUPPORTED_PROVIDERS: Record<
  string,
  {
    name: string
    envVars: string[]
    baseURL?: string
    freeModels?: string[]
  }
> = {
  groq: {
    name: "Groq",
    envVars: ["GROQ_API_KEY"],
    freeModels: ["llama-3.3-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"],
  },
  together: {
    name: "Together AI",
    envVars: ["TOGETHER_API_KEY"],
    baseURL: "https://api.together.ai/v1",
    freeModels: ["meta-llama/Llama-3-8b-chat-hf", "mistralai/Mixtral-8x7B-Instruct-v0.1"],
  },
  openrouter: {
    name: "OpenRouter",
    envVars: ["OPENROUTER_API_KEY"],
    baseURL: "https://openrouter.ai/api/v1",
    freeModels: ["openai/gpt-3.5-turbo", "anthropic/claude-3-haiku"],
  },
  deepinfra: {
    name: "DeepInfra",
    envVars: ["DEEPINFRA_API_KEY"],
    baseURL: "https://api.deepinfra.com/v1/openai",
    freeModels: ["meta-llama/Llama-3-8B-Instruct"],
  },
  cerebras: {
    name: "Cerebras",
    envVars: ["CEREBRAS_API_KEY"],
    baseURL: "https://api.cerebras.ai/v1",
    freeModels: ["llama-3.3-70b"],
  },
  perplexity: {
    name: "Perplexity",
    envVars: ["PERPLEXITY_API_KEY"],
    baseURL: "https://api.perplexity.ai",
  },
  mistral: {
    name: "Mistral",
    envVars: ["MISTRAL_API_KEY"],
    baseURL: "https://api.mistral.ai/v1",
    freeModels: ["mistral-small-latest"],
  },
  anthropic: {
    name: "Anthropic",
    envVars: ["ANTHROPIC_API_KEY"],
    baseURL: "https://api.anthropic.com/v1",
  },
  openai: {
    name: "OpenAI",
    envVars: ["OPENAI_API_KEY"],
    baseURL: "https://api.openai.com/v1",
  },
  xai: {
    name: "xAI",
    envVars: ["XAI_API_KEY"],
    baseURL: "https://api.x.ai/v1",
  },
}

interface HealthCheckDetail {
  type: "model" | "search" | "knowledge" | "problem-solver" | "system" | "network" | "storage"
  status: "healthy" | "warning" | "critical"
  message: string
  confidence: number
  metrics?: Record<string, number>
}

interface ModelPerformance {
  responseTime: number
  accuracy: number
  cost: number
}

interface OllamaModel {
  name: string
  model: string
  size: number
  modified_at: string
}

export class ModelManager {
  private models: Map<string, LocalModel> = new Map()
  private activeModel: string = "qwen3:8b"
  private modelQueue: string[] = ["qwen3:8b", "qwen2.5-coder:1.5b", "deepseek-r1:7b"]
  private performance: Map<string, ModelPerformance> = new Map()
  private ollamaBaseUrl = "http://127.0.0.1:11434"
  private isOllamaConnected = false

  constructor() {
    this.initializeDefaultModels()
    this.connectToOllama()
  }

  private async connectToOllama() {
    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/tags`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        const data = await response.json()
        const ollamaModels: OllamaModel[] = data.models || []

        log.info("Connected to Ollama", { count: ollamaModels.length })

        ollamaModels.forEach((m) => {
          const modelInfo: LocalModel = {
            id: m.name,
            name: m.name,
            provider: "ollama",
            size: `${Math.round(m.size / 1024 / 1024 / 1024)}GB`,
            capabilities: {
              text: true,
              code: m.name.includes("coder"),
              reasoning: m.name.includes("r1") || m.name.includes("reasoning"),
              toolcall: false,
              vision: m.name.includes("vision"),
            },
            status: "active",
            latency: 0,
            confidence: 0.9,
          }

          this.models.set(m.name, modelInfo)
        })

        this.isOllamaConnected = true

        if (ollamaModels.length > 0) {
          this.activeModel = ollamaModels[0].name
          this.modelQueue = ollamaModels.map((m) => m.name)
        }

        log.info("Ollama models loaded", { models: this.modelQueue })
      }
    } catch (error) {
      log.warn("Failed to connect to Ollama", { error: String(error) })
      this.isOllamaConnected = false
    }
  }

  private initializeDefaultModels() {
    if (!this.isOllamaConnected) {
      const defaultModels: LocalModel[] = [
        {
          id: "qwen3:8b",
          name: "Qwen 8B",
          provider: "ollama",
          size: "5.2GB",
          capabilities: {
            text: true,
            code: true,
            reasoning: true,
            toolcall: true,
            vision: false,
          },
          status: "active",
          latency: 180,
          confidence: 0.92,
        },
        {
          id: "qwen2.5-coder:1.5b",
          name: "Qwen2.5 Coder 1.5B",
          provider: "ollama",
          size: "986MB",
          capabilities: {
            text: true,
            code: true,
            reasoning: true,
            toolcall: true,
            vision: false,
          },
          status: "active",
          latency: 100,
          confidence: 0.9,
        },
        {
          id: "deepseek-r1:7b",
          name: "DeepSeek R1 7B",
          provider: "ollama",
          size: "4.7GB",
          capabilities: {
            text: true,
            code: true,
            reasoning: true,
            toolcall: true,
            vision: false,
          },
          status: "active",
          latency: 200,
          confidence: 0.95,
        },
        {
          id: "qwen3-coder",
          name: "Qwen3 Coder",
          provider: "ollama",
          size: "18GB",
          capabilities: {
            text: true,
            code: true,
            reasoning: true,
            toolcall: true,
            vision: false,
          },
          status: "active",
          latency: 250,
          confidence: 0.93,
        },
        {
          id: "moondream",
          name: "Moondream",
          provider: "ollama",
          size: "1.7GB",
          capabilities: {
            text: true,
            code: false,
            reasoning: true,
            toolcall: false,
            vision: true,
          },
          status: "active",
          latency: 120,
          confidence: 0.88,
        },
      ]

      defaultModels.forEach((model) => this.models.set(model.id, model))
    }
  }

  async getModel(modelId: string): Promise<LocalModel | undefined> {
    return this.models.get(modelId)
  }

  async getActiveModel(): Promise<LocalModel> {
    const model = this.models.get(this.activeModel)
    if (!model) throw new Error(`Active model ${this.activeModel} not found`)
    return model
  }

  async setActiveModel(modelId: string): Promise<boolean> {
    const model = this.models.get(modelId)
    if (!model) return false
    this.activeModel = modelId
    return true
  }

  async getAvailableModels(): Promise<LocalModel[]> {
    return Array.from(this.models.values())
  }

  async getVisionModels(): Promise<LocalModel[]> {
    return Array.from(this.models.values()).filter((m) => m.capabilities.vision)
  }

  async getCodeModels(): Promise<LocalModel[]> {
    return Array.from(this.models.values()).filter((m) => m.capabilities.code)
  }

  async selectModel(
    problem: { type: string; description: string },
    context?: Record<string, unknown>,
  ): Promise<LocalModel> {
    if (problem.type === "code" || problem.description.includes("code")) {
      const codeModels = await this.getCodeModels()
      if (codeModels.length > 0) {
        return codeModels[0]
      }
    }

    if (problem.type === "vision" || problem.description.includes("image")) {
      const visionModels = await this.getVisionModels()
      if (visionModels.length > 0) {
        return visionModels[0]
      }
    }

    return this.getActiveModel()
  }

  async healthCheck(): Promise<HealthCheckDetail> {
    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/tags`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(5000),
      })

      if (response.ok) {
        const data = await response.json()
        const modelCount = (data.models || []).length

        return {
          type: "model",
          status: "healthy",
          message: `Ollama 連接成功 (${modelCount} 個模型)`,
          confidence: 0.95,
          metrics: { models: modelCount },
        }
      }

      return {
        type: "model",
        status: "warning",
        message: "Ollama 回應異常",
        confidence: 0.7,
      }
    } catch {
      return {
        type: "model",
        status: "warning",
        message: "本地模型運行中",
        confidence: 0.6,
      }
    }
  }

  async chat(
    messages: { role: string; content: string }[],
    options?: { model?: string; stream?: boolean },
  ): Promise<{ message: { content: string }; done: boolean }> {
    const model = options?.model || this.activeModel

    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
        }),
      })

      if (response.ok) {
        return await response.json()
      }

      throw new Error(`Ollama API error: ${response.status}`)
    } catch (error) {
      log.error("Chat error", { error: String(error) })
      throw error
    }
  }

  isConnected(): boolean {
    return this.isOllamaConnected
  }

  getRecommendedProviders(): string {
    return `推薦免費模型供應商
═══════════════════════════════

1. Groq (https://console.groq.com)
   - 免費配額: 30 requests/min
   - 速度: 極快 (GPU加速)
   - 擅長: 快速對話、程式碼

2. Together AI (https://together.ai)
   - 免費額度: $5 credit
   - 擅長: 多模態、推理

3. OpenRouter (https://openrouter.ai)
   - 部分模型免費
   - 擅長: 多模型比較

4. Cloudflare Workers AI
   - 免費額度: 10,000 neurons/day
   - 擅長: 邊緣運算、低延遲

5. 本地 Ollama
   - 完全免費，離線可用
   - 擅長: 隱私保護、無限使用

設定環境變數:
  export GROQ_API_KEY=your_key
  export TOGETHER_API_KEY=your_key`
  }

  getModelDescription(name: string): string {
    const normalize = (s: string) => s.toLowerCase().replace(/[:\-\s]/g, "")
    const normName = normalize(name)

    const descs: [string, string][] = [
      ["qwen2.5coder", "Qwen2.5 Coder - 程式碼生成、重構、Debug"],
      ["qwen3coder", "Qwen3 Coder - 程式碼生成、重構、Debug"],
      ["qwen3", "Qwen3 - 最新版本，邏輯推理、數學解題"],
      ["deepseekr1", "DeepSeek R1 - 思考鏈、數學證明、競賽題"],
      ["deepseek", "DeepSeek - 深度推理、複雜問題分析"],
      ["qwen", "Qwen - 阿里通義千問，擅長中文對話、知識問答"],
      ["llama3", "Llama3 - 最新版本，代碼、多模態"],
      ["codellama", "CodeLlama - 程式碼生成，解釋、重構"],
      ["moondream", "Moondream - 圖片理解、視覺分析"],
      ["llava", "LLaVA - 多模態、圖片問答"],
      ["mixtral", "Mixtral - 混合專家架構，高效推理"],
      ["mistral", "Mistral - 法國開源模型，翻譯、摘要"],
      ["llama", "Llama - Meta開源，通用對話、多語言"],
      ["phi", "Phi - 微軟小型模型，快速響應"],
      ["gemma", "Gemma - Google輕量模型，高效"],
    ]

    for (const [key, desc] of descs) {
      if (normName.includes(key)) return desc
    }
    return name
  }

  async checkProviders(): Promise<CloudProvider[]> {
    const providers: CloudProvider[] = []

    for (const [id, config] of Object.entries(SUPPORTED_PROVIDERS)) {
      const apiKey = this.getApiKey(config.envVars)
      const status = apiKey ? await this.testConnection(id, apiKey, config.baseURL) : "disconnected"

      providers.push({
        id,
        name: config.name,
        apiKey,
        baseURL: config.baseURL,
        status,
        models: config.freeModels || [],
        free: config.freeModels !== undefined,
      })
    }

    return providers
  }

  private getApiKey(envVars: string[]): string | undefined {
    for (const envVar of envVars) {
      const key = process.env[envVar]
      if (key) return key
    }
    return undefined
  }

  private async testConnection(providerId: string, apiKey: string, baseURL?: string): Promise<CloudProvider["status"]> {
    if (!baseURL) return "disconnected"

    try {
      const resp = await fetch(`${baseURL}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(5000),
      })
      return resp.ok ? "connected" : "error"
    } catch {
      return "error"
    }
  }

  async checkFreeProviders(): Promise<string> {
    const providers = await this.checkProviders()
    let output = "API 狀態檢測（與官方 opencode 相容）\n═══════════════════════════════════════════\n\n"

    for (const p of providers) {
      const icon = p.status === "connected" ? "✅" : p.status === "error" ? "⚠️" : "❌"
      output += `${icon} ${p.name} - ${p.status === "connected" ? "已連接" : p.status === "error" ? "連線錯誤" : "未設定"}\n`

      if (!p.apiKey) {
        const config = SUPPORTED_PROVIDERS[p.id]
        output += `   環境變數: ${config.envVars.join(", ")}\n`
      }

      if (p.free && p.models.length > 0) {
        output += `   免費模型: ${p.models.slice(0, 3).join(", ")}${p.models.length > 3 ? "..." : ""}\n`
      }
      output += "\n"
    }

    output += "設定環境變數（與官方 opencode 相同）:\n"
    output += "  export GROQ_API_KEY=gsk_xxxx        # Groq（推薦，最快）\n"
    output += "  export TOGETHER_API_KEY=xxxx       # Together AI\n"
    output += "  export OPENROUTER_API_KEY=sk-or-xxxx  # OpenRouter\n"
    output += "  export DEEPINFRA_API_KEY=xxxx      # DeepInfra\n"
    output += "  export CEREBRAS_API_KEY=xxxx       # Cerebras\n\n"
    output += "或設定在 ~/.config/opencode/opencode.json:\n"
    output += '  { "provider": { "groq": { "options": { "apiKey": "your-key" } } } }\n'

    return output
  }

  getAvailableModels(): LocalModel[] {
    return Array.from(this.models.values()).filter((m) => m.status === "active")
  }

  async loadFromOpencodeConfig(): Promise<void> {
    const configPaths = [
      join(homedir(), ".config", "opencode", "opencode.json"),
      join(homedir(), ".config", "opencode", "opencode.jsonc"),
      join(homedir(), ".config", "opencode", "config.json"),
    ]

    for (const configPath of configPaths) {
      if (existsSync(configPath)) {
        try {
          const content = await Bun.file(configPath).text()
          const config = JSON.parse(content)

          if (config.provider) {
            for (const [providerId, providerConfig] of Object.entries(config.provider)) {
              const p = providerConfig as any
              if (p.options?.apiKey) {
                log.info(`Found API key for ${providerId} in opencode config`)
              }
            }
          }
        } catch (e) {
          log.warn(`Failed to load opencode config: ${configPath}`)
        }
        break
      }
    }
  }
}
