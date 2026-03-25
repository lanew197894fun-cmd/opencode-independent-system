import { tool, type ToolContext } from "@opencode-ai/plugin"
import { z } from "zod"

const MEMORY_BASE = ".opencode/memory"

const KEYWORD_MAP: Record<string, { category: "projects" | "topics"; keywords: string[] }> = {
  opencode: { category: "projects", keywords: ["opencode"] },
  openclaw: { category: "projects", keywords: ["openclaw", "telegram", "bot"] },
  anduinos: { category: "projects", keywords: ["anduinos", "linux", "iso"] },
  taiwanR: { category: "projects", keywords: ["天堂", "重製王國", "REMASTER KINGDOM", "工作量"] },
  database: { category: "topics", keywords: ["database", "drizzle", "sqlite", "migration", "schema"] },
  telegram: { category: "topics", keywords: ["telegram", "webhook", "bot"] },
  performance: { category: "topics", keywords: ["performance", "優化", "快取", "延遲"] },
  powershell: { category: "topics", keywords: ["powershell", "ps1", "windows"] },
  compile: { category: "topics", keywords: ["編譯", "compile", "編譯器", "編譯核心", "核心"] },
  translate: { category: "topics", keywords: ["翻譯", "translate", "翻譯原文", "測試"] },
}

function parseMemory(content: string, keywords: string[]): string | null {
  const lines = content.split("\n").filter((l) => l.trim())
  const matched: string[] = []

  for (const line of lines) {
    if (line.startsWith("#") || line.startsWith("##")) continue
    const lower = line.toLowerCase()
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      matched.push(line)
    }
  }

  return matched.length > 0 ? matched.join("\n") : null
}

async function autoRecall(keywords: string[], worktree: string) {
  const base = `${worktree}/.opencode/memory`
  const results: string[] = []

  for (const [_, config] of Object.entries(KEYWORD_MAP)) {
    const matched = keywords.some((kw) => config.keywords.includes(kw.toLowerCase()))
    if (!matched) continue

    const dir = `${base}/${config.category}`
    if (!(await Bun.file(dir).exists())) continue

    const files = await Bun.$`ls ${dir}`.text().then((t) => t.trim().split("\n").filter(Boolean))
    for (const f of files) {
      if (!f.endsWith(".md")) continue
      const path = `${dir}/${f}`
      const content = await Bun.file(path).text()
      const filtered = parseMemory(content, keywords)
      if (filtered) {
        const rel = path.replace(`${worktree}/`, "")
        results.push(`## ${rel}\n${filtered}`)
      }
    }
  }

  return results.length > 0 ? results.join("\n\n---\n\n") : null
}

const recall = tool({
  description: "Recall relevant memories based on keywords",
  args: {
    keywords: z.array(z.string()).describe("Keywords to search for in memories"),
    category: z.enum(["projects", "topics", "cache"]).optional().describe("Filter by category"),
  },
  async execute({ keywords, category }, ctx: ToolContext) {
    const base = `${ctx.worktree}/.opencode/memory`
    const searchDirs = category ? [`${base}/${category}`] : [`${base}/projects`, `${base}/topics`, `${base}/cache`]

    const results: string[] = []

    for (const dir of searchDirs) {
      try {
        const entries = (await Bun.file(dir).exists())
          ? await Bun.$`ls ${dir}`.text().then((t) => t.trim().split("\n").filter(Boolean))
          : []

        for (const entry of entries) {
          if (!entry.endsWith(".md")) continue
          const path = `${dir}/${entry}`
          const content = await Bun.file(path).text()
          const filtered = parseMemory(content, keywords)

          if (filtered) {
            const rel = path.replace(`${ctx.worktree}/`, "")
            results.push(`## ${rel}\n${filtered}`)
          }
        }
      } catch {}
    }

    if (results.length === 0) return "No memories found"
    return results.join("\n\n---\n\n")
  },
})

const store = tool({
  description: "Store new memory",
  args: {
    category: z.enum(["projects", "topics", "cache"]).describe("Category: projects, topics, or cache"),
    filename: z.string().describe("Filename (e.g., 'telegram.md')"),
    content: z.string().describe("Memory content to store"),
    append: z.boolean().optional().describe("Append to existing file instead of overwrite"),
  },
  async execute({ category, filename, content, append }, ctx: ToolContext) {
    const dir = `${ctx.worktree}/.opencode/memory/${category}`
    await Bun.$`mkdir -p ${dir}`

    const path = `${dir}/${filename}`
    const exists = await Bun.file(path).exists()

    if (exists && append) {
      const existing = await Bun.file(path).text()
      await Bun.write(path, `${existing}\n${content}`)
    } else {
      await Bun.write(path, content)
    }

    return `Stored to ${category}/${filename}`
  },
})

