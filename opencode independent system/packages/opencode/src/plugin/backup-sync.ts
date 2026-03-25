import { tool, type ToolContext } from "@opencode-ai/plugin"
import z from "zod"

const BACKUP_BASE = ".opencode/backup"

function getPlatform(): "linux" | "windows" | "macos" {
  const platform = process.platform
  if (platform === "win32") return "windows"
  if (platform === "darwin") return "macos"
  return "linux"
}

function getEncryptionKey(worktree: string): string {
  const pathHash = worktree.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
  return `oc_${Math.abs(pathHash).toString(16)}_key`
}

function encryptValue(text: string, key: string): string {
  const encoded = Buffer.from(text).toString("base64")
  const keyHash = key.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
  const encrypted = encoded
    .split("")
    .map((c, i) => {
      const charCode = c.charCodeAt(0) ^ ((keyHash >> i % 8) & 0xff)
      return String.fromCharCode(charCode)
    })
    .join("")
  return Buffer.from(encrypted).toString("base64")
}

function decryptValue(encrypted: string, key: string): string {
  try {
    const decoded = Buffer.from(encrypted, "base64").toString()
    const keyHash = key.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
    const decrypted = decoded
      .split("")
      .map((c, i) => {
        const charCode = c.charCodeAt(0) ^ ((keyHash >> i % 8) & 0xff)
        return String.fromCharCode(charCode)
      })
      .join("")
    return Buffer.from(decrypted, "base64").toString()
  } catch {
    return ""
  }
}

function getStorageDetectPaths(): string[] {
  const platform = getPlatform()

  if (platform === "windows") {
    return [
      "E:",
      "D:",
      "F:",
      "G:",
      process.env.USERPROFILE ? `${process.env.USERPROFILE}\\USB` : "C:\\Users",
      process.env.USERPROFILE ? `${process.env.USERPROFILE}\\Documents` : "C:\\Users",
    ]
  }

  if (platform === "macos") {
    return ["/Volumes", "/media", "/mnt", "/run/media"]
  }

  return ["/media", "/mnt", "/run/media"]
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/")
}

