// Plugin Hook 系統 - 援用官方 opencode 模式

import { Log } from "../util/log";
import type { CLIContext, CLIState } from "./core";

export const log = Log.create({ service: "plugin-hook" });

// ============================================
// Hook 類型定義
// ============================================

export type HookName = 
  | "cli.init"
  | "cli.start"
  | "cli.shutdown"
  | "cli.beforeinput"
  | "cli.afteroutput"
  | "chat.before"
  | "chat.after"
  | "chat.error"
  | "tool.before"
  | "tool.after"
  | "tool.error"
  | "session.create"
  | "session.save"
  | "session.load"
  | "model.before"
  | "model.after"
  | "provider.register"
  | "command.register"
  | "error.handle";

export interface HookInput {
  "cli.init": { state: CLIState };
  "cli.start": { state: CLIState };
  "cli.shutdown": { state: CLIState };
  "cli.beforeinput": { input: string; state: CLIState };
  "cli.afteroutput": { output: string; state: CLIState };
  "chat.before": { message: string; context: CLIContext };
  "chat.after": { message: string; response: string; context: CLIContext };
  "chat.error": { message: string; error: Error; context: CLIContext };
  "tool.before": { tool: string; input: any };
  "tool.after": { tool: string; input: any; output: any };
  "tool.error": { tool: string; input: any; error: Error };
  "session.create": { sessionId: string; context: CLIContext };
  "session.save": { sessionId: string };
  "session.load": { sessionId: string };
  "model.before": { model: string; provider: string };
  "model.after": { model: string; provider: string; result: any };
  "provider.register": { provider: ProviderDefinition };
  "command.register": { command: CommandDefinition };
  "error.handle": { error: Error; context: CLIContext };
}

export type HookOutput = {
  "cli.init": void;
  "cli.start": void;
  "cli.shutdown": void;
  "cli.beforeinput": string | void;
  "cli.afteroutput": void;
  "chat.before": string | void;
  "chat.after": void;
  "chat.error": void;
  "tool.before": any;
  "tool.after": void;
  "tool.error": void;
  "session.create": void;
  "session.save": void;
  "session.load": any;
  "model.before": string | void;
  "model.after": void;
  "provider.register": void;
  "command.register": void;
  "error.handle": Error | void;
};

export type HookFunction<N extends HookName> = (
  input: HookInput[N]
) => Promise<HookOutput[N]>;

// ============================================
// Plugin 介面
// ============================================

export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
}

export interface Plugin {
  metadata: PluginMetadata;
  hooks: Partial<Record<HookName, HookFunction<any>>>;
  tools?: ToolDefinition[];
  providers?: ProviderDefinition[];
  commands?: CommandDefinition[];
  init?: (context: CLIContext) => Promise<void>;
  shutdown?: () => Promise<void>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters?: Record<string, any>;
  handler: (input: any, context: CLIContext) => Promise<any>;
}

export interface CommandDefinition {
  name: string;
  description: string;
  aliases?: string[];
  usage?: string;
  handler: (args: string[], context: CLIContext, state: CLIState) => Promise<string>;
}

export interface ProviderDefinition {
  id: string;
  name: string;
  baseURL?: string;
  apiKeyEnv?: string[];
  models: string[];
  free?: boolean;
}

// ============================================
// Hook Manager
// ============================================

export class HookManager {
  private hooks: Map<HookName, Set<HookFunction<any>>> = new Map();
  
