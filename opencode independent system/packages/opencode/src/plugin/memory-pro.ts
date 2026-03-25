import { tool, type ToolContext } from "@opencode-ai/plugin"
import { z } from "zod"

const MEMORY_BASE = ".opencode/memory"
const LANCEDB_PATH = ".opencode/memory/lancedb"

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

const COMPLEX_QUERY_PATTERNS = [
  "類似的",
  "之前的經驗",
  "相關的",
  "similar",
  "related",
  "之前記過",
  "教訓",
  "原則",
  "為什麼",
  "怎麼做的",
]

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

function needsVectorSearch(query: string): boolean {
  const lower = query.toLowerCase()
  return COMPLEX_QUERY_PATTERNS.some((p) => lower.includes(p.toLowerCase()))
}

async function localRecall(keywords: string[], worktree: string, category?: string): Promise<string> {
  const base = `${worktree}/${MEMORY_BASE}`
  const results: string[] = []

  const searchDirs = category ? [`${base}/${category}`] : [`${base}/projects`, `${base}/topics`, `${base}/cache`]

  for (const dir of searchDirs) {
    try {
      if (!(await Bun.file(dir).exists())) continue

      const entries = await Bun.$`ls ${dir}`.text().then((t) => t.trim().split("\n").filter(Boolean))
      for (const entry of entries) {
        if (!entry.endsWith(".md")) continue
        const path = `${dir}/${entry}`
        const content = await Bun.file(path).text()
        const filtered = parseMemory(content, keywords)

        if (filtered) {
          const rel = path.replace(`${worktree}/`, "")
          results.push(`## ${rel}\n${filtered}`)
        }
      }
    } catch {}
  }

  return results.length > 0 ? results.join("\n\n---\n\n") : "No memories found"
}

async function localStore(
  category: "projects" | "topics" | "cache",
  filename: string,
  content: string,
  worktree: string,
  append?: boolean,
): Promise<string> {
  const dir = `${worktree}/${MEMORY_BASE}/${category}`
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
}

async function vectorSearch(query: string, worktree: string): Promise<string> {
  const lancedbPath = `${worktree}/${LANCEDB_PATH}`
  if (!(await Bun.file(lancedbPath).exists())) {
    return "[向量搜尋] LanceDB 未初始化，請先安裝 memory-lancedb-pro"
  }
  return `[向量搜尋] 搜尋: ${query}\n[說明] 需要配置 embedding API 金鑰才能使用向量搜尋功能`
}

async function autoRecallLocal(keywords: string[], worktree: string) {
  const base = `${worktree}/${MEMORY_BASE}`
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
  description: "Recall memories - auto-routes to local or vector based on query complexity",
  args: {
    keywords: z.array(z.string()).describe("Keywords to search for in memories"),
    category: z.enum(["projects", "topics", "cache"]).optional().describe("Filter by category"),
    forceLocal: z.boolean().optional().describe("Force local file search (skip vector)"),
    forceVector: z.boolean().optional().describe("Force vector search (local as fallback)"),
  },
  async execute({ keywords, category, forceLocal, forceVector }, ctx: ToolContext) {
    if (forceVector || (!forceLocal && keywords.some((k) => needsVectorSearch(k)))) {
      const vectorResult = await vectorSearch(keywords.join(" "), ctx.worktree)
      const localResult = await localRecall(keywords, ctx.worktree, category)
      return `${vectorResult}\n\n---\n[本地備用]\n${localResult}`
    }

    return localRecall(keywords, ctx.worktree, category)
  },
})

const store = tool({
  description: "Store memory - always local, optionally duplicate to vector store",
  args: {
    category: z.enum(["projects", "topics", "cache"]).describe("Category: projects, topics, or cache"),
    filename: z.string().describe("Filename (e.g., 'telegram.md')"),
    content: z.string().describe("Memory content to store"),
    append: z.boolean().optional().describe("Append to existing file instead of overwrite"),
    alsoVector: z.boolean().optional().describe("Also store to vector database (if configured)"),
  },
  async execute({ category, filename, content, append, alsoVector }, ctx: ToolContext) {
    const localResult = await localStore(category, filename, content, ctx.worktree, append)

    if (alsoVector) {
      return `${localResult}\n[向量儲存] 需要 memory-lancedb-pro 配置才能使用`
    }

    return localResult
  },
})

