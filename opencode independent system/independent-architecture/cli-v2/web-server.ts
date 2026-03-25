// Web Server 整合方案
// 讀取官方 opencode 設定，管理 API Key

import { Log } from "../util/log";
import { homedir } from "os";
import { join } from "path";
import { existsSync, readFileSync } from "fs";

export const log = Log.create({ service: "web-server" });

// ============================================
// 官方設定路徑
// ============================================

const OPENCODE_CONFIG_PATHS = [
  join(homedir(), ".config", "opencode", "opencode.json"),
  join(homedir(), ".config", "opencode", "opencode.jsonc"),
  join(homedir(), ".config", "opencode", "config.json"),
  join(homedir(), ".config", "opencode", "config.toml"),
];

// ============================================
// 設定檔案結構
// ============================================

interface OpencodeConfig {
  provider?: Record<string, ProviderConfig>;
  model?: string;
  disabled_providers?: string[];
  enabled_providers?: string[];
}

interface ProviderConfig {
  options?: {
    apiKey?: string;
    baseURL?: string;
    timeout?: number;
    [key: string]: any;
  };
  whitelist?: string[];
  blacklist?: string[];
}

// ============================================
// Web Server 類別
// ============================================

export class WebServerConfig {
  private config: OpencodeConfig | null = null;
  private configPath: string | null = null;
  
  constructor() {
    this.loadConfig();
  }
  
  private loadConfig(): void {
    for (const path of OPENCODE_CONFIG_PATHS) {
      if (existsSync(path)) {
        try {
          const content = readFileSync(path, "utf-8");
          this.config = this.parseConfig(content, path);
          this.configPath = path;
          log.info("Loaded opencode config", { path });
          break;
        } catch (e) {
          log.warn("Failed to load config", { path, error: String(e) });
        }
      }
    }
    
    if (!this.config) {
      log.info("No opencode config found, using defaults");
    }
  }
  
  private parseConfig(content: string, path: string): OpencodeConfig | null {
    const ext = path.split(".").pop()?.toLowerCase();
    
    try {
      if (ext === "json") {
        return JSON.parse(content);
      }
      
      if (ext === "jsonc") {
        // 移除註釋
        const clean = content.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
        return JSON.parse(clean);
      }
      
      if (ext === "toml") {
        // 簡單 TOML 解析（可擴展）
        return this.parseSimpleToml(content);
      }
    } catch (e) {
      log.warn("Config parse error", { path, error: String(e) });
    }
    
    return null;
  }
  
  private parseSimpleToml(content: string): any {
    const result: any = {};
    let section = result;
    
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      
      // 註釋
      if (trimmed.startsWith("#") || trimmed.startsWith("//")) continue;
      
      // Section
      const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
      if (sectionMatch) {
        const path = sectionMatch[1].split(".");
        section = result;
        for (const key of path) {
          if (!section[key]) section[key] = {};
          section = section[key];
        }
        continue;
      }
      
      // Key = Value
      const kvMatch = trimmed.match(/^([^=]+)=(.+)$/);
      if (kvMatch) {
        const key = kvMatch[1].trim();
        let value = kvMatch[2].trim();
        
        // 移除引號
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        section[key] = value;
      }
    }
    
    return result;
  }
  
  // ============================================
  // API Key 讀取
  // ============================================
  
  getProviderApiKey(providerId: string): string | undefined {
    // 1. 先檢查環境變數
    const envVar = this.getProviderEnvVar(providerId);
    if (envVar && process.env[envVar]) {
      return process.env[envVar];
    }
    
    // 2. 再檢查設定檔
    if (this.config?.provider?.[providerId]?.options?.apiKey) {
      return this.config.provider[providerId].options!.apiKey;
    }
    
    return undefined;
  }
  
  private getProviderEnvVar(providerId: string): string | undefined {
    const mapping: Record<string, string> = {
      "groq": "GROQ_API_KEY",
      "together": "TOGETHER_API_KEY",
      "openrouter": "OPENROUTER_API_KEY",
      "deepinfra": "DEEPINFRA_API_KEY",
      "cerebras": "CEREBRAS_API_KEY",
      "anthropic": "ANTHROPIC_API_KEY",
      "openai": "OPENAI_API_KEY",
      "mistral": "MISTRAL_API_KEY",
      "google": "GOOGLE_API_KEY",
      "vertex": "GOOGLE_CLOUD_PROJECT",
      "azure": "AZURE_OPENAI_API_KEY",
      "perplexity": "PERPLEXITY_API_KEY",
      "xai": "XAI_API_KEY",
    };
    
    return mapping[providerId];
  }
  
  // ============================================
  // Provider 設定
  // ============================================
  
  getProviderConfig(providerId: string): ProviderConfig | undefined {
    return this.config?.provider?.[providerId];
  }
  
  getAllProviders(): Record<string, ProviderConfig> | undefined {
    return this.config?.provider;
  }
  
  isProviderEnabled(providerId: string): boolean {
    // 檢查是否被停用
    if (this.config?.disabled_providers?.includes(providerId)) {
      return false;
    }
    
    // 檢查是否在白名單中
    if (this.config?.enabled_providers) {
      return this.config.enabled_providers.includes(providerId);
    }
    
    return true;
  }
  
  // ============================================
  // 模型設定
  // ============================================
  
  getDefaultModel(): string | undefined {
    return this.config?.model;
  }
  
  // ============================================
  // 狀態輸出
  // ============================================
  
  getStatus(): string {
    let output = "官方 opencode 設定\n═══════════════════════════════════════\n\n";
    
    if (this.configPath) {
      output += `設定檔: ${this.configPath}\n\n`;
    } else {
      output += `設定檔: 無\n`;
      output += `預設使用環境變數\n\n`;
    }
    
    // 顯示 Provider 設定
    if (this.config?.provider) {
      for (const [id, cfg] of Object.entries(this.config.provider)) {
        const hasKey = !!cfg.options?.apiKey;
        const icon = hasKey ? "✅" : "❌";
        output += `${icon} ${id}\n`;
        if (hasKey) {
          output += `   API Key: 已設定\n`;
        }
        if (cfg.options?.baseURL) {
          output += `   Base URL: ${cfg.options.baseURL}\n`;
        }
      }
    } else {
      output += "未在設定檔中找到 Provider 設定\n";
      output += "請使用環境變數設定 API Key\n";
    }
    
    return output;
  }
}

// ============================================
// Singleton
// ============================================

let instance: WebServerConfig | null = null;

export function getWebServerConfig(): WebServerConfig {
  if (!instance) {
    instance = new WebServerConfig();
  }
  return instance;
}