  register<N extends HookName>(name: N, fn: HookFunction<N>): void {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, new Set());
    }
    this.hooks.get(name)!.add(fn);
    log.info(`Hook registered: ${name}`);
  }
  
  async trigger<N extends HookName>(name: N, input: HookInput[N]): Promise<HookOutput[N]> {
    const handlers = this.hooks.get(name);
    if (!handlers || handlers.size === 0) {
      return undefined as HookOutput[N];
    }
    
    let result: HookOutput[N];
    for (const handler of handlers) {
      try {
        result = await handler(input);
      } catch (error) {
        log.error(`Hook error: ${name}`, { error });
        throw error;
      }
    }
    return result as HookOutput[N];
  }
  
  unregister<N extends HookName>(name: N, fn: HookFunction<N>): boolean {
    const handlers = this.hooks.get(name);
    if (!handlers) return false;
    return handlers.delete(fn);
  }
  
  has(name: HookName): boolean {
    return (this.hooks.get(name)?.size ?? 0) > 0;
  }
  
  listHooks(): HookName[] {
    return Array.from(this.hooks.entries())
      .filter(([_, handlers]) => handlers.size > 0)
      .map(([name]) => name);
  }
}

// ============================================
// Plugin Manager
// ============================================

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private hookManager: HookManager;
  private enabled: boolean = true;
  
  constructor() {
    this.hookManager = new HookManager();
  }
  
  async load(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.metadata.name)) {
      log.warn(`Plugin ${plugin.metadata.name} already loaded`);
      return;
    }
    
    log.info(`Loading plugin: ${plugin.metadata.name} v${plugin.metadata.version}`);
    
    // 註冊 hooks
    if (plugin.hooks) {
      for (const [name, fn] of Object.entries(plugin.hooks)) {
        if (fn) {
          this.hookManager.register(name as HookName, fn as HookFunction<any>);
        }
      }
    }
    
    this.plugins.set(plugin.metadata.name, plugin);
    log.info(`Plugin loaded: ${plugin.metadata.name}`);
  }
  
  async unload(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      log.warn(`Plugin not found: ${name}`);
      return;
    }
    
    // 觸發 shutdown hook
    if (plugin.shutdown) {
      await plugin.shutdown();
    }
    
    // 移除所有 hooks
    // Note: 需要保存 hook 引用才能移除
    
    this.plugins.delete(name);
    log.info(`Plugin unloaded: ${name}`);
  }
  
  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }
  
  list(): Plugin[] {
    return Array.from(this.plugins.values());
  }
  
  listMetadata(): PluginMetadata[] {
    return this.list().map(p => p.metadata);
  }
  
  has(name: string): boolean {
    return this.plugins.has(name);
  }
  
  getHookManager(): HookManager {
    return this.hookManager;
  }
  
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    log.info(`Plugin system ${enabled ? "enabled" : "disabled"}`);
  }
  
  isEnabled(): boolean {
    return this.enabled;
  }
}

// ============================================
// 內建 Plugin 範例
// ============================================

export function createBuiltinPlugins(): Plugin[] {
  return [
    // Logger Plugin
    {
      metadata: { name: "builtin-logger", version: "1.0.0" },
      hooks: {
        "cli.start": async ({ state }) => {
          log.info("CLI started", { session: state.getSessionId() });
        },
        "cli.shutdown": async ({ state }) => {
          log.info("CLI shutdown", { session: state.getSessionId() });
        },
        "chat.after": async ({ message, response }) => {
          log.debug("Chat completed", { messageLength: message.length, responseLength: response.length });
        },
      },
    },
    
    // Memory Plugin
    {
      metadata: { name: "builtin-memory", version: "1.0.0" },
      hooks: {
        "chat.after": async ({ message, context }) => {
          // 保存對話到記憶
          log.debug("Memory: saved conversation", { session: context.sessionId });
        },
      },
    },
    
    // Error Handler Plugin
    {
      metadata: { name: "builtin-error", version: "1.0.0" },
      hooks: {
        "error.handle": async ({ error }) => {
          log.error("Error handled", { message: error.message });
          return error; // 可以修改或包裝錯誤
        },
        "tool.error": async ({ tool, error }) => {
          log.error(`Tool error: ${tool}`, { error: error.message });
        },
        "chat.error": async ({ message, error }) => {
          log.error("Chat error", { message, error: error.message });
        },
      },
    },
  ];
}
