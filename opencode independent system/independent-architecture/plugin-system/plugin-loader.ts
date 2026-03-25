// 插件載入器 - 動態掃描和載入技能插件

import { readdir, readFile, stat } from "fs/promises"
import { join, basename } from "path"
import {
  PluginMetadata,
  PluginHooks,
  PluginInstance,
  PluginConfig,
  SkillDefinition,
} from "./skill-plugin.interface"

const log = {
  info: (msg: string, data?: any) => console.log(`[plugin-loader] ${msg}`, data || ""),
  warn: (msg: string, data?: any) => console.warn(`[plugin-loader] ${msg}`, data || ""),
  error: (msg: string, data?: any) => console.error(`[plugin-loader] ${msg}`, data || ""),
}

export interface LoadedSkill {
  name: string
  definition: SkillDefinition
  path: string
  content?: string
}

export class PluginLoader {
  private skillDirs: string[]
  private loadedSkills: Map<string, LoadedSkill> = new Map()
  private cacheEnabled: boolean = true
  private lastScan?: number

  constructor(skillDirs: string[] = []) {
    this.skillDirs = skillDirs
  }

  addSkillDir(dir: string) {
    if (!this.skillDirs.includes(dir)) {
      this.skillDirs.push(dir)
      this.cacheEnabled = false
    }
  }

  async scanSkills(): Promise<LoadedSkill[]> {
    const now = Date.now()
    if (this.cacheEnabled && this.lastScan && now - this.lastScan < 60000) {
      return Array.from(this.loadedSkills.values())
    }

    this.loadedSkills.clear()
    const skills: LoadedSkill[] = []

    for (const dir of this.skillDirs) {
      try {
        const skillDirs = await readdir(dir)
        for (const skillDir of skillDirs) {
          const skillPath = join(dir, skillDir)
          const skillStat = await stat(skillPath)
          
          if (skillStat.isDirectory()) {
            const skillFile = join(skillPath, "SKILL.md")
            const skill = await this.loadSkill(skillPath, skillFile)
            if (skill) {
              skills.push(skill)
              this.loadedSkills.set(skill.name, skill)
            }
          } else if (skillDir.endsWith(".md")) {
            const skill = await this.loadSkill(dir, join(dir, skillDir))
            if (skill) {
              skills.push(skill)
              this.loadedSkills.set(skill.name, skill)
            }
          }
        }
      } catch (error) {
        log.warn(`Failed to scan directory: ${dir}`, error)
      }
    }

    this.lastScan = Date.now()
    log.info(`Scanned ${skills.length} skills from ${this.skillDirs.length} directories`)
    return skills
  }

  private async loadSkill(basePath: string, skillFile: string): Promise<LoadedSkill | null> {
    try {
      const content = await readFile(skillFile, "utf-8")
      const definition = this.parseSkillMarkdown(content, basename(basePath))
      
      if (!definition.triggers.length) {
        log.warn(`Skill ${basename(basePath)} has no triggers, skipping`)
        return null
      }

      return {
        name: definition.triggers[0] || basename(basePath),
        definition,
        path: basePath,
        content,
      }
    } catch (error) {
      log.error(`Failed to load skill from ${skillFile}`, error)
      return null
    }
  }

  private parseSkillMarkdown(content: string, defaultName: string): SkillDefinition {
    const lines = content.split("\n")
    let inFrontmatter = false
    let frontmatter = ""
    let description = ""
    const triggers: string[] = []
    const tools: string[] = []
    const commands: string[] = []
    const examples: string[] = []
    const references: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.trim() === "---" && !inFrontmatter) {
        inFrontmatter = true
        continue
      }
      
      if (line.trim() === "---" && inFrontmatter) {
        inFrontmatter = false
        continue
      }

      if (inFrontmatter) {
        frontmatter += line + "\n"
        continue
      }

      if (line.startsWith("## ") && !description) {
        description = line.replace("## ", "").trim()
      }