const list = tool({
  description: "List all available memories",
  args: {
    category: z.enum(["projects", "topics", "cache"]).optional(),
  },
  async execute({ category }, ctx: ToolContext) {
    const base = `${ctx.worktree}/.opencode/memory`
    const dirs = category ? [category] : ["projects", "topics", "cache"]
    const all: string[] = []

    for (const dir of dirs) {
      const path = `${base}/${dir}`
      if (!(await Bun.file(path).exists())) continue

      const files = await Bun.$`ls ${path}`.text().then((t) => t.trim().split("\n").filter(Boolean))
      for (const f of files) {
        all.push(`${dir}/${f}`)
      }
    }

    return all.join("\n")
  },
})

const backup = tool({
  description: "Backup memory to directory (USB/network/any path)",
  args: {
    target: z.string().optional().describe("Target directory. If omitted, uses .opencode/memory-backup/"),
  },
  async execute({ target }, ctx: ToolContext) {
    const source = `${ctx.worktree}/.opencode/memory`
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const dest = target
      ? `${target}/memory-${timestamp}`
      : `${ctx.worktree}/.opencode/memory-backup/memory-${timestamp}`

    const destCheck = target ?? `${ctx.worktree}/.opencode/memory-backup`
    const exists = await Bun.file(destCheck.replace("/memory-backup", "")).exists()
    if (target && !exists) {
      return `Backup skipped: ${target} not accessible`
    }

    await Bun.$`mkdir -p ${dest}`

    const dirs = ["projects", "topics", "cache"]
    let count = 0

    for (const dir of dirs) {
      const srcDir = `${source}/${dir}`
      if (!(await Bun.file(srcDir).exists())) continue

      const files = await Bun.$`ls ${srcDir}`.text().then((t) => t.trim().split("\n").filter(Boolean))
      for (const f of files) {
        const src = `${srcDir}/${f}`
        const dstDir = `${dest}/${dir}`
        await Bun.$`mkdir -p ${dstDir} && cp ${src} ${dstDir}/`
        count++
      }
    }

    return `Backup complete: ${count} files to ${dest}`
  },
})

const restore = tool({
  description: "Restore memory from backup",
  args: {
    source: z.string().describe("Backup source directory (e.g., /media/reamaster/USB/memory-backup/memory-2026-03-18)"),
  },
  async execute({ source }, ctx: ToolContext) {
    const dest = `${ctx.worktree}/.opencode/memory`
    const dirs = ["projects", "topics", "cache"]
    let count = 0

    for (const dir of dirs) {
      const srcDir = `${source}/${dir}`
      if (!(await Bun.file(srcDir).exists())) continue

      const files = await Bun.$`ls ${srcDir}`.text().then((t) => t.trim().split("\n").filter(Boolean))
      for (const f of files) {
        const src = `${srcDir}/${f}`
        const dst = `${dest}/${dir}/${f}`
        await Bun.$`mkdir -p ${dest}/${dir} && cp ${src} ${dst}`
        count++
      }
    }

    return `Restored: ${count} files from ${source}`
  },
})

const backupList = tool({
  description: "List available backups",
  args: {
    folder: z.string().optional().describe("Backup folder to list (default: .opencode/memory-backup)"),
  },
  async execute({ folder }, ctx: ToolContext) {
    const target = folder ?? `${ctx.worktree}/.opencode/memory-backup`

    if (!(await Bun.file(target).exists())) {
      return "No backups found"
    }

    const dirs = await Bun.$`ls -d ${target}/memory-*/ 2>/dev/null || echo ""`.text()
    if (!dirs.trim()) return "No backups found"

    return dirs
      .trim()
      .split("\n")
      .map((d) => d.replace("/", ""))
      .join("\n")
  },
})

const LESSON_TRIGGERS = ["記住這個", "記住", "要記住", "这个记住", "記錄這個", "記錄下來"]
const WHY_TRIGGERS = ["為什麼", "為啥", "怎麼會", "為甚麼", "why"]
const FIX_TRIGGERS = ["解決了", "修好了", "修復", "fixed", "resolved", "搞定"]

