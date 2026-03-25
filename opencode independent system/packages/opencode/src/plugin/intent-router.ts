import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import { Config } from "../config/config"
import { Skill } from "../skill/skill"
import { Log } from "../util/log"
import { getResourceStatus, type ResourceThresholds } from "./resource-monitor"
import { TuiEvent } from "../cli/cmd/tui/event"
import { Bus } from "../bus"
import os from "os"

const log = Log.create({ service: "intent-router" })

export interface IntentConfig {
  keywords: string[]
  plugins: string[]
  skills: string[]
  description: string
}

export interface ResourcePolicy {
  lowMemoryMB: number
  minFreeSlots: number
}

const DEFAULT_INTENTS: Record<string, IntentConfig> = {
  memory: {
    keywords: ["記憶", "之前", "經驗", "similar", "related", "教訓", "原則"],
    plugins: [],
    skills: ["memory-pro", "ai-memory"],
    description: "長期記憶與經驗回顧",
  },
  debug: {
    keywords: ["錯誤", "bug", "修復", "exception", "failed", "修復"],
    plugins: [],
    skills: ["ai-debug", "self-repair"],
    description: "錯誤偵測與自動修復",
  },
  agent: {
    keywords: ["swarm", "多代理", "協作", "分工", "同時處理"],
    plugins: ["swarm", "clawteam"],
    skills: [],
    description: "多代理協作系統",
  },
  system: {
    keywords: ["效能", "優化", "清理", "慢", "卡", "資源"],
    plugins: ["service-manager"],
    skills: ["system-optimizer", "system-repair"],
    description: "系統效能優化",
  },
  backup: {
    keywords: ["備份", "同步", "儲存", "save"],
    plugins: ["backup-sync"],
    skills: [],
    description: "資料備份與同步",
  },
  channel: {
    keywords: ["訊息", "通知", "telegram", "slack", "discord"],
    plugins: ["channel"],
    skills: [],
    description: "通訊頻道整合",
  },
  todo: {
    keywords: ["待辦", "任務", "todo", "task", "安排"],
    plugins: [],
    skills: ["things-mac", "trello"],
    description: "任務管理整合",
  },
  knowledge: {
    keywords: ["學習", "知識", "經驗", "記錄", "lesson"],
    plugins: [],
    skills: ["ai-memory", "lesson"],
    description: "知識記錄系統",
  },
}

const DEFAULT_RESOURCE_POLICY: ResourcePolicy = {
  lowMemoryMB: 500,
  minFreeSlots: 3,
}

interface LoadedModule {
  plugins: Set<string>
  skills: Set<string>
  timestamp: number
}

const loadedModules = new Map<string, LoadedModule>()
const moduleLock = new Set<string>()

async function canLoadMore(policy: ResourcePolicy): Promise<boolean> {
  const status = await getResourceStatus({
    lowMemoryMB: policy.lowMemoryMB,
    minFreeSlots: policy.minFreeSlots,
    maxLoadAverage: 8,
  })
  return status.canLoadMore
}

async function loadPlugin(name: string): Promise<boolean> {
  if (moduleLock.has(name)) return false

  moduleLock.add(name)
  try {
    const config = await Config.get()
    const plugins = config.plugin ?? []

    if (!plugins.includes(name)) {
      plugins.push(name)
      log.info("dynamically loaded plugin", { name })
    }

    return true
  } catch (err) {
    log.error("failed to load plugin", { name, err })
    return false
  } finally {
    setTimeout(() => moduleLock.delete(name), 5000)
  }
}

async function loadSkill(name: string): Promise<boolean> {
  if (moduleLock.has(`skill:${name}`)) return false

  moduleLock.add(`skill:${name}`)
  try {
    const skill = await Skill.get(name)
    if (skill) {
      log.info("dynamically loaded skill", { name })
      return true
    }
    log.warn("skill not found", { name })
    return false
  } catch (err) {
    log.error("failed to load skill", { name, err })
    return false
  } finally {
    setTimeout(() => moduleLock.delete(`skill:${name}`), 5000)
  }
}

function detectIntent(message: string, intents: Record<string, IntentConfig>): string[] {
  const lower = message.toLowerCase()
  const matched: string[] = []

  for (const [name, config] of Object.entries(intents)) {
    for (const keyword of config.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        matched.push(name)
        break
      }
    }
  }

  return matched
}

