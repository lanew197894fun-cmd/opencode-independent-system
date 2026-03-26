import z from "zod"
import path from "path"
import os from "os"
import { Config } from "../config/config"
import { Instance } from "../project/instance"
import { NamedError } from "@opencode-ai/util/error"
import { ConfigMarkdown } from "../config/markdown"
import { Log } from "../util/log"
import { Global } from "@/global"
import { Filesystem } from "@/util/filesystem"
import { Flag } from "@/flag/flag"
import { Bus } from "@/bus"
import { Session } from "@/session"
import { Discovery } from "./discovery"
import { Glob } from "../util/glob"
import { Effect } from "effect"

export namespace Skill {
  const log = Log.create({ service: "skill" })
  export const Info = z.object({
    name: z.string(),
    description: z.string(),
    location: z.string(),
    content: z.string(),
  })
  export type Info = z.infer<typeof Info>

  export const InvalidError = NamedError.create(
    "SkillInvalidError",
    z.object({
      path: z.string(),
      message: z.string().optional(),
      issues: z.custom<z.core.$ZodIssue[]>().optional(),
    }),
  )

  export const NameMismatchError = NamedError.create(
    "SkillNameMismatchError",
    z.object({
      path: z.string(),
      expected: z.string(),
      actual: z.string(),
    }),
  )

  const EXTERNAL_DIRS = [".claude", ".agents"]
  const EXTERNAL_SKILL_PATTERN = "skills/**/SKILL.md"
  const OPENCODE_SKILL_PATTERN = "{skill,skills}/**/SKILL.md"
  const SKILL_PATTERN = "**/SKILL.md"

  type SkillIndex = Record<string, { location: string; description: string }>

  const indexCache = new Map<string, Promise<SkillIndex>>()
  const contentCache = new Map<string, Promise<Info | undefined>>()

  async function scanIndex(root: string, pattern: string): Promise<SkillIndex> {
    const index: SkillIndex = {}
    const matches = await Glob.scan(pattern, {
      cwd: root,
      absolute: true,
      include: "file",
      symlink: true,
    }).catch((error) => {
      log.error("failed to scan skills", { dir: root, error })
      return []
    })

    for (const match of matches) {
      const md = await ConfigMarkdown.parse(match).catch(() => undefined)
      if (!md) continue

      const parsed = Info.pick({ name: true, description: true }).safeParse(md.data)
      if (!parsed.success) continue

      index[parsed.data.name] = {
        location: match,
        description: parsed.data.description,
      }
    }

    return index
  }

  async function loadSkill(name: string): Promise<Info | undefined> {
    if (contentCache.has(name)) return contentCache.get(name)

    const promise = (async () => {
      const index = await getIndex()
      const entry = index[name]
      if (!entry) return undefined

      const md = await ConfigMarkdown.parse(entry.location).catch((err) => {
        const message = ConfigMarkdown.FrontmatterError.isInstance(err)
          ? err.data.message
          : `Failed to parse skill ${entry.location}`
        Bus.publish(Session.Event.Error, { error: new NamedError.Unknown({ message }).toObject() })
        log.error("failed to load skill", { skill: entry.location, err })
        return undefined
      })

      if (!md) return undefined

      const parsed = Info.safeParse({ ...md.data, location: entry.location, content: md.content })
      if (!parsed.success) return undefined

      return parsed.data
    })()

    contentCache.set(name, promise)
    return promise
  }

  async function getIndex(): Promise<SkillIndex> {
    let key: string
    try {
      key = Instance.directory
    } catch {
      key = "default"
    }
    if (indexCache.has(key)) return indexCache.get(key)!

    const promise = (async () => {
      const skills: SkillIndex = {}

      let configDirs: string[] = []
      let configSkills: { paths?: string[]; urls?: string[] } = {}
      try {
        configDirs = await Config.directories()
        configSkills = (await Config.get()).skills ?? {}
      } catch {
        const opencodeDir = path.join(process.cwd(), ".opencode")
        if (await Filesystem.isDir(opencodeDir)) {
          configDirs = [opencodeDir]
        }
      }

      const scanAndMerge = async (root: string, pattern: string) => {
        const index = await scanIndex(root, pattern)
        Object.assign(skills, index)
      }

      if (!Flag.OPENCODE_DISABLE_EXTERNAL_SKILLS) {
        for (const dir of EXTERNAL_DIRS) {
          const root = path.join(Global.Path.home, dir)
          if (await Filesystem.isDir(root)) await scanAndMerge(root, EXTERNAL_SKILL_PATTERN)
        }

        let instanceDir: string
        let worktree: string
        try {
          instanceDir = Instance.directory
          worktree = Instance.worktree
        } catch {
          instanceDir = process.cwd()
          worktree = process.cwd()
        }

        for await (const root of Filesystem.up({
          targets: EXTERNAL_DIRS,
          start: instanceDir,
          stop: worktree,
        })) {
          await scanAndMerge(root, EXTERNAL_SKILL_PATTERN)
        }
      }

      for (const dir of configDirs) {
        await scanAndMerge(dir, OPENCODE_SKILL_PATTERN)
      }

      for (const skillPath of configSkills.paths ?? []) {
        const expanded = skillPath.startsWith("~/") ? path.join(os.homedir(), skillPath.slice(2)) : skillPath
        let resolved: string
        try {
          resolved = path.isAbsolute(expanded) ? expanded : path.join(Instance.directory, expanded)
        } catch {
          resolved = path.isAbsolute(expanded) ? expanded : path.join(process.cwd(), expanded)
        }
        if (!(await Filesystem.isDir(resolved))) {
          log.warn("skill path not found", { path: resolved })
          continue
        }
        await scanAndMerge(resolved, SKILL_PATTERN)
      }

      for (const url of configSkills.urls ?? []) {
        const list = await Effect.runPromise(
          Effect.gen(function* () {
            const discovery = yield* Discovery.Service
            return yield* discovery.pull(url)
          }).pipe(Effect.provide(Discovery.defaultLayer)),
        )
        for (const dir of list) {
          await scanAndMerge(dir, SKILL_PATTERN)
        }
      }

      return skills
    })()

    indexCache.set(key, promise)
    return promise
  }

  export async function get(name: string) {
    return loadSkill(name)
  }

  export async function all() {
    const index = await getIndex()
    const entries = await Promise.all(
      Object.entries(index).map(async ([name, entry]) => {
        const skill = await loadSkill(name)
        return skill!
      }),
    )
    return entries.filter(Boolean)
  }

  export async function dirs() {
    const index = await getIndex()
    const dirs = new Set<string>()
    for (const entry of Object.values(index)) {
      dirs.add(path.dirname(entry.location))
    }
    return Array.from(dirs)
  }
}
