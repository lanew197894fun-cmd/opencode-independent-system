import { Config } from "../config/config"
import { Skill } from "../skill/skill"
import { Log } from "../util/log"
import { getResourceStatus, suggestModules, getLoadClass } from "./resource-monitor"
import type { ResourceStatus } from "./resource-monitor"
import { TuiEvent } from "../cli/cmd/tui/event"
import { Bus } from "../bus"

const log = Log.create({ service: "skill-autoload" })

export interface SkillPackage {
  name: string
  keywords: string[]
  description: string
  example?: string
  triggerPhrases?: string[]
}

const DEFAULT_PACKAGES: SkillPackage[] = [
  {
    name: "core",
    keywords: [],
    description: "核心功能（始終載入）",
  },
  {
    name: "memory",
    keywords: ["記憶", "之前", "經驗", "類似", "related", "教訓", "查一下", "有沒有記過"],
    description: "長期記憶系統",
    example: "查一下之前怎麼處理的",
    triggerPhrases: ["查一下", "有沒有記過", "之前的經驗", "類似情況"],
  },
  {
    name: "debug",
    keywords: ["錯誤", "bug", "修復", "exception", "failed", "當機", "报错", "崩潰"],
    description: "錯誤偵測與修復",
    example: "帮我看看这个错误",
    triggerPhrases: ["看看錯誤", "修復", "當機了", "报错"],
  },
  {
    name: "agent",
    keywords: ["swarm", "多代理", "協作", "分工", "虫群", "团队"],
    description: "多代理協作",
    example: "让多个代理一起处理",
    triggerPhrases: ["多個代理", "一起處理", "分工合作"],
  },
  {
    name: "system",
    keywords: ["效能", "優化", "清理", "慢", "卡", "效能"],
    description: "系統優化",
    example: "系统变慢了",
    triggerPhrases: ["變慢了", "優化", "清理", "效能不好"],
  },
  {
    name: "backup",
    keywords: ["備份", "同步", "儲存", "导出"],
    description: "資料備份",
    example: "帮我备份一下",
    triggerPhrases: ["備份", "同步", "導出"],
  },
  {
    name: "channel",
    keywords: ["訊息", "通知", "telegram", "slack", "discord", "line"],
    description: "通訊整合",
    example: "发消息到 telegram",
    triggerPhrases: ["發訊息", "通知", "telegram", "discord"],
  },
  {
    name: "todo",
    keywords: ["待辦", "任務", "todo", "task", "提醒"],
    description: "任務管理",
    example: "帮我记一下待办",
    triggerPhrases: ["待辦", "記一下", "提醒我", "任務"],
  },
  {
    name: "knowledge",
    keywords: ["知識庫", "知识库", "記錄", "记录"],
    description: "知識庫管理",
    example: "把这个记到知识库",
    triggerPhrases: ["記錄", "記住", "知識庫"],
  },
  {
    name: "ai-debug",
    keywords: ["AI_DEBUG", "自我修復", "debug", "检查"],
    description: "AI 自我修復",
    example: "AI_DEBUG",
    triggerPhrases: ["自我修復", "健康檢查", "debug"],
  },
]

const CORE_SKILLS = ["user-rules"]
const UNLOAD_THRESHOLD_MS = 5 * 60 * 1000

interface LoadedSkill {
  name: string
  loadedAt: number
  keywords: string[]
  triggerCount: number
}

