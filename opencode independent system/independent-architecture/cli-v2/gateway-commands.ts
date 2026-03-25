// 網關命令 - 整合頻道管理

import { getGateway, type Gateway, type GatewayMessage } from "./gateway"
import { Log } from "../util/log"

export const log = Log.create({ service: "gateway-commands" })

// ============================================
// 格式化
// ============================================

function formatStatus(connected: boolean): string {
  return connected ? "🟢 已連接" : "⚪ 未連接"
}

// ============================================
// 網關命令工廠
// ============================================

export function createGatewayCommands(gateway: Gateway) {
  return {
    // ============================================
    // 幫助
    // ============================================
    help: async (): Promise<string> => {
      return `獨立架構 網關 - 消息路由樞紐
═══════════════════════════════════════════════════════

📡 頻道管理:
   gateway connect <channel>    連接頻道
   gateway disconnect <channel>  斷開頻道
   gateway status              頻道狀態
   gateway list                頻道列表

📨 訊息:
   gateway send <channel> <msg>  發送訊息
   gateway history <channel>      查看歷史
   gateway history --all          查看全部歷史

🔀 路由:
   gateway routes              查看路由
   gateway route add <pattern>    新增路由
   gateway route del <pattern>    刪除路由

📊 狀態:
   gateway info                網關資訊

範例:
   gateway connect telegram
   gateway send telegram "Hello"
   gateway status

💡 支援頻道: telegram, discord, slack, webhook
`
    },

    // ============================================
    // 頻道列表
    // ============================================
    list: async (): Promise<string> => {
      const status = gateway.getChannelStatus()
      const channels = Object.entries(status)

      let output = `頻道列表
═══════════════════════════════════════════════════════

`

      if (channels.length === 0) {
        output += "無已註冊頻道\n"
      } else {
        for (const [name, info] of channels) {
          const time = info.lastActivity ? new Date(info.lastActivity).toLocaleString() : "無活動"
          output += `${formatStatus(info.connected)} ${name}\n`
          output += `   └─ 最近活動: ${time}\n\n`
        }
      }

      return output
    },

    // ============================================
    // 頻道狀態
    // ============================================
    status: async (channel?: string): Promise<string> => {
      const status = gateway.getChannelStatus()

      if (channel) {
        const info = status[channel]
        if (!info) {
          return `頻道未註冊: ${channel}\n`
        }
        return `頻道狀態: ${channel}
═══════════════════════════════════════════════════════

狀態: ${formatStatus(info.connected)}
最近活動: ${info.lastActivity ? new Date(info.lastActivity).toLocaleString() : "無"}
`
      }

      // 總覽
      let connected = 0
      let disconnected = 0
      for (const info of Object.values(status)) {
        if (info.connected) connected++
        else disconnected++
      }

      return `頻道狀態總覽
═══════════════════════════════════════════════════════

已連接: ${connected} 🟢
未連接: ${disconnected} ⚪
總計: ${Object.keys(status).length}

詳細列表:
${gateway
  .list()
  .map((ch) => `  ${formatStatus(gateway.isChannelConnected(ch))} ${ch}`)
  .join("\n")}
`
    },

    // ============================================
    // 連接頻道
    // ============================================
    connect: async (channel?: string): Promise<string> => {
      if (!channel) {
        return `請指定頻道: gateway connect <channel>\n`
      }

      gateway.registerChannel(channel)
      const success = gateway.connectChannel(channel)

      if (success) {
        return `✅ 頻道 ${channel} 已連接\n`
      }
      return `❌ 頻道 ${channel} 連接失敗\n`
    },

    // ============================================
    // 斷開頻道
    // ============================================
    disconnect: async (channel?: string): Promise<string> => {
      if (!channel) {
        return `請指定頻道: gateway disconnect <channel>\n`
      }

      const success = gateway.disconnectChannel(channel)

      if (success) {
        return `✅ 頻道 ${channel} 已斷開\n`
      }
      return `❌ 頻道 ${channel} 斷開失敗\n`
    },

    // ============================================
    // 發送訊息
    // ============================================
    send: async (args: string[]): Promise<string> => {
      const channel = args[0]
      const message = args.slice(1).join(" ")

      if (!channel || !message) {
        return `用法: gateway send <channel> <message>\n`
      }

      const success = await gateway.sendToChannel(channel, message)

      if (success) {
        return `✅ 訊息已發送到 ${channel}\n`
      }
      return `❌ 發送失敗，請確認頻道已連接\n`
    },

    // ============================================
    // 查看歷史
    // ============================================
    history: async (args: string[]): Promise<string> => {
      const channel = args[0] === "--all" ? undefined : args[0]
      const limit = parseInt(args.find((a) => a.startsWith("--limit="))?.split("=")[1] || "50")

      const history = gateway.getHistory(channel, limit)

      let output = `訊息歷史${channel ? `: ${channel}` : "(全部)"}
═══════════════════════════════════════════════════════

`

      if (history.length === 0) {
        output += "無歷史記錄\n"
      } else {
        for (const msg of history.reverse()) {
          const time = new Date(msg.timestamp).toLocaleTimeString()
          output += `[${time}] ${msg.channel}: ${msg.content.slice(0, 100)}${msg.content.length > 100 ? "..." : ""}\n`
        }
      }

      return output
    },

    // ============================================
    // 路由管理
    // ============================================
    routes: async (): Promise<string> => {
      const status = gateway.getStatus()

      let output = `路由列表
═══════════════════════════════════════════════════════

路由數量: ${status.routes}

提示: 路由用於自動處理訊息
      使用 gateway route add <pattern> 新增
`
      return output
    },

    // ============================================
    // 網關資訊
    // ============================================
    info: async (): Promise<string> => {
      const status = gateway.getStatus()
      const channelStatus = gateway.getChannelStatus()

      return `網關資訊
═══════════════════════════════════════════════════════

頻道統計:
   總數: ${status.channels}
   已連接: ${status.connectedChannels}
   未連接: ${status.channels - status.connectedChannels}

路由統計:
   路由數量: ${status.routes}

訊息統計:
   歷史訊息: ${status.messagesInHistory}

已連接頻道:
${
  Object.entries(channelStatus)
    .filter(([, info]) => info.connected)
    .map(([name]) => `   • ${name}`)
    .join("\n") || "   無"
}
`
    },
  }
}

// 擴展 Gateway 介面
declare module "./gateway" {
  interface Gateway {
    list(): string[]
  }
}

// 實現 list 方法
const originalGatewayProto = Object.getPrototypeOf(getGateway())
if (!originalGatewayProto.list) {
  ;(originalGatewayProto as any).list = function (): string[] {
    return Array.from(this.channels.keys())
  }
}
