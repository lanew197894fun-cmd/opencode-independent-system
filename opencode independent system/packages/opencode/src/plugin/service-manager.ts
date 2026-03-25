import { tool, type ToolContext } from "@opencode-ai/plugin"
import z from "zod"

const OPENCLAW_PORT = 18789
const OPENCODE_PORT = 4096

const startService = tool({
  description: "啟動 OpenCode/OpenClaw Gateway 服務",
  args: {
    service: z.enum(["opencode", "openclaw", "all"]).optional().describe("要啟動的服務 (預設: all)"),
  },
  async execute({ service }, ctx: ToolContext) {
    const results: string[] = []

    if (service === "opencode" || service === "all") {
      try {
        await Bun.$`opencode`.text()
        results.push("✓ OpenCode 已在執行")
      } catch {
        const proc = Bun.spawn(["opencode"], {
          stdout: "ignore",
          detached: true,
        })
        proc.unref()
        results.push("→ OpenCode 啟動中...")
      }
    }

    if (service === "openclaw" || service === "all") {
      try {
        const running = await Bun.$`lsof -ti :${OPENCLAW_PORT}`.text()
        if (running.trim()) {
          results.push("✓ OpenClaw Gateway 已在執行")
        }
      } catch {
        try {
          await Bun.$`openclaw gateway`.text()
          results.push("→ OpenClaw Gateway 啟動中...")
        } catch {
          results.push("✗ OpenClaw 未安裝")
        }
      }
    }

    return results.join("\n")
  },
})

const stopService = tool({
  description: "停止 OpenCode/OpenClaw Gateway 服務",
  args: {
    service: z.enum(["opencode", "openclaw", "all"]).optional().describe("要停止的服務 (預設: all)"),
  },
  async execute({ service }, ctx: ToolContext) {
    const results: string[] = []

    if (service === "opencode" || service === "all") {
      try {
        await Bun.$`pkill -f "opencode"`.text()
        results.push("✓ OpenCode 已停止")
      } catch {
        results.push("- OpenCode 未執行")
      }
    }

    if (service === "openclaw" || service === "all") {
      try {
        const pid = await Bun.$`lsof -ti :${OPENCLAW_PORT}`.text()
        if (pid.trim()) {
          await Bun.$`kill ${pid.trim()}`.text()
          results.push("✓ OpenClaw Gateway 已停止")
        } else {
          results.push("- OpenClaw Gateway 未執行")
        }
      } catch {
        results.push("- OpenClaw Gateway 未執行")
      }
    }

    return results.join("\n")
  },
})

const serviceStatus = tool({
  description: "查看服務執行狀態與資源使用",
  args: {},
  async execute({}, ctx: ToolContext) {
    const results: string[] = ["## 服務狀態"]

    try {
      const opencodePid = await Bun.$`pgrep -f "opencode"`.text()
      if (opencodePid.trim()) {
        const stats = await Bun.$`ps -p ${opencodePid.trim().split("\n")[0]} -o %cpu,%mem,rss=`.text()
        const [cpu, mem, rss] = stats.trim().split(/\s+/)
        const rssMb = Math.round(parseInt(rss) / 1024)
        results.push(`✓ OpenCode: PID ${opencodePid.trim().split("\n")[0]} | CPU: ${cpu}% | RAM: ${mem}% (${rssMb}MB)`)
      } else {
        results.push("✗ OpenCode: 未執行")
      }
    } catch {
      results.push("✗ OpenCode: 未執行")
    }

    try {
      const openclawPid = await Bun.$`lsof -ti :${OPENCLAW_PORT}`.text()
      if (openclawPid.trim()) {
        const stats = await Bun.$`ps -p ${openclawPid.trim()} -o %cpu,%mem,rss=`.text()
        const [cpu, mem, rss] = stats.trim().split(/\s+/)
        const rssMb = Math.round(parseInt(rss) / 1024)
        results.push(`✓ OpenClaw: PID ${openclawPid.trim()} | CPU: ${cpu}% | RAM: ${mem}% (${rssMb}MB)`)
      } else {
        results.push("✗ OpenClaw Gateway: 未執行")
      }
    } catch {
      results.push("✗ OpenClaw Gateway: 未執行")
    }

    return results.join("\n")
  },
})

