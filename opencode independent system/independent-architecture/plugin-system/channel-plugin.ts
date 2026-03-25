// 多渠道訊息整合插件
// 支援 Telegram、Discord、Slack、Webhook

import {
  PluginMetadata,
  PluginHooks,
  PluginInstance,
  PluginContext,
  PluginResult,
  HealthCheckResult,
} from "./skill-plugin.interface"

interface ChannelConfig {
  enabled: boolean
  webhookUrl?: string
  botToken?: string
}

interface MessageRecord {
  id: string
  channel: string
  content: string
  timestamp: number
  success: boolean
}

export class ChannelPlugin implements PluginHooks {
  private channels: Map<string, ChannelConfig> = new Map()
  private history: MessageRecord[] = []
  private maxHistory = 100

  constructor() {
    this.channels.set("telegram", { enabled: false })
    this.channels.set("discord", { enabled: false })
    this.channels.set("slack", { enabled: false })
    this.channels.set("webhook", { enabled: false })

    this.loadFromEnv()
  }

  async onInit(): Promise<void> {
    console.log("[channel-plugin] Multi-channel integration initialized")
  }

  async onLoad(): Promise<void> {
    console.log("[channel-plugin] Channel plugin loaded")
  }

  async onUnload(): Promise<void> {
    this.saveConfig()
  }

  async onProcess(input: string, context: PluginContext): Promise<PluginResult | null> {
    const lower = input.toLowerCase()

    if (lower.includes("channel") || lower.includes("頻道") || lower.includes("通知")) {
      if (lower.includes("list") || lower.includes("列表")) {
        return this.listChannels()
      }
      if (lower.includes("send") || lower.includes("發送")) {
        return this.sendMessage(input)
      }
      if (lower.includes("history") || lower.includes("歷史")) {
        return this.showHistory()
      }
      if (lower.includes("config") || lower.includes("設定")) {
        return this.configureChannel(input)
      }
      return this.showHelp()
    }

    return null
  }

  async onHealthCheck(): Promise<HealthCheckResult> {
    const enabled = Array.from(this.channels.values()).filter(c => c.enabled).length
    const total = this.channels.size

    return {
      status: enabled > 0 ? "healthy" : "warning",
      message: `Channels: ${enabled}/${total} enabled`,
      confidence: 0.9,
      metrics: { enabled, total, sent: this.history.length },
    }
  }

  private loadFromEnv(): void {
    if (process.env.DISCORD_WEBHOOK_URL) {
      this.channels.set("discord", { enabled: true, webhookUrl: process.env.DISCORD_WEBHOOK_URL })
    }
    if (process.env.TELEGRAM_BOT_TOKEN) {
      this.channels.set("telegram", { enabled: true, botToken: process.env.TELEGRAM_BOT_TOKEN })
    }
    if (process.env.SLACK_WEBHOOK_URL) {
      this.channels.set("slack", { enabled: true, webhookUrl: process.env.SLACK_WEBHOOK_URL })
    }
  }

  private listChannels(): PluginResult {
    const output = [
      "頻道列表 / Channel List",
      "═══════════════════════════════",
      ...Array.from(this.channels.entries()).map(([name, config]) => {
        const status = config.enabled ? "✓ 已啟用" : "○ 未啟用"
        const detail = config.webhookUrl ? " (Webhook)" : config.botToken ? " (Bot Token)" : ""
        return `${name.padEnd(10)} ${status}${detail}`
      }),
    ].join("\n")

    return { success: true, output, confidence: 0.9 }
  }

  private async sendMessage(input: string): Promise<PluginResult> {
    const channelMatch = input.match(/--channel\s+(\S+)/i) || input.match(/頻道\s+(\S+)/)
    const messageMatch = input.match(/--message\s+(.+)/i) || input.match(/訊息\s+(.+)/)

    const channel = channelMatch?.[1]?.toLowerCase()
    const message = messageMatch?.[1] || this.extractQuickMessage(input)

    if (!channel) {
      return { success: false, output: "請指定頻道: /channel send --channel discord --message 訊息", confidence: 0.8 }
    }

    if (!message) {
      return { success: false, output: "請指定訊息內容", confidence: 0.8 }
    }

    const config = this.channels.get(channel)
    if (!config?.enabled) {
      return { success: false, output: `頻道 ${channel} 未啟用，請先設定`, confidence: 0.8 }
    }

    try {
      const success = await this.sendToChannel(channel, message, config)

      this.history.push({
        id: `msg-${Date.now()}`,
        channel,
        content: message,
        timestamp: Date.now(),
        success,
      })

      if (this.history.length > this.maxHistory) {
        this.history = this.history.slice(-this.maxHistory)
      }

      return {
        success,
        output: success ? `✓ 訊息已發送至 ${channel}` : `✗ 發送失敗`,
        confidence: 0.9,
      }
    } catch (error: any) {
      return { success: false, output: `發送失敗: ${error.message}`, confidence: 0.8 }
    }
  }

