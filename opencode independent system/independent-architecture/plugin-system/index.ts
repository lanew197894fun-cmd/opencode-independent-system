// 插件系統導出索引
// 統一管理所有插件的導入和註冊

export * from "./skill-plugin.interface"
export * from "./plugin-loader"
export * from "./plugin-manager"
export * from "./memory-plugin"
export * from "./opencode-memory-plugin"
export * from "./security-plugin"
export * from "./menu-plugin"
export * from "./hfs-plugin"
export * from "./channel-plugin"

import { PluginInstance } from "./skill-plugin.interface"
import { createMemoryPlugin } from "./memory-plugin"
import { createOpenCodeMemoryPlugin } from "./opencode-memory-plugin"
import { createSecurityPlugin } from "./security-plugin"
import { createMenuPlugin } from "./menu-plugin"
import { createHFSPlugin } from "./hfs-plugin"
import { createChannelPlugin } from "./channel-plugin"

export interface PluginBundle {
  name: string
  plugins: PluginInstance[]
  version: string
}

export function getDefaultPlugins(): PluginInstance[] {
  return [
    createMemoryPlugin(),
    createOpenCodeMemoryPlugin(),
    createSecurityPlugin(),
    createMenuPlugin(),
    createHFSPlugin(),
    createChannelPlugin(),
  ]
}

export function getPluginBundle(): PluginBundle {
  return {
    name: "independent-architecture-plugin-bundle",
    version: "1.0.0",
    plugins: getDefaultPlugins(),
  }
}

export const PLUGIN_CATEGORIES = {
  MEMORY: "memory",
  SECURITY: "security",
  SEARCH: "search",
  MODEL: "model",
  KNOWLEDGE: "knowledge",
  MONITOR: "monitor",
  UTILITY: "utility",
} as const

export const PLUGIN_TRIGGERS = {
  MEMORY: ["memory", "記憶", "remember", "記住", "recall", "store"],
  SECURITY: ["security", "安全", "vpn", "defense", "sandbox", "dep", "rollback"],
  SKILL: ["skill", "skills", "技能", "index"],
  PROJECT: ["project", "專案", "項目", "context"],
  PROFILE: ["profile", "使用者", "偏好", "setting"],
  REPAIR: ["repair", "fix", "維修", "修復", "fixes"],
  MENU: ["menu", "選單", "功能", "services", "status"],
  LEARN: ["learn", "lesson", "學習", "study"],
  HISTORY: ["history", "對話", "conversation", "logs"],
  CHANNEL: ["channel", "channels", "頻道", "通知", "discord", "telegram", "slack", "webhook"],
  HFS: ["hfs", "http file", "檔案分享", "file sharing"],
} as const

export default {
  getDefaultPlugins,
  getPluginBundle,
  PLUGIN_CATEGORIES,
  PLUGIN_TRIGGERS,
}
