import { tool, type ToolContext } from "@opencode-ai/plugin"
import z from "zod"

interface ChannelConfig {
  enabled: boolean
  token?: string
  chat_id?: string
  webhook_url?: string
  encrypted?: boolean
}

const CONFIG_PATH = ".opencode/config/channels.json"

function getEncryptionKey(worktree: string): string {
  const pathHash = worktree.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
  return `oc_${Math.abs(pathHash).toString(16)}_key`
}

function encrypt(text: string, key: string): string {
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

function decrypt(encrypted: string, key: string): string {
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

async function loadChannels(worktree: string): Promise<Record<string, ChannelConfig>> {
  const path = `${worktree}/${CONFIG_PATH}`
  if (!(await Bun.file(path).exists())) return {}

  const raw = await Bun.file(path).text()
  const data = JSON.parse(raw)

  const key = getEncryptionKey(worktree)
  for (const [name, config] of Object.entries(data)) {
    const cfg = config as ChannelConfig
    if (cfg.token && cfg.encrypted) {
      cfg.token = decrypt(cfg.token, key)
      cfg.encrypted = false
    }
  }

  return data
}

async function saveChannels(worktree: string, channels: Record<string, ChannelConfig>): Promise<void> {
  const path = `${worktree}/${CONFIG_PATH}`
  await Bun.$`mkdir -p ${worktree}/.opencode/config`.text()

  const key = getEncryptionKey(worktree)
  const toSave: Record<string, ChannelConfig> = {}

  for (const [name, config] of Object.entries(channels)) {
    toSave[name] = {
      ...config,
      token: config.token ? encrypt(config.token, key) : undefined,
      encrypted: !!config.token,
    }
  }

  await Bun.write(path, JSON.stringify(toSave, null, 2))
}

const telegramSetup = tool({
  description: "設定 Telegram 機器人 (權杖會加密儲存)",
  args: {
    token: z.string().describe("機器人權杖 (向 @BotFather 取得)"),
    chat_id: z.string().optional().describe("聊天 ID (預設廣播模式)"),
  },
  async execute({ token, chat_id }, ctx: ToolContext) {
    const channels = await loadChannels(ctx.worktree)

    channels.telegram = {
      enabled: true,
      token,
      chat_id,
    }

    await saveChannels(ctx.worktree, channels)

    return `## ✅ Telegram 機器人已設定
- 權杖: ${token.slice(0, 10)}...${token.slice(-5)}
- 聊天 ID: ${chat_id ?? "廣播模式"}

**下一步：**
1. 將機器人加入群組
2. 傳送 /start 給機器人啟用`
  },
})

const telegramStatus = tool({
  description: "檢查 Telegram 機器人狀態",
  args: {},
  async execute({}, ctx: ToolContext) {
    const channels = await loadChannels(ctx.worktree)
    const telegram = channels.telegram

    if (!telegram) return "✗ Telegram 未設定"
    if (!telegram.enabled) return "✗ Telegram 已停用"
    if (!telegram.token) return "✗ 缺少權杖"

    return `## 📱 Telegram 狀態
- 狀態: ✓ 已設定
- 權杖: ${telegram.token.slice(0, 10)}...${telegram.token.slice(-5)}
- 聊天 ID: ${telegram.chat_id ?? "未設定 (廣播模式)"}`
  },
})

const discordSetup = tool({
  description: "設定 Discord 機器人",
  args: {
    token: z.string().describe("機器人權杖"),
    channel_id: z.string().optional().describe("頻道 ID"),
  },
  async execute({ token, channel_id }, ctx: ToolContext) {
    const channels = await loadChannels(ctx.worktree)

    channels.discord = {
      enabled: true,
      token,
      chat_id: channel_id,
    }

    await saveChannels(ctx.worktree, channels)

    return `## ✅ Discord 機器人已設定
- 權杖: ${token.slice(0, 10)}...${token.slice(-5)}
- 頻道 ID: ${channel_id ?? "未設定"}

**下一步：**
1. 在 Discord 開發者入口網新增機器人
2. 邀請到伺服器
3. 設定 intents 權限`
  },
})

const discordStatus = tool({
  description: "檢查 Discord 機器人狀態",
  args: {},
  async execute({}, ctx: ToolContext) {
    const channels = await loadChannels(ctx.worktree)
    const discord = channels.discord

    if (!discord) return "✗ Discord 未設定"
    if (!discord.enabled) return "✗ Discord 已停用"

    return `## 💬 Discord 狀態
- 狀態: ✓ 已設定
- 權杖: ${discord.token?.slice(0, 10)}...${discord.token?.slice(-5)}
- 頻道 ID: ${discord.chat_id ?? "未設定"}`
  },
})

const lineSetup = tool({
  description: "設定 LINE 機器人",
  args: {
    channel_access_token: z.string().describe("Channel Access Token"),
    channel_secret: z.string().describe("Channel Secret"),
  },
  async execute({ channel_access_token, channel_secret }, ctx: ToolContext) {
    const channels = await loadChannels(ctx.worktree)

    channels.line = {
      enabled: true,
      token: channel_access_token,
      webhook_url: channel_secret,
    }

    await saveChannels(ctx.worktree, channels)

    return `## ✅ LINE 機器人已設定
- Access Token: ${channel_access_token.slice(0, 10)}...${channel_access_token.slice(-5)}
- Secret: ${channel_secret.slice(0, 5)}...${channel_secret.slice(-3)}

**下一步：**
1. 在 LINE 開發者控制台設定 Webhook URL
2. 啟用 Messaging API`
  },
})

const lineStatus = tool({
  description: "檢查 LINE 機器人狀態",
  args: {},
  async execute({}, ctx: ToolContext) {
    const channels = await loadChannels(ctx.worktree)
    const line = channels.line

    if (!line) return "✗ LINE 未設定"
    if (!line.enabled) return "✗ LINE 已停用"

    return `## 💚 LINE 狀態
- 狀態: ✓ 已設定
- Token: ${line.token?.slice(0, 10)}...`
  },
})

const channelsList = tool({
  description: "列表所有已設定的通訊渠道",
  args: {},
  async execute({}, ctx: ToolContext) {
    const channels = await loadChannels(ctx.worktree)

    if (Object.keys(channels).length === 0) return "尚無通訊渠道設定"

    const results = ["## 📡 通訊渠道"]

    for (const [name, config] of Object.entries(channels)) {
      const status = config.enabled ? "✓ 啟用" : "✗ 停用"
      results.push(`- ${name}: ${status}`)
    }

    return results.join("\n")
  },
})

const channelDisable = tool({
  description: "停用通訊渠道",
  args: {
    channel: z.enum(["telegram", "discord", "line"]).describe("要停用的渠道"),
  },
  async execute({ channel }, ctx: ToolContext) {
    const channels = await loadChannels(ctx.worktree)

    if (!channels[channel]) return `${channel} 未設定`

    channels[channel].enabled = false
    await saveChannels(ctx.worktree, channels)

    return `${channel} 已停用`
  },
})

const testMessage = tool({
  description: "測試訊息發送",
  args: {
    channel: z.enum(["telegram", "discord", "line"]).describe("測試的渠道"),
    message: z.string().optional().describe("測試訊息 (預設: Hello from OpenCode)"),
  },
  async execute({ channel, message }, ctx: ToolContext) {
    const channels = await loadChannels(ctx.worktree)
    const config = channels[channel]

    if (!config) return `${channel} 未設定`
    if (!config.enabled) return `${channel} 已停用`
    if (!config.token) return `${channel} 缺少 Token`

    const text = message ?? "Hello from OpenCode 🦞"

    if (channel === "telegram") {
      try {
        const resp = await fetch(`https://api.telegram.org/bot${config.token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: config.chat_id ?? "me",
            text,
          }),
        })
        if (resp.ok) return `✓ Telegram 測試成功`
        return `✗ Telegram 測試失敗: ${resp.status}`
      } catch (e) {
        return `✗ 發送失敗: ${e}`
      }
    }

    return `尚不支援 ${channel} 的即時測試`
  },
})

export const channelPlugin = async (input: any) => ({
  tool: {
    channel_telegram_setup: telegramSetup,
    channel_telegram_status: telegramStatus,
    channel_discord_setup: discordSetup,
    channel_discord_status: discordStatus,
    channel_line_setup: lineSetup,
    channel_line_status: lineStatus,
    channel_list: channelsList,
    channel_disable: channelDisable,
    channel_test: testMessage,
  },
})