  private async sendToChannel(channel: string, message: string, config: ChannelConfig): Promise<boolean> {
    try {
      if (channel === "discord" && config.webhookUrl) {
        const response = await fetch(config.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: message }),
        })
        return response.ok
      }

      if (channel === "telegram" && config.botToken) {
        const chatId = process.env.TELEGRAM_CHAT_ID
        if (!chatId) throw new Error("TELEGRAM_CHAT_ID not set")
        const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: message }),
        })
        return response.ok
      }

      if (channel === "slack" && config.webhookUrl) {
        const response = await fetch(config.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: message }),
        })
        return response.ok
      }

      return false
    } catch {
      return false
    }
  }

  private extractQuickMessage(input: string): string {
    const patterns = [
      /send\s+(?:to\s+)?\w+\s+(?:--message\s+)?(.+)/i,
      /訊息\s+(?:to\s+)?\w+\s+(.+)/,
    ]
    for (const p of patterns) {
      const match = input.match(p)
      if (match) return match[1].trim()
    }
    return input.replace(/channel|send|頻道|發送/gi, "").trim()
  }

  private showHistory(): PluginResult {
    if (this.history.length === 0) {
      return { success: true, output: "目前沒有發送記錄", confidence: 0.9 }
    }

    const recent = this.history.slice(-10).reverse()
    const output = [
      "發送歷史 / Send History",
      "═══════════════════════════════",
      ...recent.map(m => {
        const time = new Date(m.timestamp).toLocaleString()
        const status = m.success ? "✓" : "✗"
        return `${status} [${m.channel}] ${time}\n  ${m.content.substring(0, 50)}...`
      }),
    ].join("\n")

    return { success: true, output, confidence: 0.9 }
  }

  private configureChannel(input: string): PluginResult {
    const channelMatch = input.match(/--channel\s+(\S+)/i) || input.match(/頻道\s+(\S+)/)
    const typeMatch = input.match(/--type\s+(\S+)/i)
    const urlMatch = input.match(/--url\s+(.+)/i) || input.match(/網址\s+(.+)/)

    if (!channelMatch) {
      return {
        success: true,
        output: `頻道設定 / Channel Config
═══════════════════════════════
/channel config --channel discord --type webhook --url <webhook-url>
/channel config --channel telegram --type bot --url <bot-token>
/channel config --channel slack --type webhook --url <webhook-url>

環境變數:
  DISCORD_WEBHOOK_URL
  TELEGRAM_BOT_TOKEN
  TELEGRAM_CHAT_ID
  SLACK_WEBHOOK_URL`,
        confidence: 0.9,
      }
    }

    const channel = channelMatch[1].toLowerCase()
    const type = typeMatch?.[1]?.toLowerCase()
    const url = urlMatch?.[1]?.trim()

    if (type === "webhook" && url) {
      this.channels.set(channel, { enabled: true, webhookUrl: url })
      return { success: true, output: `✓ ${channel} 已設定 Webhook`, confidence: 0.9 }
    }

    if (type === "bot" && url) {
      this.channels.set(channel, { enabled: true, botToken: url })
      return { success: true, output: `✓ ${channel} 已設定 Bot Token`, confidence: 0.9 }
    }

    return { success: false, output: "請提供完整設定", confidence: 0.8 }
  }

  private showHelp(): PluginResult {
    return {
      success: true,
      output: `頻道管理 / Channel Management
═══════════════════════════════

指令:
  /channel list           頻道列表
  /channel send           發送訊息
  /channel history         發送歷史
  /channel config         頻道設定

發送範例:
  /channel send --channel discord --message 測試訊息
  /channel send --channel telegram --message 測試訊息

設定範例:
  /channel config --channel discord --type webhook --url https://...
  /channel config --channel telegram --type bot --url <bot-token>`,
      confidence: 0.9,
    }
  }

  private saveConfig(): void {
    // 設定持久化（可擴展）
  }

  getChannels(): Map<string, ChannelConfig> {
    return this.channels
  }

  getHistory(): MessageRecord[] {
    return this.history
  }
}

export const createChannelPlugin = (): PluginInstance => {
  const plugin = new ChannelPlugin()

  return {
    metadata: {
      name: "channel-plugin",
      version: "1.0.0",
      description: "多渠道訊息整合 - Discord/Telegram/Slack",
      category: "utility",
      triggers: [
        "channel", "channels", "頻道", "通知",
        "discord", "telegram", "slack",
        "send", "發送", "webhook",
      ],
      autoLoad: true,
    },
    hooks: plugin,
    status: "unloaded",
    config: {
      enabled: true,
      priority: 55,
      settings: {},
    },
  }
}

export default ChannelPlugin