      if (line.startsWith("**") && line.includes("**")) {
        const match = line.match(/\*\*([^*]+)\*\*/)
        if (match) {
          const item = match[1].trim()
          if (item.includes("`") || item.match(/^[a-z-]+$/)) {
            const clean = item.replace(/`/g, "").trim()
            if (clean.includes(" ") || clean.includes("/")) {
              commands.push(clean)
            } else if (!triggers.includes(clean)) {
              triggers.push(clean)
            }
          }
        }
      }

      if (line.match(/^[/-] `/)) {
        const cmd = line.replace(/^[/-] /, "").replace(/`/g, "").trim()
        if (cmd && !commands.includes(cmd)) {
          commands.push(cmd)
        }
      }

      if (line.includes("| `")) {
        const cols = line.split("|").filter(c => c.trim())
        for (const col of cols) {
          const match = col.match(/`([^`]+)`/)
          if (match && !tools.includes(match[1])) {
            tools.push(match[1])
          }
        }
      }

      if (line.startsWith("```")) {
        let example = ""
        i++
        while (i < lines.length && !lines[i].startsWith("```")) {
          example += lines[i] + "\n"
          i++
        }
        if (example.trim()) {
          examples.push(example.trim())
        }
      }
    }

    const nameMatch = frontmatter.match(/name:\s*"?([^"\n]+)"?/)
    const descMatch = frontmatter.match(/description:\s*"?([^"\n]+)"?/)
    const triggersMatch = frontmatter.match(/triggers?:\s*\[([^\]]+)\]/)

    if (nameMatch) {
      triggers.unshift(nameMatch[1].trim())
    }
    if (descMatch) {
      description = descMatch[1].trim()
    }
    if (triggersMatch) {
      const extra = triggersMatch[1].split(",").map(t => t.trim().replace(/["']/g, ""))
      triggers.push(...extra.filter(t => !triggers.includes(t)))
    }

    if (!description) {
      description = `Skill: ${defaultName}`
    }

    return { triggers, description, tools, commands, examples, references }
  }

  async createPluginInstance(skill: LoadedSkill): Promise<PluginInstance | null> {
    try {
      const metadata: PluginMetadata = {
        name: skill.name,
        version: "1.0.0",
        description: skill.definition.description,
        category: this.inferCategory(skill.name),
        triggers: skill.definition.triggers,
        autoLoad: true,
      }

      const hooks: PluginHooks = {
        onInit: async () => {
          log.info(`Initializing plugin: ${skill.name}`)
        },
        onLoad: async () => {
          log.info(`Loading plugin: ${skill.name}`)
        },
        onHealthCheck: async () => ({
          status: "healthy",
          message: `${skill.name} is operational`,
          confidence: 0.95,
        }),
      }

      return {
        metadata,
        hooks,
        status: "unloaded",
        config: {
          enabled: true,
          priority: 50,
          settings: {},
        },
      }
    } catch (error) {
      log.error(`Failed to create plugin instance for ${skill.name}`, error)
      return null
    }
  }

  private inferCategory(name: string): PluginMetadata["category"] {
    const lower = name.toLowerCase()
    if (lower.includes("memory")) return "memory"
    if (lower.includes("security") || lower.includes("shield")) return "security"
    if (lower.includes("search")) return "search"
    if (lower.includes("model")) return "model"
    if (lower.includes("knowledge") || lower.includes("learn")) return "knowledge"
    if (lower.includes("monitor") || lower.includes("health")) return "monitor"
    return "utility"
  }

  getLoadedSkills(): LoadedSkill[] {
    return Array.from(this.loadedSkills.values())
  }

  getSkill(name: string): LoadedSkill | undefined {
    return this.loadedSkills.get(name)
  }

  clearCache() {
    this.cacheEnabled = false
    this.lastScan = undefined
  }
}

export default PluginLoader
