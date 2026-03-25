// CLI v2 插件整合層
// 整合現有的 plugins 到 CLI v2

import { Log } from "../util/log";
import type { CLIContext } from "./core";
import type { Plugin, HookName, HookFunction } from "./plugin-system";

export const log = Log.create({ service: "plugin-integrator" });

// ============================================
// 整合的插件
// ============================================

export async function loadLegacyPlugins(
  hookManager: any,
  context: CLIContext
): Promise<void> {
  log.info("Loading legacy plugins for CLI v2");
  
  try {
    // 動態導入現有插件
    const legacy = await import("../plugin-system");
    
    // 創建 CLI v2 Hook 到舊插件的橋接
    const bridge = createLegacyBridge(legacy, hookManager, context);
    
    // 載入預設插件
    const defaultPlugins = legacy.getDefaultPlugins();
    
    for (const plugin of defaultPlugins) {
      try {
        await bridge.registerPlugin(plugin);
        log.info(`Registered legacy plugin: ${plugin.metadata?.name || "unknown"}`);
      } catch (e) {
        log.warn(`Failed to register plugin`, { error: String(e) });
      }
    }
    
    log.info(`Loaded ${defaultPlugins.length} legacy plugins`);
    
  } catch (e) {
    log.warn("Failed to load legacy plugins", { error: String(e) });
  }
}

// ============================================
// Bridge 類別
// ============================================

class LegacyBridge {
  private legacy: any;
  private hookManager: any;
  private context: CLIContext;
  
  constructor(legacy: any, hookManager: any, context: CLIContext) {
    this.legacy = legacy;
    this.hookManager = hookManager;
    this.context = context;
  }
  
  async registerPlugin(plugin: any): Promise<void> {
    // 處理不同的插件格式
    if (plugin.metadata) {
      // PluginInstance 格式
      this.registerFromMetadata(plugin);
    } else if (typeof plugin === "function") {
      // 工廠函數格式
      const instance = await plugin();
      this.registerFromMetadata(instance);
    }
  }
  
  private async registerFromMetadata(plugin: any): Promise<void> {
    const name = plugin.metadata?.name || "unknown";
    
    // 嘗試從插件獲取 hooks
    if (plugin.hooks) {
      for (const [hookName, hookFn] of Object.entries(plugin.hooks)) {
        if (typeof hookFn === "function") {
          this.hookManager.register(hookName as HookName, hookFn as HookFunction<any>);
        }
      }
    }
    
    // 處理 skill 格式的插件
    if (plugin.skill) {
      this.registerSkillPlugin(plugin);
    }
  }
  
  private registerSkillPlugin(plugin: any): void {
    const skill = plugin.skill;
    
    if (!skill?.triggers) return;
    
    // 為每個 trigger 註冊 hook
    for (const trigger of skill.triggers) {
      const hookName = this.getHookForTrigger(trigger);
      if (hookName) {
        this.hookManager.register(hookName, async (input: any) => {
          if (skill.executor) {
            return await skill.executor(input, this.context);
          }
        });
      }
    }
  }
  
  private getHookForTrigger(trigger: string): HookName | null {
    const mapping: Record<string, HookName> = {
      "memory": "chat.before",
      "security": "cli.init",
      "menu": "cli.start",
      "repair": "chat.after",
      "channel": "chat.after",
    };
    
    return mapping[trigger] || null;
  }
}

function createLegacyBridge(legacy: any, hookManager: any, context: CLIContext): LegacyBridge {
  return new LegacyBridge(legacy, hookManager, context);
}

// ============================================
// Memory Plugin for CLI v2
// ============================================

export function createMemoryPluginForV2(): Plugin {
  let memory: string[] = [];
  
  return {
    metadata: {
      name: "memory-v2",
      version: "1.0.0",
      description: "CLI v2 記憶系統",
    },
    hooks: {
      "chat.before": async ({ message }) => {
        // 保存用戶訊息
        memory.push(`[user] ${message}`);
        return message;
      },
      "chat.after": async ({ message, response }) => {
        // 保存回應
        memory.push(`[assistant] ${response}`);
        
        // 限制記憶大小
        if (memory.length > 100) {
          memory = memory.slice(-100);
        }
      },
      "cli.init": async () => {
        memory = [];
        log.info("Memory plugin initialized");
      },
      "cli.shutdown": async () => {
        log.info("Memory plugin shutdown", { entries: memory.length });
      },
    },
  };
}

// ============================================
// Security Plugin for CLI v2
// ============================================

export function createSecurityPluginForV2(): Plugin {
  let isEnabled = true;
  
  return {
    metadata: {
      name: "security-v2",
      version: "1.0.0",
      description: "CLI v2 安全系統",
    },
    hooks: {
      "cli.init": async () => {
        isEnabled = true;
        log.info("Security plugin initialized");
      },
      "chat.before": async ({ message }) => {
        if (!isEnabled) return message;
        
        // 簡單的安全檢查
        const dangerous = ["rm -rf", "sudo rm", ":(){ :|:& };:", "curl | sh"];
        for (const d of dangerous) {
          if (message.includes(d)) {
            log.warn("Dangerous command detected", { pattern: d });
            return `[安全警告] 已攔截危險指令`;
          }
        }
        
        return message;
      },
    },
  };
}

// ============================================
// Repair Plugin for CLI v2
// ============================================

export function createRepairPluginForV2(): Plugin {
  const repairs: { date: string; items: string[] }[] = [
    { date: "2026-03-22", items: ["CLI v2 插件系統建立", "Provider 系統整合"] },
    { date: "2026-03-21", items: ["獨立 CLI v1 建立", "基礎 REPL 實作"] },
  ];
  
  return {
    metadata: {
      name: "repair-v2",
      version: "1.0.0",
      description: "CLI v2 維修記錄系統",
    },
    hooks: {
      "chat.after": async ({ message, response }) => {
        // 檢測維修相關對話
        if (message.toLowerCase().includes("repair") || 
            message.includes("維修") ||
            message.includes("修復")) {
          repairs[0].items.push(`${message.slice(0, 50)}...`);
        }
      },
    },
  };
}

// ============================================
// 導出所有 CLI v2 插件
// ============================================

export function getV2Plugins(): Plugin[] {
  return [
    createMemoryPluginForV2(),
    createSecurityPluginForV2(),
    createRepairPluginForV2(),
  ];
}