const healthCheck = tool({
  description: "健康檢查 - 驗證服務正常運作",
  args: {},
  async execute({}, ctx: ToolContext) {
    const results: string[] = ["## 健康檢查"]

    let opencodeOk = false
    let openclawOk = false

    try {
      const opencodePid = await Bun.$`pgrep -f "opencode"`.text()
      if (opencodePid.trim()) {
        results.push("✓ OpenCode: 執行中")
        opencodeOk = true

        try {
          const resp = await fetch("http://localhost:4096/health").catch(() => null)
          if (resp?.ok) {
            results.push("✓ OpenCode API: 正常")
          } else {
            results.push("✗ OpenCode API: 無回應")
          }
        } catch {
          results.push("✗ OpenCode API: 無法連線")
        }
      } else {
        results.push("✗ OpenCode: 未執行")
      }
    } catch {
      results.push("✗ OpenCode: 未執行")
    }

    try {
      const openclawPid = await Bun.$`lsof -ti :${OPENCLAW_PORT}`.text()
      if (openclawPid.trim()) {
        results.push("✓ OpenClaw Gateway: 執行中")
        openclawOk = true
      } else {
        results.push("✗ OpenClaw Gateway: 未執行")
      }
    } catch {
      results.push("✗ OpenClaw Gateway: 未執行")
    }

    results.push("")
    if (opencodeOk && openclawOk) {
      results.push("🎉 所有服務正常運作")
    } else {
      results.push("⚠️ 部分服務需要關注")
    }

    return results.join("\n")
  },
})

const viewLogs = tool({
  description: "查看服務日誌",
  args: {
    lines: z.number().optional().describe("顯示行數 (預設: 50)"),
    service: z.enum(["opencode", "openclaw"]).optional().describe("指定服務"),
  },
  async execute({ lines, service }, ctx: ToolContext) {
    const defaultLines = lines ?? 50

    if (service === "openclaw" || !service) {
      try {
        const logPath = `${process.env.HOME}/.openclaw/logs/gateway.log`
        if (await Bun.file(logPath).exists()) {
          const content = await Bun.file(logPath).text()
          const lastLines = content.split("\n").slice(-defaultLines).join("\n")
          return `## OpenClaw Gateway 日誌 (最後 ${defaultLines} 行)\n${lastLines}`
        }
      } catch {}
    }

    if (service === "opencode" || !service) {
      try {
        const logPath = `${ctx.worktree}/.opencode/logs/opencode.log`
        if (await Bun.file(logPath).exists()) {
          const content = await Bun.file(logPath).text()
          const lastLines = content.split("\n").slice(-defaultLines).join("\n")
          return `## OpenCode 日誌 (最後 ${defaultLines} 行)\n${lastLines}`
        }
      } catch {}
    }

    return "無日誌資料"
  },
})

const restartService = tool({
  description: "重啟服務",
  args: {
    service: z.enum(["opencode", "openclaw", "all"]).optional().describe("要重啟的服務 (預設: all)"),
  },
  async execute({ service }, ctx: ToolContext) {
    const svc = service ?? "all"

    await stopService.execute({ service: svc }, ctx)

    await new Promise((r) => setTimeout(r, 1000))

    return startService.execute({ service: svc }, ctx)
  },
})

const openWebUI = tool({
  description: "開啟網頁管理介面",
  args: {},
  async execute({}, ctx: ToolContext) {
    return "## 網頁介面\n- OpenCode: http://localhost:4096\n- OpenClaw: http://localhost:18789\n\n注意：請確保服務正在執行"
  },
})

const openTerminal = tool({
  description: "開啟 OpenCode Terminal",
  args: {},
  async execute({}, ctx: ToolContext) {
    try {
      Bun.spawn(["opencode", "tui"], {
        stdout: "inherit",
        stdin: "inherit",
      })
      return "已開啟 OpenCode TUI"
    } catch {
      return "無法開啟 terminal，請確認 opencode 已安裝"
    }
  },
})

export const serviceManagerPlugin = async (input: any) => ({
  tool: {
    service_start: startService,
    service_stop: stopService,
    service_status: serviceStatus,
    service_health: healthCheck,
    service_logs: viewLogs,
    service_restart: restartService,
    service_web: openWebUI,
    service_terminal: openTerminal,
  },
})
