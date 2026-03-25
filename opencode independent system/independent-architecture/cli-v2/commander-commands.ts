// 指揮官命令 - 服務管理 CLI

import { Log } from "../util/log"
import { getCommander, type Commander, type Service } from "./commander"
import { CommanderWebServer } from "./commander-web-server"

export const log = Log.create({ service: "commander-commands" })

let webServer: CommanderWebServer | null = null

// ============================================
// 格式化工具
// ============================================

function formatUptime(ms?: number): string {
  if (!ms) return "N/A"
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

function formatStatus(status: string): string {
  switch (status) {
    case "running":
      return "🟢 運行中"
    case "stopped":
      return "⚪ 已停止"
    case "error":
      return "🔴 錯誤"
    case "starting":
      return "🟡 啟動中"
    case "stopping":
      return "🟠 停止中"
    default:
      return "❓ 未知"
  }
}

// ============================================
// 指揮官命令工廠
// ============================================

export function createCommanderCommands(commander: Commander) {
  return {
    // ============================================
    // 幫助
    // ============================================
    help: async (): Promise<string> => {
      return `獨立架構 指揮官 - 服務管理系統
═══════════════════════════════════════════════════════

📋 服務管理:
   commander start <name>      啟動服務
   commander stop <name>       停止服務
   commander restart <name>    重啟服務
   commander start all         啟動所有服務
   commander stop all          停止所有服務
   commander restart all       重啟所有服務

📊 狀態查詢:
   commander status           總覽狀態
   commander list             服務列表
   commander health <name>    健康檢查
   commander info <name>      服務詳情

📝 日誌:
   commander logs <name>      查看日誌
   commander logs <name> -f   即時追蹤

🔧 管理:
   commander register         註冊新服務
   commander unregister        移除服務
   commander config           配置

📈 事件:
   commander events           查看事件
   commander events -w        監控事件

範例:
   commander start opencode
   commander status
   commander restart all
   commander logs openclaw --tail=50

📖 詳細指南: COMMANDER_GUIDE.md
`
    },

    // ============================================
    // 狀態總覽
    // ============================================
    status: async (): Promise<string> => {
      const status = commander.getServiceStatus()
      const running = commander.getRunningServices()

      let output = `指揮官狀態總覽
═══════════════════════════════════════════════════════

📊 服務統計:
   總計: ${status.total}
   運行: ${status.running} 🟢
   停止: ${status.stopped} ⚪
   錯誤: ${status.error} ${status.error > 0 ? "🔴" : ""}

`

      if (running.length > 0) {
        output += `🟢 運行中的服務:\n`
        for (const svc of running) {
          output += `   • ${svc.name} (PID: ${svc.pid}, 運行: ${formatUptime(svc.uptime)})\n`
        }
        output += `\n`
      }

      output += `💡 使用 commander list 查看所有服務
`
      return output
    },

    // ============================================
    // 服務列表
    // ============================================
    list: async (): Promise<string> => {
      const services = commander.getAllServices()

      let output = `服務列表
═══════════════════════════════════════════════════════

`

      for (const svc of services) {
        const statusIcon = formatStatus(svc.status)
        output += `${statusIcon} ${svc.name}\n`
        output += `   └─ ${svc.description}\n`
        if (svc.port) output += `   └─ 端口: ${svc.port}\n`
        if (svc.status === "running" && svc.pid) {
          output += `   └─ PID: ${svc.pid}, 運行: ${formatUptime(svc.uptime)}\n`
        }
        if (svc.lastError) {
          output += `   └─ 錯誤: ${svc.lastError}\n`
        }
        output += `\n`
      }

      output += `總計: ${services.length} 個服務
`
      return output
    },

    // ============================================
    // 啟動服務
    // ============================================
    start: async (name?: string): Promise<string> => {
      if (!name || name === "all") {
        const count = await commander.startAll()
        return `已啟動 ${count} 個服務\n`
      }

      const success = await commander.startService(name)
      if (success) {
        return `✅ 服務 ${name} 已啟動\n`
      }
      return `❌ 服務 ${name} 啟動失敗\n`
    },

    // ============================================
    // 停止服務
    // ============================================
    stop: async (name?: string): Promise<string> => {
      if (!name || name === "all") {
        const count = await commander.stopAll()
        return `已停止 ${count} 個服務\n`
      }

      const success = await commander.stopService(name)
      if (success) {
        return `✅ 服務 ${name} 已停止\n`
      }
      return `❌ 服務 ${name} 停止失敗\n`
    },

    // ============================================
    // 重啟服務
    // ============================================
    restart: async (name?: string): Promise<string> => {
      if (!name || name === "all") {
        await commander.stopAll()
        await new Promise((r) => setTimeout(r, 1000))
        const count = await commander.startAll()
        return `已重啟 ${count} 個服務\n`
      }

      const success = await commander.restartService(name)
      if (success) {
        return `✅ 服務 ${name} 已重啟\n`
      }
      return `❌ 服務 ${name} 重啟失敗\n`
    },

    // ============================================
    // 健康檢查
    // ============================================
    health: async (name?: string): Promise<string> => {
      if (!name) {
        // 檢查所有服務
        const services = commander.getAllServices()
        let output = `健康檢查報告
═══════════════════════════════════════════════════════

`

        for (const svc of services) {
          const health = await commander.checkServiceHealth(svc.name)
          const icon = health.healthy ? "✅" : "❌"
          output += `${icon} ${svc.name}: ${health.message}`
          if (health.responseTime) output += ` (${health.responseTime}ms)`
          output += `\n`
        }

        return output
      }

      const health = await commander.checkServiceHealth(name)
      const icon = health.healthy ? "✅ 健康" : "❌ 不健康"

      let output = `服務健康檢查: ${name}
═══════════════════════════════════════════════════════

狀態: ${icon}
`
      if (health.responseTime) output += `響應時間: ${health.responseTime}ms\n`
      if (health.message) output += `訊息: ${health.message}\n`

      return output
    },

    // ============================================
    // 服務詳情
    // ============================================
    info: async (name?: string): Promise<string> => {
      if (!name) {
        return `請指定服務名稱: commander info <name>\n`
      }

      const service = commander.getService(name)
      if (!service) {
        return `找不到服務: ${name}\n`
      }

      return `服務詳情: ${name}
═══════════════════════════════════════════════════════

名稱: ${service.name}
描述: ${service.description}
狀態: ${formatStatus(service.status)}
${service.port ? `端口: ${service.port}` : ""}
${service.pid ? `PID: ${service.pid}` : ""}
運行時間: ${formatUptime(service.uptime)}
重啟次數: ${service.restartCount}
自動重啟: ${service.autoRestart ? "是" : "否"}
${service.lastError ? `最後錯誤: ${service.lastError}` : ""}
${service.dependsOn?.length ? `依賴: ${service.dependsOn.join(", ")}` : ""}

命令: ${service.command} ${service.args?.join(" ") || ""}
${service.cwd ? `工作目錄: ${service.cwd}` : ""}
${service.healthCheck ? `健康檢查: ${service.healthCheck}` : ""}
`
    },

    // ============================================
    // 查看日誌
    // ============================================
    logs: async (name?: string, args?: string[]): Promise<string> => {
      if (!name) {
        return `請指定服務名稱: commander logs <name>\n`
      }

      const tail = args?.includes("-f") ? undefined : 50
      const logs = await commander.getLogs(name, tail)

      return `服務日誌: ${name}
═══════════════════════════════════════════════════════

${logs || "無日誌"}
`
    },

    // ============================================
    // 查看事件
    // ============================================
    events: async (args?: string[]): Promise<string> => {
      const events = commander.getEvents(20)
      const watch = args?.includes("-w")

      let output = `最近事件
═══════════════════════════════════════════════════════

`

      if (events.length === 0) {
        output += "無事件\n"
      } else {
        for (const event of events.reverse()) {
          const time = new Date(event.timestamp).toLocaleTimeString()
          let icon = "📋"
          if (event.type.includes("started")) icon = "🟢"
          else if (event.type.includes("stopped")) icon = "⚪"
          else if (event.type.includes("error")) icon = "🔴"
          else if (event.type.includes("health_ok")) icon = "✅"
          else if (event.type.includes("health_fail")) icon = "❌"

          output += `${icon} [${time}] ${event.service || "System"}: ${event.message}\n`
        }
      }

      if (watch) {
        output += `\n監控中... (Ctrl+C 退出)\n`
      }

      return output
    },

    // ============================================
    // 服務註冊
    // ============================================
    register: async (name?: string): Promise<string> => {
      if (!name) {
        return `請指定服務名稱: commander register <name>
        
範例:
  commander register my-service --command=bun --args="run server.ts" --port=3000
`
      }

      return `服務註冊功能需要完整參數

請使用 commander register 自訂服務

必要參數:
  --name       服務名稱
  --command    執行命令
  --port       端口 (可選)
  --desc       描述 (可選)
`
    },

    // ============================================
    // 服務移除
    // ============================================
    unregister: async (name?: string): Promise<string> => {
      if (!name) {
        return `請指定服務名稱: commander unregister <name>\n`
      }

      const service = commander.getService(name)
      if (!service) {
        return `找不到服務: ${name}\n`
      }

      if (service.status === "running") {
        return `無法移除運行中的服務: ${name}\n請先停止服務: commander stop ${name}\n`
      }

      const success = commander.unregisterService(name)
      if (success) {
        return `✅ 服務 ${name} 已移除\n`
      }
      return `❌ 服務移除失敗\n`
    },

    // ============================================
    // Web 介面
    // ============================================
    web: async (args?: string[]): Promise<string> => {
      const action = args?.[0] || "status"

      switch (action) {
        case "start":
          if (webServer) {
            return `🌐 Web 介面已在運行: http://localhost:${webServer.getPort()}\n`
          }
          webServer = new CommanderWebServer(commander)
          await webServer.start()
          return `🌐 Web 介面已啟動: http://localhost:${webServer.getPort()}\n   開啟瀏覽器訪問管理介面\n`

        case "stop":
          if (webServer) {
            await webServer.stop()
            webServer = null
            return `🌐 Web 介面已停止\n`
          }
          return `🌐 Web 介面未運行\n`

        case "status":
          if (webServer) {
            return `🌐 Web 介面狀態: 運行中
   URL: http://localhost:${webServer.getPort()}
   狀態: 正常
`
          }
          return `🌐 Web 介面狀態: 未運行
   使用 commander web start 啟動
`

        case "help":
        default:
          return `Web 介面指令
═══════════════════════════════════════════════════════

🌐 Web 介面管理:
   commander web start     啟動 Web 介面
   commander web stop       停止 Web 介面
   commander web status     查看狀態

功能:
   • 圖形化服務管理介面
   • 即時狀態監控
   • 一鍵啟動/停止/重啟
   • 日誌查看
   • 安全中心面板
   • 事件日誌

範例:
   commander web start
   # 開啟瀏覽器訪問 http://localhost:3001
`
      }
    },
  }
}
