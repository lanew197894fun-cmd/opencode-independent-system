import z from "zod";
import { Log } from "./util/log";

const log = Log.create({ service: "ji-san-ji-model" });

export interface LocalModel {
  id: string;
  name: string;
  provider: string;
  size: string;
  capabilities: {
    text: boolean;
    code: boolean;
    reasoning: boolean;
    toolcall: boolean;
    vision: boolean;
  };
  status: "active" | "inactive" | "error";
  latency: number;
  confidence: number;
}

interface HealthCheckDetail {
  type:
    | "model"
    | "search"
    | "knowledge"
    | "problem-solver"
    | "system"
    | "network"
    | "storage";
  status: "healthy" | "warning" | "critical";
  message: string;
  confidence: number;
  metrics?: Record<string, number>;
}

interface ModelPerformance {
  responseTime: number;
  accuracy: number;
  cost: number;
}

interface OllamaModel {
  name: string;
  model: string;
  size: number;
  modified_at: string;
}

export class ModelManager {
  private models: Map<string, LocalModel> = new Map();
  private activeModel: string = "qwen3:8b";
  private modelQueue: string[] = [
    "qwen3:8b",
    "qwen2.5-coder:1.5b",
    "deepseek-r1:7b",
  ];
  private performance: Map<string, ModelPerformance> = new Map();
  private ollamaBaseUrl = "http://127.0.0.1:11434";
  private isOllamaConnected = false;

  constructor() {
    this.initializeDefaultModels();
    this.connectToOllama();
  }

  private async connectToOllama() {
    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/tags`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        const ollamaModels: OllamaModel[] = data.models || [];

        log.info("Connected to Ollama", { count: ollamaModels.length });

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
          };

          this.models.set(m.name, modelInfo);
        });

        this.isOllamaConnected = true;

        if (ollamaModels.length > 0) {
          this.activeModel = ollamaModels[0].name;
          this.modelQueue = ollamaModels.map((m) => m.name);
        }

        log.info("Ollama models loaded", { models: this.modelQueue });
      }
    } catch (error) {
      log.warn("Failed to connect to Ollama", { error: String(error) });
      this.isOllamaConnected = false;
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
      ];

      defaultModels.forEach((model) => this.models.set(model.id, model));
    }
  }

  async getModel(modelId: string): Promise<LocalModel | undefined> {
    return this.models.get(modelId);
  }

  async getActiveModel(): Promise<LocalModel> {
    const model = this.models.get(this.activeModel);
    if (!model) throw new Error(`Active model ${this.activeModel} not found`);
    return model;
  }

  async setActiveModel(modelId: string): Promise<boolean> {
    const model = this.models.get(modelId);
    if (!model) return false;
    this.activeModel = modelId;
    return true;
  }

  async getAvailableModels(): Promise<LocalModel[]> {
    return Array.from(this.models.values());
  }

  async getVisionModels(): Promise<LocalModel[]> {
    return Array.from(this.models.values()).filter(
      (m) => m.capabilities.vision,
    );
  }

  async getCodeModels(): Promise<LocalModel[]> {
    return Array.from(this.models.values()).filter((m) => m.capabilities.code);
  }

  async selectModel(
    problem: { type: string; description: string },
    context?: Record<string, unknown>,
  ): Promise<LocalModel> {
    if (problem.type === "code" || problem.description.includes("code")) {
      const codeModels = await this.getCodeModels();
      if (codeModels.length > 0) {
        return codeModels[0];
      }
    }

    if (problem.type === "vision" || problem.description.includes("image")) {
      const visionModels = await this.getVisionModels();
      if (visionModels.length > 0) {
        return visionModels[0];
      }
    }

    return this.getActiveModel();
  }

  async healthCheck(): Promise<HealthCheckDetail> {
    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/tags`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        const modelCount = (data.models || []).length;

        return {
          type: "model",
          status: "healthy",
          message: `Ollama 連接成功 (${modelCount} 個模型)`,
          confidence: 0.95,
          metrics: { models: modelCount },
        };
      }

      return {
        type: "model",
        status: "warning",
        message: "Ollama 回應異常",
        confidence: 0.7,
      };
    } catch {
      return {
        type: "model",
        status: "warning",
        message: "本地模型運行中",
        confidence: 0.6,
      };
    }
  }

  async chat(
    messages: { role: string; content: string }[],
    options?: { model?: string; stream?: boolean },
  ): Promise<{ message: { content: string }; done: boolean }> {
    const model = options?.model || this.activeModel;

    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
        }),
      });

      if (response.ok) {
        return await response.json();
      }

      throw new Error(`Ollama API error: ${response.status}`);
    } catch (error) {
      log.error("Chat error", { error: String(error) });
      throw error;
    }
  }

  isConnected(): boolean {
    return this.isOllamaConnected;
  }
}