export const skillAutoloadPlugin = async (input: any) => {
  const sessionState = new Map<
    string,
    {
      initialized: boolean
      loadedSkills: Map<string, LoadedSkill>
      lastActivity: number
      resourceStatus: ResourceStatus | null
    }
  >()
  let packages: SkillPackage[] = DEFAULT_PACKAGES

  const getSessionState = (sessionID: string) => {
    if (!sessionState.has(sessionID)) {
      sessionState.set(sessionID, {
        initialized: false,
        loadedSkills: new Map(),
        lastActivity: Date.now(),
        resourceStatus: null,
      })
    }
    return sessionState.get(sessionID)!
  }

  const findMatchingPackages = (message: string): SkillPackage[] => {
    const lower = message.toLowerCase()
    return packages.filter(
      (p) =>
        p.keywords.some((kw) => lower.includes(kw.toLowerCase())) ||
        p.triggerPhrases?.some((tp) => lower.includes(tp.toLowerCase())),
    )
  }

  const loadSkill = async (name: string, session: ReturnType<typeof getSessionState>): Promise<boolean> => {
    if (session.loadedSkills.has(name)) {
      session.loadedSkills.get(name)!.triggerCount++
      return true
    }

    const status = session.resourceStatus ?? (await getResourceStatus())
    if (!status.canLoadMore) {
      log.warn("resource limit, skipping load", { name, reason: status.reason })
      return false
    }

    const skill = await Skill.get(name)
    if (skill) {
      const pkg = packages.find((p) => p.name === name)
      session.loadedSkills.set(name, {
        name,
        loadedAt: Date.now(),
        keywords: pkg?.keywords ?? [],
        triggerCount: 1,
      })
      log.info("dynamically loaded skill", { name })
      return true
    }
    return false
  }

  const unloadUnusedSkills = async (session: ReturnType<typeof getSessionState>) => {
    const now = Date.now()
    const toUnload: string[] = []

    for (const [name, loaded] of session.loadedSkills) {
      if (CORE_SKILLS.includes(name)) continue
      if (now - loaded.loadedAt > UNLOAD_THRESHOLD_MS && loaded.triggerCount === 0) {
        toUnload.push(name)
      }
    }

    for (const name of toUnload) {
      session.loadedSkills.delete(name)
      log.info("unloaded unused skill", { name })
    }

    if (toUnload.length > 0) {
      Bus.publish(TuiEvent.ToastShow, {
        message: `已卸載 ${toUnload.length} 個閒置技能`,
        variant: "info" as const,
        duration: 3000,
      })
    }
  }

  const getSkillTriggerDescription = (pkg: SkillPackage): string => {
    const triggers = pkg.triggerPhrases?.slice(0, 3).join("、") ?? pkg.keywords.slice(0, 3).join("、")
    return triggers
  }

  const showBeginnerHelp = () => {
    const helpText = `
🎯 智慧技能系統 - 新手引導

你可以直接說需求，系統會自動偵測並載入相關技能：

${packages
  .filter((p) => p.triggerPhrases || p.keywords.length > 0)
  .map((p) => {
    const triggers = p.triggerPhrases?.slice(0, 3).join("、") ?? p.keywords.slice(0, 3).join("、")
    return `• ${p.description} - 當你說「${triggers}」時自動啟用`
  })
  .join("\n")}

💡 直接說出你的需求，系統會自動處理！
`.trim()
    return helpText
  }

  return {
    config: async (config: any) => {
      if (config.skillPackages) {
        packages = [...DEFAULT_PACKAGES, ...config.skillPackages]
        log.info("loaded custom skill packages", { count: packages.length })
      }
    },

    "chat.message": async (
      input: { sessionID?: string; messageID?: string; message?: string },
      output: { message: any; parts: any[] },
    ) => {
      const sessionID = input.sessionID ?? "default"
      const session = getSessionState(sessionID)
      const now = Date.now()

      session.lastActivity = now

      const status = await getResourceStatus()
      session.resourceStatus = status

      if (!session.initialized) {
        session.initialized = true

        Bus.publish(TuiEvent.ToastShow, {
          message: "正在初始化智慧技能系統...",
          variant: "info" as const,
          duration: 3000,
        })

        const suggested = await suggestModules(status)
        const autoload = suggested.filter((s) => CORE_SKILLS.includes(s) || suggested.includes(s))
        const config = await Config.get()
        const configured = (config.skills as any)?.autoload ?? autoload

        const results: string[] = []
        const loaded: string[] = []

        for (const name of configured) {
          const skill = await Skill.get(name)
          if (skill) {
            const pkg = packages.find((p) => p.name === name)
            session.loadedSkills.set(name, {
              name,
              loadedAt: now,
              keywords: pkg?.keywords ?? [],
              triggerCount: 1,
            })
            loaded.push(name)
            results.push(`✅ ${name}: ${skill.description}`)
            log.info("autoloaded skill", { name })
          } else {
            results.push(`❌ ${name}: not found`)
            log.warn("skill not found for autoload", { name })
          }
        }

        Bus.publish(TuiEvent.ToastShow, {
          message: `✨ 智慧技能系統就緒 - ${loaded.length} 個功能可用`,
          variant: "success" as const,
          duration: 5000,
        })

        const systemPrompt = `
[智慧技能系統已啟用]
📊 系統狀態: ${status.freeMemoryMB.toFixed(0)}MB 可用 | 負載: ${status.loadAverage[0].toFixed(2)}

## 已自動載入 (${loaded.length} 個)
${results.join("\n")}

## 自動偵測功能
當你說這些話時，系統會自動啟用對應功能：
${packages
  .filter((p) => p.triggerPhrases || p.keywords.length > 0)
  .map((p) => {
    const triggers = p.triggerPhrases?.slice(0, 4).join("、") ?? p.keywords.slice(0, 4).join("、")
    return `- ${p.description}: 當你說「${triggers}」時`
  })
  .join("\n")}

## 運作規則
- 系統自動偵測對話關鍵字，按需載入功能
- 低資源時自動限制載入
- 閒置超過 5 分鐘自動卸載未使用的功能

${showBeginnerHelp()}
`.trim()

        output.parts.push({ type: "text", text: systemPrompt })
        return
      }

      const message = input.message ?? ""
      if (!message) return

      const matched = findMatchingPackages(message)
      const newlyLoaded: string[] = []

      for (const pkg of matched) {
        if (pkg.keywords.length === 0 || pkg.name === "core") continue
        const loaded = await loadSkill(pkg.name, session)
        if (loaded) {
          newlyLoaded.push(pkg.name)
        }
      }

      if (newlyLoaded.length > 0) {
        const descriptions = newlyLoaded.map((name) => {
          const pkg = packages.find((p) => p.name === name)
          return pkg?.description ?? name
        })
        Bus.publish(TuiEvent.ToastShow, {
          message: `已啟用: ${descriptions.join(", ")}`,
          variant: "info" as const,
          duration: 3000,
        })
        log.info("dynamically loaded skills", { skills: newlyLoaded, message: message.slice(0, 50) })
      }

      const canUnload = status.freeMemoryMB < 800 || status.loadAverage[0] > 4
      if (canUnload) {
        await unloadUnusedSkills(session)
      }
    },

    help: () => showBeginnerHelp(),

    getStatus: async () => {
      const status = await getResourceStatus()
      return {
        loadedCount: Array.from(sessionState.values()).reduce((sum, s) => sum + s.loadedSkills.size, 0),
        loadClass: getLoadClass(status),
        resources: status,
      }
    },
  }
}