const list = tool({
  description: "List all available memories",
  args: {
    category: z.enum(["projects", "topics", "cache"]).optional(),
  },
  async execute({ category }, ctx: ToolContext) {
    const base = `${ctx.worktree}/${MEMORY_BASE}`
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
    const source = `${ctx.worktree}/${MEMORY_BASE}`
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
    const dest = `${ctx.worktree}/${MEMORY_BASE}`
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

const stats = tool({
  description: "Get memory statistics (local + vector if available)",
  args: {},
  async execute({}, ctx: ToolContext) {
    const base = `${ctx.worktree}/${MEMORY_BASE}`
    const result: string[] = ["## Local Memory Stats"]

    for (const dir of ["projects", "topics", "cache"]) {
      const path = `${base}/${dir}`
      if (!(await Bun.file(path).exists())) continue

      const files = await Bun.$`ls ${path}`.text().then((t) => t.trim().split("\n").filter(Boolean))
      const mdFiles = files.filter((f) => f.endsWith(".md"))
      result.push(`- ${dir}: ${mdFiles.length} files`)
    }

    const lancedbPath = `${ctx.worktree}/${LANCEDB_PATH}`
    if (await Bun.file(lancedbPath).exists()) {
      result.push("\n## Vector Store (LanceDB)")
      result.push("- Status: 初始化完成 (需要 API 金鑰才能使用)")
    } else {
      result.push("\n## Vector Store (LanceDB)")
      result.push("- Status: 未初始化 (可安裝 memory-lancedb-pro 啟用)")
    }

    return result.join("\n")
  },
})

const LESSON_TRIGGERS = [
  "記住這個",
  "記住",
  "要記住",
  "这个记住",
  "記錄這個",
  "記錄下來",
  "知識庫",
  "門紀錄",
  "記錄在知識庫",
  "寫入知識",
  "存到知識",
  "knowledge",
  "記錄起來",
  "記下來",
]
const WHY_TRIGGERS = ["為什麼", "為啥", "怎麼會", "為甚麼", "why"]
const FIX_TRIGGERS = ["解決了", "修好了", "修復", "fixed", "resolved", "搞定"]

function detectLessonMoment(text: string): { type: "explicit" | "why" | "fix" } | null {
  const lower = text.toLowerCase()
  if (LESSON_TRIGGERS.some((t) => lower.includes(t))) return { type: "explicit" }
  if (WHY_TRIGGERS.some((t) => lower.includes(t))) return { type: "why" }
  if (FIX_TRIGGERS.some((t) => lower.includes(t))) return { type: "fix" }
  return null
}

const knowledgeStore = tool({
  description: "Store knowledge (fact or decision) to knowledge base",
  args: {
    type: z.enum(["fact", "decision"]).describe("知識類型: fact (問題.原因.解決) or decision (原則.觸發)"),
    content: z.string().describe("The knowledge content following the format"),
    autoSyncGitHub: z.boolean().optional().describe("自動同步到 GitHub (需先設定 GH_TOKEN 或 gh CLI 登入)"),
    disableUpload: z.boolean().optional().describe("禁止上傳 (僅儲存本地)"),
  },
  async execute({ type, content, autoSyncGitHub, disableUpload }, ctx: ToolContext) {
    const dir = `${ctx.worktree}/${MEMORY_BASE}/topics`
    await Bun.$`mkdir -p ${dir}`

    const path = `${dir}/知識.md`
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
    if (!verify) return "儲存失敗"

    let syncResult = ""

    if (disableUpload) {
      return `已記住知識 (${type}) | 🔒 已禁止上傳 (僅本地儲存)`
    }

    if (autoSyncGitHub) {
      try {
        const ghAuth = await Bun.$`gh auth status 2>&1`.text()
        if (!ghAuth.includes("logged in")) {
          return `已記住知識 (${type}) | ⚠️ GitHub 未登入，無法自動推送\n請執行: gh auth login`
        }

        const commitMsg = `knowledge: ${type} ${timestamp}`
        await Bun.$`cd ${ctx.worktree} && git add .opencode/memory/topics/知識.md`.text()
        await Bun.$`cd ${ctx.worktree} && git commit -m "${commitMsg}"`.text()

        try {
          await Bun.$`cd ${ctx.worktree} && git push`.text()
          syncResult = " | ✅ 已推送到 GitHub"

          await notifyUpload(ctx.worktree, type, "GitHub")
        } catch {
          syncResult = " | ⚠️ 已 commit 未推送 (請手動 git push)"
        }
      } catch (e) {
        syncResult = ""
      }
    }

    return `已記住知識 (${type})${syncResult}`
  },
})

async function notifyUpload(worktree: string, knowledgeType: string, target: string) {
  const channelPath = `${worktree}/.opencode/config/channels.json`
  if (!(await Bun.file(channelPath).exists())) return

  try {
    const channels = await Bun.file(channelPath).json()

    if (channels.telegram?.enabled && channels.telegram?.token) {
      const token = channels.telegram.token
      const chatId = channels.telegram.chat_id ?? "me"
      const msg = encodeURIComponent(
        `📤 知識庫上傳通知\n類型: ${knowledgeType}\n目標: ${target}\n時間: ${new Date().toLocaleString("zh-TW")}`,
      )
      await fetch(`https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${msg}`)
    }

    if (channels.discord?.enabled && channels.discord?.token) {
      // Discord webhook or bot message
    }
  } catch {}
}

const knowledgeRecall = tool({
  description: "Recall knowledge (facts and decisions) from knowledge base",
  args: {
    query: z.string().optional().describe("Optional query to filter knowledge"),
  },
  async execute({ query }, ctx: ToolContext) {
    const path = `${ctx.worktree}/${MEMORY_BASE}/topics/知識.md`
    if (!(await Bun.file(path).exists())) return "尚無知識記錄"

    const content = await Bun.file(path).text()
    if (!query) return content

    const lines = content.split("\n")
    const matched = lines.filter((l) => l.toLowerCase().includes(query.toLowerCase()))
    return matched.length > 0 ? matched.join("\n") : "無相關知識"
  },
})

const recordRecall = tool({
  description: "Recall 門紀錄 (facts and decisions) from memory",
  args: {
    query: z.string().optional().describe("Optional query to filter 門紀錄"),
  },
  async execute({ query }, ctx: ToolContext) {
    const path = `${ctx.worktree}/${MEMORY_BASE}/topics/門紀錄.md`
    if (!(await Bun.file(path).exists())) return "尚無門紀錄"

    const content = await Bun.file(path).text()
    if (!query) return content

    const lines = content.split("\n")
    const matched = lines.filter((l) => l.toLowerCase().includes(query.toLowerCase()))
    return matched.length > 0 ? matched.join("\n") : "無相關門紀錄"
  },
})

const lessonRecall = tool({
  description: "Recall lessons (facts and decisions) from memory",
  args: {
    query: z.string().optional().describe("Optional query to filter lessons"),
  },
  async execute({ query }, ctx: ToolContext) {
    const path = `${ctx.worktree}/${MEMORY_BASE}/topics/lesson.md`
    if (!(await Bun.file(path).exists())) return "尚無 lesson 記錄"

    const content = await Bun.file(path).text()
    if (!query) return content

    const lines = content.split("\n")
    const matched = lines.filter((l) => l.toLowerCase().includes(query.toLowerCase()))
    return matched.length > 0 ? matched.join("\n") : "無相關 lesson"
  },
})

export const memoryProPlugin = async (input: any) => ({
  tool: {
    memory_recall: recall,
    memory_store: store,
    memory_list: list,
    memory_backup: backup,
    memory_restore: restore,
    memory_backup_list: backupList,
    memory_stats: stats,
    knowledge_store: knowledgeStore,
    knowledge_recall: knowledgeRecall,
  },
  async "chat.message"(input: { message?: string; messageID?: string }, output: { message: any; parts: any[] }) {
    const text = output.parts.map((p: any) => p.text ?? "").join(" ")
    const keywords = Object.keys(KEYWORD_MAP)
    const matched = keywords.filter((kw) => text.toLowerCase().includes(kw.toLowerCase()))

    if (matched.length > 0 && input.messageID) {
      const memories = await autoRecallLocal(matched, output.message?.directory ?? ".")
      if (memories) {
        output.parts.push({ type: "text", text: `\n[自動調用記憶]\n${memories}` })
      }
    }

    const userText = input.message ?? ""
    const knowledgeMoment = detectLessonMoment(userText)
    if (knowledgeMoment && input.messageID) {
      const prompt =
        knowledgeMoment.type === "explicit"
          ? "\n[偵測到記錄請求] 要將這段記為知識嗎？格式：fact: 問題.原因.解決 或 decision: 原則.觸發\n💡 加上 autoSyncGitHub: true 可自動推送到 GitHub"
          : knowledgeMoment.type === "why"
            ? "\n[偵測到决策時刻] 要將這個决策記為知識嗎？格式：decision: 原則.觸發\n💡 加上 autoSyncGitHub: true 可自動推送到 GitHub"
            : "\n[偵測到修復經驗] 要將這個經驗記為知識嗎？格式：fact: 問題.原因.解決\n💡 加上 autoSyncGitHub: true 可自動推送到 GitHub"
      output.parts.push({ type: "text", text: prompt })
    }

    if (text.includes("知識") || text.toLowerCase().includes("之前記過") || text.includes("門紀錄")) {
      const knowledge = await knowledgeRecall.execute({ query: undefined }, {
        worktree: output.message?.directory ?? ".",
      } as ToolContext)
      if (knowledge && !knowledge.startsWith("尚無")) {
        output.parts.push({ type: "text", text: `\n[知識召回]\n${knowledge}` })
      }
    }
  },
})