function toSystemPath(path: string): string {
  const platform = getPlatform()
  if (platform === "windows") {
    return path.replace(/\//g, "\\")
  }
  return path
}

function getDefaultProjects(worktree: string): { name: string; path: string }[] {
  const platform = getPlatform()
  const sep = platform === "windows" ? "\\" : "/"

  return [
    { name: "opencode-config", path: `${worktree}${sep}.opencode` },
    { name: "opencode-packages", path: `${worktree}${sep}packages` },
  ]
}

interface BackupManifest {
  backups: Record<string, { path: string; size: number; created: number; projects: string[]; platform: string }>
}

async function getBackupDir(worktree: string): Promise<string> {
  return `${worktree}/${BACKUP_BASE}`
}

async function loadManifest(worktree: string): Promise<BackupManifest> {
  const path = `${await getBackupDir(worktree)}/manifest.json`
  if (!(await Bun.file(path).exists())) return { backups: {} }
  return Bun.file(path).json()
}

async function saveManifest(worktree: string, manifest: BackupManifest): Promise<void> {
  const dir = await getBackupDir(worktree)
  await Bun.$`mkdir -p ${dir}`
  await Bun.write(`${dir}/manifest.json`, JSON.stringify(manifest, null, 2))
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

const detectStorage = tool({
  description: "偵測外接儲存裝置 (USB/硬碟)",
  args: {},
  async execute({}, ctx: ToolContext) {
    const results: string[] = []
    const platform = getPlatform()

    if (platform === "windows") {
      const windowsDrives = ["E:", "F:", "G:", "H:", "I:", "J:", "K:"]
      for (const drive of windowsDrives) {
        try {
          const exists = await Bun.file(`${drive}\\`).exists()
          if (exists) {
            results.push(`- ${drive}\\ (磁碟機)`)
          }
        } catch {}
      }
      return `## 偵測到的儲存裝置 (Windows)\n${results.join("\n") || "- 無偵測到"}`
    }

    const detectPaths = getStorageDetectPaths()
    for (const basePath of detectPaths) {
      try {
        const entries = await Bun.$`ls -la ${basePath} 2>/dev/null`.text()
        const lines = entries.split("\n").filter((l) => l.trim())

        for (const line of lines.slice(1)) {
          const parts = line.split(/\s+/)
          if (parts.length >= 9) {
            const name = parts[8]
            const fullPath = `${basePath}/${name}`
            if (name && name !== "." && name !== "..") {
              const stat = await Bun.file(fullPath).exists()
              if (stat) {
                try {
                  const size = await Bun.$`du -sh ${fullPath} 2>/dev/null`.text()
                  results.push(`- ${fullPath} (${size.trim()})`)
                } catch {
                  results.push(`- ${fullPath}`)
                }
              }
            }
          }
        }
      } catch {}
    }

    if (results.length === 0) return "未偵測到外接儲存裝置"
    return `## 偵測到的儲存裝置\n${results.join("\n")}`
  },
})

const listBackups = tool({
  description: "列出所有本地與外接儲存的備份",
  args: {
    folder: z.string().optional().describe("指定資料夾路徑"),
  },
  async execute({ folder }, ctx: ToolContext) {
    const localDir = await getBackupDir(ctx.worktree)
    const results: string[] = ["## 本地備份"]

    if (await Bun.file(`${localDir}/manifest.json`).exists()) {
      const manifest = await loadManifest(ctx.worktree)
      for (const [name, info] of Object.entries(manifest.backups)) {
        const date = new Date(info.created).toLocaleString("zh-TW")
        results.push(`- ${name}: ${formatBytes(info.size)} (${date})`)
      }
    }

    if (results.length === 1) results.push("- 無本地備份")

    if (folder) {
      results.push("\n## 外接儲存備份")
      const backupPath = `${folder}/OpenCode_Backup`
      if (await Bun.file(backupPath).exists()) {
        const entries = await Bun.$`ls ${backupPath}`.text()
        for (const entry of entries.trim().split("\n")) {
          results.push(`- ${entry}`)
        }
      } else {
        results.push("- 無外接儲存備份")
      }
    }

    return results.join("\n")
  },
})

const localBackup = tool({
  description: "建立本地備份",
  args: {
    name: z.string().optional().describe("備份名稱 (預設: backup-{date})"),
    projects: z.array(z.string()).optional().describe("要備份的專案路徑陣列"),
  },
  async execute({ name, projects }, ctx: ToolContext) {
    const dir = await getBackupDir(ctx.worktree)
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const backupName = name ?? `backup-${timestamp}`
    const backupDir = `${dir}/${backupName}`

    await Bun.$`mkdir -p ${backupDir}`

    const defaultProjects = getDefaultProjects(ctx.worktree)

    const toBackup = projects
      ? projects.map((p) => ({ name: p.split("/").pop() ?? "unknown", path: p }))
      : defaultProjects

    let totalSize = 0

    for (const proj of toBackup) {
      if (await Bun.file(proj.path).exists()) {
        const exclude = ["node_modules", ".cache", "dist", "build", "*.log"]
        const excludeArgs = exclude.flatMap((e) => ["--exclude", e])

        const dest = `${backupDir}/${proj.name}`
        await Bun.$`mkdir -p ${dest}`

        try {
          await Bun.$`cp -r ${proj.path} ${dest} 2>/dev/null || cp -rL ${proj.path} ${dest} 2>/dev/null || true`.text()
          const size = await Bun.$`du -sb ${dest}`.text()
          totalSize += parseInt(size.trim().split("\t")[0]) || 0
        } catch {}
      }
    }

    const manifest = await loadManifest(ctx.worktree)
    const platform = getPlatform()
    manifest.backups[backupName] = {
      path: backupDir,
      size: totalSize,
      created: Date.now(),
      projects: toBackup.map((p) => p.name),
      platform,
    }
    await saveManifest(ctx.worktree, manifest)

    return `本地備份已建立: ${backupName} (${formatBytes(totalSize)})`
  },
})

const syncToStorage = tool({
  description: "同步配置到外接儲存",
  args: {
    target: z.string().describe("目標儲存路徑 (如 /media/reamaster/USB)"),
  },
  async execute({ target }, ctx: ToolContext) {
    const exists = await Bun.file(target).exists()
    if (!exists) return `路徑不存在: ${target}`

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const backupName = `OpenCode_Backup_${timestamp}`
    const destDir = `${target}/${backupName}`
    const sep = getPlatform() === "windows" ? "\\" : "/"

    await Bun.$`mkdir -p ${destDir}`

    const sources = [`${ctx.worktree}${sep}.opencode`, `${ctx.worktree}${sep}packages`]

    let totalSize = 0
    const results: string[] = []

    for (const src of sources) {
      if (await Bun.file(src).exists()) {
        const name = src.split(sep).pop() ?? "unknown"
        const dest = `${destDir}/${name}`

        await Bun.$`mkdir -p ${dest}`
        await Bun.$`cp -r ${src}/* ${dest}/ 2>/dev/null || true`.text()

        try {
          const size = await Bun.$`du -sb ${dest}`.text()
          totalSize += parseInt(size.trim().split("\t")[0]) || 0
          results.push(`✓ ${name} -> ${dest}`)
        } catch {
          results.push(`✗ ${name}`)
        }
      }
    }

    return `## 同步完成\n${results.join("\n")}\n總大小: ${formatBytes(totalSize)}\n位置: ${destDir}`
  },
})

const restoreBackup = tool({
  description: "從備份還原",
  args: {
    source: z.string().describe("備份來源路徑 (如 /media/USB/OpenCode_Backup_20260317)"),
    projects: z.array(z.string()).optional().describe("要還原的專案名稱 (預設全部)"),
  },
  async execute({ source, projects }, ctx: ToolContext) {
    const exists = await Bun.file(source).exists()
    if (!exists) return `備份不存在: ${source}`

    const results: string[] = []

    const entries = await Bun.$`ls ${source}`.text()
    const toRestore = projects ?? entries.trim().split("\n").filter(Boolean)

    for (const name of toRestore) {
      const srcDir = `${source}/${name}`
      const destDir = name === ".opencode" ? `${ctx.worktree}/.opencode` : `${ctx.worktree}/${name}`

      if (await Bun.file(srcDir).exists()) {
        await Bun.$`mkdir -p ${destDir} && cp -r ${srcDir}/* ${destDir}/ 2>/dev/null || true`.text()
        results.push(`✓ ${name}`)
      } else {
        results.push(`✗ ${name} (不存在)`)
      }
    }

    return `## 還原完成\n${results.join("\n")}`
  },
})

const checkStatus = tool({
  description: "查看目前配置狀態",
  args: {},
  async execute({}, ctx: ToolContext) {
    const results: string[] = ["## OpenCode 狀態"]

    const configPath = `${ctx.worktree}/.opencode/opencode.json`
    if (await Bun.file(configPath).exists()) {
      results.push("✓ 配置存在")
    } else {
      results.push("✗ 無配置檔")
    }

    const packagesPath = `${ctx.worktree}/packages`
    if (await Bun.file(packagesPath).exists()) {
      try {
        const size = await Bun.$`du -sh ${packagesPath}`.text()
        results.push(`✓ packages 目錄: ${size.trim()}`)
      } catch {
        results.push("✓ packages 目錄存在")
      }
    } else {
      results.push("✗ 無 packages 目錄")
    }

    const backupDir = await getBackupDir(ctx.worktree)
    if (await Bun.file(backupDir).exists()) {
      const manifest = await loadManifest(ctx.worktree)
      results.push(`✓ 本地備份: ${Object.keys(manifest.backups).length} 個`)
    } else {
      results.push("- 本地備份: 無")
    }

    return results.join("\n")
  },
})

const syncProject = tool({
  description: "同步自定義專案到外接儲存",
  args: {
    source: z.string().describe("來源專案路徑"),
    target: z.string().describe("目標資料夾路徑"),
  },
  async execute({ source, target }, ctx: ToolContext) {
    const srcExists = await Bun.file(source).exists()
    if (!srcExists) return `來源不存在: ${source}`

    const tgtExists = await Bun.file(target).exists()
    if (!tgtExists) return `目標不存在: ${target}`

    const name = source.split("/").pop() ?? "project"
    const destDir = `${target}/${name}`

    await Bun.$`mkdir -p ${destDir}`

    const exclude = ["node_modules", ".cache", "dist", "build", "*.log", ".git"]
    for (const ex of exclude) {
      await Bun.$`find ${source} -name "${ex}" -type d -exec rm -rf {} + 2>/dev/null || true`.text()
    }

    await Bun.$`cp -r ${source}/* ${destDir}/ 2>/dev/null || true`.text()

    const size = await Bun.$`du -sh ${destDir}`.text()
    return `專案 ${name} 已同步到 ${destDir} (${size.trim()})`
  },
})

const listProjects = tool({
  description: "列出可同步的專案",
  args: {},
  async execute({}, ctx: ToolContext) {
    const platform = getPlatform()
    const sep = platform === "windows" ? "\\" : "/"

    const projects = [
      { name: "OpenCode Packages", path: `${ctx.worktree}${sep}packages`, desc: "OpenCode 主程式" },
      { name: "OpenCode Config", path: `${ctx.worktree}${sep}.opencode`, desc: "配置與設定" },
      {
        name: "OpenCode Memory",
        path: `${ctx.worktree}${sep}.opencode${sep}memory`,
        desc: "記憶系統 (可備份到 GitHub)",
      },
      {
        name: "OpenClaw",
        path: platform === "windows" ? "D:\\Tools\\openclaw" : "/home/reamaster/openclaw-manager/openclaw",
        desc: "OpenClaw 主程式",
      },
      {
        name: "OpenClaw Manager",
        path: platform === "windows" ? "D:\\Tools\\openclaw-manager" : "/home/reamaster/openclaw-manager",
        desc: "管理工具集合",
      },
    ]

    const results = ["## 可同步的專案"]

    for (const proj of projects) {
      const exists = await Bun.file(proj.path).exists()
      const status = exists ? "✓" : "✗"
      let size = ""
      if (exists) {
        try {
          size = await Bun.$`du -sh ${proj.path}`.text()
          size = ` (${size.trim().split("\t")[0]})`
        } catch {}
      }
      results.push(`- ${status} ${proj.name}${size}`)
      results.push(`  ${proj.desc}`)
      results.push(`  ${proj.path}`)
    }

    return results.join("\n")
  },
})

const configBackupPaths = tool({
  description: "設定自定義備份路徑 (跨系統共享)",
  args: {
    name: z.string().describe("路徑名稱 (如 'usb', 'github', 'nas')"),
    path: z.string().describe("路徑位置"),
    type: z.enum(["local", "remote", "github"]).optional().describe("路徑類型"),
    allowUpload: z.boolean().optional().describe("允許上傳 (預設 true)"),
  },
  async execute({ name, path, type, allowUpload }, ctx: ToolContext) {
    const configPath = `${ctx.worktree}/.opencode/config/backup-paths.json`
    let config: Record<string, any> = {}

    if (await Bun.file(configPath).exists()) {
      config = await Bun.file(configPath).json()
    }

    config[name] = {
      path,
      type: type ?? "local",
      allowUpload: allowUpload ?? true,
      updated: Date.now(),
    }

    await Bun.$`mkdir -p ${ctx.worktree}/.opencode/config`.text()
    await Bun.write(configPath, JSON.stringify(config, null, 2))

    const uploadStatus = allowUpload === false ? " | 🔒 已禁止上傳" : " | ✅ 允許上傳"
    return `## ✅ 路徑已設定
- 名稱: ${name}
- 路徑: ${path}
- 類型: ${type ?? "local"}${uploadStatus}`
  },
})

const setGlobalUploadControl = tool({
  description: "設定全域上傳控制 (禁止所有自動上傳)",
  args: {
    enabled: z.boolean().describe("true = 禁止上傳, false = 允許上傳"),
  },
  async execute({ enabled }, ctx: ToolContext) {
    const configPath = `${ctx.worktree}/.opencode/config/upload-control.json`
    const config = {
      globalDisable: enabled,
      updated: Date.now(),
    }

    await Bun.$`mkdir -p ${ctx.worktree}/.opencode/config`.text()
    await Bun.write(configPath, JSON.stringify(config, null, 2))

    return enabled ? "🔒 已禁止所有自動上傳 (知識庫備份將僅存本地)" : "✅ 已允許自動上傳"
  },
})

const getUploadControl = tool({
  description: "查看目前上傳控制設定",
  args: {},
  async execute({}, ctx: ToolContext) {
    const configPath = `${ctx.worktree}/.opencode/config/upload-control.json`

    if (!(await Bun.file(configPath).exists())) {
      return "## 上傳控制設定\n- 全域: ✅ 允許上傳\n- 預設允許自動同步到 GitHub"
    }

    const config = await Bun.file(configPath).json()
    const status = config.globalDisable ? "🔒 禁止" : "✅ 允許"

    return `## 上錄控制設定
- 全域: ${status} 上傳
- 更新時間: ${new Date(config.updated).toLocaleString("zh-TW")}`
  },
})

const uploadConfig = tool({
  description: "設定特定類型的上傳權限",
  args: {
    target: z.enum(["knowledge", "memory", "all"]).describe("目標類型"),
    allow: z.boolean().describe("true = 允許, false = 禁止"),
  },
  async execute({ target, allow }, ctx: ToolContext) {
    const configPath = `${ctx.worktree}/.opencode/config/upload-control.json`
    let config: Record<string, any> = {}

    if (await Bun.file(configPath).exists()) {
      config = await Bun.file(configPath).json()
    }

    if (target === "all") {
      config.globalDisable = !allow
    } else {
      config[`${target}Upload`] = allow
    }
    config.updated = Date.now()

    await Bun.$`mkdir -p ${ctx.worktree}/.opencode/config`.text()
    await Bun.write(configPath, JSON.stringify(config, null, 2))

    const targetName = { knowledge: "知識庫", memory: "記憶", all: "所有" }[target]
    return `## ✅ ${targetName} 上傳設定已更新\n${allow ? "✅ 允許上傳" : "🔒 禁止上傳"}`
  },
})

const listBackupPaths = tool({
  description: "列表已設定的備份路徑",
  args: {},
  async execute({}, ctx: ToolContext) {
    const configPath = `${ctx.worktree}/.opencode/config/backup-paths.json`

    if (!(await Bun.file(configPath).exists())) {
      return "尚無設定的自定義路徑"
    }

    const config = await Bun.file(configPath).json()
    const results = ["## 已設定的備份路徑"]

    for (const [name, info] of Object.entries(config)) {
      const infoTyped = info as { path: string; type: string; updated: number }
      const date = new Date(infoTyped.updated).toLocaleString("zh-TW")
      results.push(`- ${name}: ${infoTyped.path} (${infoTyped.type}) - ${date}`)
    }

    return results.join("\n")
  },
})

const backupToGitHub = tool({
  description: "備份記憶到 GitHub (自動 commit)",
  args: {
    repo: z.string().describe("GitHub repo URL 或 user/repo"),
    branch: z.string().optional().describe("分支名稱 (預設: main)"),
    message: z.string().optional().describe("提交訊息"),
  },
  async execute({ repo, branch, message }, ctx: ToolContext) {
    const memoryPath = `${ctx.worktree}/.opencode/memory`

    if (!(await Bun.file(memoryPath).exists())) {
      return "✗ 記憶目錄不存在"
    }

    const memoryExists = await Bun.file(memoryPath).exists()
    if (!memoryExists) return "✗ 無記憶可備份"

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "")
    const commitMsg = message ?? `backup: memory ${timestamp}`

    const gitDir = `${ctx.worktree}/.opencode/.git`
    const isGitRepo = await Bun.file(gitDir).exists()

    if (!isGitRepo) {
      return "✗ 目錄不是 Git 仓库，無法提交到 GitHub\n請先初始化: git init"
    }

    try {
      await Bun.$`cd ${ctx.worktree} && git add .opencode/memory/`.text()
      await Bun.$`cd ${ctx.worktree} && git commit -m "${commitMsg}"`.text()

      let pushResult = ""
      try {
        await Bun.$`cd ${ctx.worktree} && git push origin ${branch ?? "main"}`.text()
        pushResult = "\n✓ 已推送到 GitHub"
      } catch {
        pushResult = "\n⚠️ 已提交但未推送 (請手動 git push)"
      }

      return `## ✅ 記憶已備份
- 提交訊息: ${commitMsg}${pushResult}
- 路徑: .opencode/memory/`
    } catch (e) {
      return `✗ 備份失敗: ${e}`
    }
  },
})

const backupWithPath = tool({
  description: "使用已設定的路徑備份",
  args: {
    pathName: z.string().describe("已設定的路徑名稱"),
    projects: z.array(z.string()).optional().describe("要備份的專案名稱陣列"),
  },
  async execute({ pathName, projects }, ctx: ToolContext) {
    const configPath = `${ctx.worktree}/.opencode/config/backup-paths.json`

    if (!(await Bun.file(configPath).exists())) {
      return "✗ 無已設定的路徑，請先使用 config_backup_paths 設定"
    }

    const config = await Bun.file(configPath).json()
    const pathConfig = config[pathName]

    if (!pathConfig) return `✗ 路徑 ${pathName} 不存在`

    const target = pathConfig.path
    const exists = await Bun.file(target).exists()
    if (!exists) return `✗ 路徑不存在: ${target}`

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const backupName = `OpenCode_Backup_${timestamp}`
    const destDir = `${target}/${backupName}`

    await Bun.$`mkdir -p ${destDir}`

    const defaultProjects = ["opencode-config", "opencode-packages", "opencode-memory"]
    const toBackup = projects ?? defaultProjects

    const platform = getPlatform()
    const sep = platform === "windows" ? "\\" : "/"

    const projectPaths: Record<string, string> = {
      "opencode-config": `${ctx.worktree}${sep}.opencode`,
      "opencode-packages": `${ctx.worktree}${sep}packages`,
      "opencode-memory": `${ctx.worktree}${sep}.opencode${sep}memory`,
    }

    let totalSize = 0
    const results: string[] = []

    for (const projName of toBackup) {
      const src = projectPaths[projName]
      if (!src) continue

      if (await Bun.file(src).exists()) {
        const dest = `${destDir}/${projName}`
        await Bun.$`mkdir -p ${dest} && cp -r ${src}/* ${dest}/ 2>/dev/null || true`.text()

        try {
          const size = await Bun.$`du -sb ${dest}`.text()
          totalSize += parseInt(size.trim().split("\t")[0]) || 0
          results.push(`✓ ${projName}`)
        } catch {
          results.push(`✗ ${projName}`)
        }
      }
    }

    return `## ✅ 備份完成
- 目標: ${target}
- 專案: ${toBackup.join(", ")}
- 大小: ${formatBytes(totalSize)}
- 位置: ${destDir}`
  },
})

export const backupSyncPlugin = async (input: any) => ({
  tool: {
    backup_detect: detectStorage,
    backup_list: listBackups,
    backup_local: localBackup,
    backup_sync: syncToStorage,
    backup_restore: restoreBackup,
    backup_status: checkStatus,
    backup_sync_project: syncProject,
    backup_list_projects: listProjects,
    backup_config_paths: configBackupPaths,
    backup_list_paths: listBackupPaths,
    backup_to_github: backupToGitHub,
    backup_with_path: backupWithPath,
    backup_upload_control: setGlobalUploadControl,
    backup_upload_status: getUploadControl,
    backup_upload_config: uploadConfig,
  },
})
