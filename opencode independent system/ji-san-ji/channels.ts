/**
 * OpenCode 多渠道整合模組
 * 支援 Telegram、Discord、Slack 等訊息渠道
 */

export interface Message {
  id: string
  channel: "telegram" | "discord" | "slack" | "web" | "signal"
  from: string
  content: string
  timestamp: number
  attachments?: string[]
}

export interface ChannelConfig {
  enabled: boolean
  webhookUrl?: string
  botToken?: string
}

export class MultiChannel {
  private channels: Map<string, ChannelConfig> = new Map()

  constructor() {
    this.channels.set("telegram", { enabled: false })
    this.channels.set("discord", { enabled: false })
    this.channels.set("slack", { enabled: false })
    this.channels.set("web", { enabled: true })

    // 自動讀取環境變數
    if (process.env.DISCORD_WEBHOOK_URL) {
      this.channels.set("discord", {
        enabled: true,
        webhookUrl: process.env.DISCORD_WEBHOOK_URL,
      })
    }
    if (process.env.TELEGRAM_BOT_TOKEN) {
      this.channels.set("telegram", {
        enabled: true,
        botToken: process.env.TELEGRAM_BOT_TOKEN,
      })
    }
    if (process.env.SLACK_WEBHOOK_URL) {
      this.channels.set("slack", {
        enabled: true,
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
      })
    }
  }

  async configureChannel(channel: string, config: ChannelConfig): Promise<void> {
    this.channels.set(channel, config)
  }

  async sendMessage(channel: string, message: string): Promise<boolean> {
    const config = this.channels.get(channel)
    if (!config || !config.enabled) {
      throw new Error(`Channel ${channel} is not enabled`)
    }

    switch (channel) {
      case "telegram":
        return this.sendTelegram(config.botToken!, message)
      case "discord":
        return this.sendDiscord(config.webhookUrl!, message)
      case "slack":
        return this.sendSlack(config.webhookUrl!, message)
      default:
        throw new Error(`Unsupported channel: ${channel}`)
    }
  }

  private async sendTelegram(token: string, message: string): Promise<boolean> {
    // 簡化的 Telegram 發送邏輯
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (!chatId) throw new Error("TELEGRAM_CHAT_ID not set")

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    })
    return response.ok
  }

  private async sendDiscord(webhookUrl: string, message: string): Promise<boolean> {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    })
    return response.ok
  }

  private async sendSlack(webhookUrl: string, message: string): Promise<boolean> {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    })
    return response.ok
  }

  getEnabledChannels(): string[] {
    return Array.from(this.channels.entries())
      .filter(([_, config]) => config.enabled)
      .map(([name]) => name)
  }
}

export const channelManager = new MultiChannel()

// 從環境變數載入 Discord webhook
if (typeof process !== "undefined" && process.env?.DISCORD_WEBHOOK_URL) {
  channelManager.configureChannel("discord", {
    enabled: true,
    webhookUrl: process.env.DISCORD_WEBHOOK_URL,
  })
}
