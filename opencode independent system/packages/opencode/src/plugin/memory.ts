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

export const memoryPlugin = async (input: any) => ({
  tool: {
    memory_recall: recall,
    memory_store: store,
    memory_list: list,
    memory_backup: backup,
    memory_restore: restore,
    memory_backup_list: backupList,
  },
  async "chat.message"(input: { messageID?: string }, output: { message: any; parts: any[] }) {
    const text = output.parts.map((p: any) => p.text ?? "").join(" ")
    const keywords = Object.keys(KEYWORD_MAP)
    const matched = keywords.filter((kw) => text.toLowerCase().includes(kw.toLowerCase()))

    if (matched.length > 0 && input.messageID) {
      const memories = await autoRecall(matched, output.message?.directory ?? ".")
      if (memories) {
        output.parts.push({ type: "text", text: `\n[自動調用記憶]\n${memories}` })
      }
    }
  },
})