function detectLessonMoment(text: string): { type: "explicit" | "why" | "fix" } | null {
  const lower = text.toLowerCase()
  if (LESSON_TRIGGERS.some((t) => lower.includes(t))) return { type: "explicit" }
  if (WHY_TRIGGERS.some((t) => lower.includes(t))) return { type: "why" }
  if (FIX_TRIGGERS.some((t) => lower.includes(t))) return { type: "fix" }
  return null
}

const lessonStore = tool({
  description: "Store a lesson (fact or decision) to long-term memory",
  args: {
    type: z.enum(["fact", "decision"]).describe("Lesson type: fact (問題.原因.解決) or decision (原則.觸發)"),
    content: z.string().describe("The lesson content following the format"),
  },
  async execute({ type, content }, ctx: ToolContext) {
    const dir = `${ctx.worktree}/.opencode/memory/topics`
    await Bun.$`mkdir -p ${dir}`

    const path = `${dir}/lesson.md`
    const exists = await Bun.file(path).exists()

    const timestamp = new Date().toISOString().slice(0, 10)
    const formatted = type === "fact" ? `## fact ${timestamp}\n${content}` : `## decision ${timestamp}\n${content}`

    if (exists) {
      const existing = await Bun.file(path).text()
      await Bun.write(path, `${existing}\n\n${formatted}`)
    } else {
      await Bun.write(path, formatted)
    }

    const verify = await Bun.file(path).exists()
    return verify ? `已記住 lesson (${type})` : "儲存失敗"
  },
})

const lessonRecall = tool({
  description: "Recall lessons (facts and decisions) from memory",
  args: {
    query: z.string().optional().describe("Optional query to filter lessons"),
  },
  async execute({ query }, ctx: ToolContext) {
    const path = `${ctx.worktree}/.opencode/memory/topics/lesson.md`
    if (!(await Bun.file(path).exists())) return "尚無 lesson 記錄"

    const content = await Bun.file(path).text()
    if (!query) return content

    const lines = content.split("\n")
    const matched = lines.filter((l) => l.toLowerCase().includes(query.toLowerCase()))
    return matched.length > 0 ? matched.join("\n") : "無相關 lesson"
  },
})

export const memoryPlugin = async (input: any) => ({
  tool: {
    memory_recall: recall,
    memory_store: store,
    memory_list: list,
    memory_backup: backup,
    memory_restore: restore,
    memory_backup_list: backupList,
    lesson_store: lessonStore,
    lesson_recall: lessonRecall,
  },
  async "chat.message"(input: { message?: string; messageID?: string }, output: { message: any; parts: any[] }) {
    const text = output.parts.map((p: any) => p.text ?? "").join(" ")
    const keywords = Object.keys(KEYWORD_MAP)
    const matched = keywords.filter((kw) => text.toLowerCase().includes(kw.toLowerCase()))

    if (matched.length > 0 && input.messageID) {
      const memories = await autoRecall(matched, output.message?.directory ?? ".")
      if (memories) {
        output.parts.push({ type: "text", text: `\n[自動調用記憶]\n${memories}` })
      }
    }

    const userText = input.message ?? ""
    const lessonMoment = detectLessonMoment(userText)
    if (lessonMoment && input.messageID) {
      const prompt =
        lessonMoment.type === "explicit"
          ? "\n[偵測到記錄請求] 要將這段記為 lesson 嗎？格式：fact: 問題.原因.解決 或 decision: 原則.觸發"
          : lessonMoment.type === "why"
            ? "\n[偵測到决策時刻] 要將這個决策記為 lesson 嗎？格式：decision: 原則.觸發"
            : "\n[偵測到修復經驗] 要將這個經驗記為 lesson 嗎？格式：fact: 問題.原因.解決"
      output.parts.push({ type: "text", text: prompt })
    }

    if (text.toLowerCase().includes("lesson") || text.toLowerCase().includes("之前記過")) {
      const lessons = await lessonRecall.execute({ query: undefined }, {
        worktree: output.message?.directory ?? ".",
      } as ToolContext)
      if (lessons && !lessons.startsWith("尚無")) {
        output.parts.push({ type: "text", text: `\n[Lesson 召回]\n${lessons}` })
      }
    }
  },
})