export const intentRouterPlugin = async (input: PluginInput): Promise<Hooks> => {
  const sessionLoads = new Map<string, { intents: string[]; loaded: Set<string> }>()
  let configLoaded = false
  let intents: Record<string, IntentConfig> = DEFAULT_INTENTS
  let resourcePolicy: ResourcePolicy = DEFAULT_RESOURCE_POLICY

  const getSessionState = (sessionID: string) => {
    if (!sessionLoads.has(sessionID)) {
      sessionLoads.set(sessionID, { intents: [], loaded: new Set() })
    }
    return sessionLoads.get(sessionID)!
  }

  const buildSystemPrompt = (loaded: Set<string>, matchedIntents: string[]): string => {
    if (loaded.size === 0) return ""

    const parts: string[] = ["\n[智慧模組已啟用]\n"]

    const pluginNames = Array.from(loaded).filter((x) => !x.startsWith("skill:"))
    const skillNames = Array.from(loaded)
      .filter((x) => x.startsWith("skill:"))
      .map((x) => x.slice(6))

    if (pluginNames.length > 0) {
      parts.push(`插件: ${pluginNames.join(", ")}`)
    }
    if (skillNames.length > 0) {
      parts.push(`技能: ${skillNames.join(", ")}`)
    }

    parts.push("\n## 觸發規則")
    for (const intentName of matchedIntents) {
      const config = intents[intentName]
      if (config) {
        parts.push(`- ${intentName}: ${config.description}`)
      }
    }

    parts.push("\n## 資源管理")
    parts.push("- 非必要模組完成任務後可卸載")
    parts.push("- 低資源時自動限制載入")

    return parts.join("\n")
  }

  return {
    config: async (config: any) => {
      if (configLoaded) return
      configLoaded = true

      if (config.intentMap) {
        intents = { ...DEFAULT_INTENTS, ...config.intentMap }
        log.info("loaded custom intent map", { count: Object.keys(intents).length })
      }

      if (config.resourcePolicy) {
        resourcePolicy = { ...DEFAULT_RESOURCE_POLICY, ...config.resourcePolicy }
        log.info("loaded resource policy", resourcePolicy)
      }
    },

    "chat.message": async (
      { sessionID, messageID }: { sessionID?: string; messageID?: string },
      { message, parts }: { message: any; parts: any[] },
    ) => {
      const session = getSessionState(sessionID ?? "default")
      const messageText = typeof message === "string" ? message : (message.content?.[0]?.text ?? "")
      const lowerMessage = messageText.toLowerCase()

      if (lowerMessage.includes("技能") || lowerMessage.includes("skill")) {
        Bus.publish(TuiEvent.ToastShow, {
          message: "正在載入技能...",
          variant: "info" as const,
          duration: 3000,
        })
        parts.push({ type: "text", text: "\n[技能系統] 正在載入技能..." })
      }

      const matchedIntents = detectIntent(messageText, intents)

      if (matchedIntents.length === 0) {
        return
      }

      if (!(await canLoadMore(resourcePolicy))) {
        log.warn("resource limit reached, skipping intent load", {
          sessionID,
          intents: matchedIntents,
        })
        return
      }

      const newLoads: string[] = []

      for (const intentName of matchedIntents) {
        if (session.intents.includes(intentName)) continue

        session.intents.push(intentName)
        const config = intents[intentName]

        for (const pluginName of config.plugins) {
          if (!session.loaded.has(pluginName)) {
            await loadPlugin(pluginName)
            session.loaded.add(pluginName)
            newLoads.push(pluginName)
          }
        }

        for (const skillName of config.skills) {
          const key = `skill:${skillName}`
          if (!session.loaded.has(key)) {
            await loadSkill(skillName)
            session.loaded.add(key)
            newLoads.push(skillName)
          }
        }
      }

      if (newLoads.length > 0) {
        const systemPrompt = buildSystemPrompt(session.loaded, matchedIntents)
        if (systemPrompt) {
          parts.push({ type: "text", text: systemPrompt })
        }
        const loadedSkills = Array.from(session.loaded)
          .filter((x) => x.startsWith("skill:"))
          .map((x) => x.slice(6))
        if (loadedSkills.length > 0) {
          Bus.publish(TuiEvent.ToastShow, {
            message: `已載入技能: ${loadedSkills.join(", ")}`,
            variant: "success" as const,
            duration: 5000,
          })
          parts.push({ type: "text", text: `\n[✅] 已載入技能: ${loadedSkills.join(", ")}` })
        }
        log.info("loaded modules for session", {
          sessionID,
          loaded: newLoads,
          intents: matchedIntents,
        })
      }
    },

    event: async (input: { event: any }) => {
      if (input.event?.type === "error" || input.event?.error) {
        if (!(await canLoadMore(resourcePolicy))) return

        const sessionID = input.event.sessionID ?? "system"
        const session = getSessionState(sessionID)

        if (!session.loaded.has("skill:ai-debug")) {
          await loadSkill("ai-debug")
          session.loaded.add("skill:ai-debug")
          log.info("auto-loaded debug skill on error", { sessionID })
        }
      }
    },
  }
}
