/**
 * OpenCode + OpenClaw 整合模組
 * 讓 OpenCode 可以使用 OpenClaw 的渠道功能
 */

import { spawn } from "child_process"
import { Log } from "./util/log"

const log = Log.create({ service: "openclaw-integration" })

export interface OpenClawConfig {
  executable: string
  host: string
  port: number
}

export class OpenClawIntegration {
  private config: OpenClawConfig

  constructor(config?: Partial<OpenClawConfig>) {
    this.config = {
      executable: "openclaw",
      host: "localhost",
      port: 8090,
      ...config,
    }
  }

  async sendDiscordMessage(message: string): Promise<boolean> {
    try {
      const result = await this.runCommand(["message", "send", "--channel", "discord", "--message", message])
      return result.success
    } catch (error: unknown) {
      log.error("Failed to send Discord message via OpenClaw", { error })
      return false
    }
  }

  async sendTelegramMessage(chatId: string, message: string): Promise<boolean> {
    try {
      const result = await this.runCommand([
        "message",
        "send",
        "--channel",
        "telegram",
        "--target",
        chatId,
        "--message",
        message,
      ])
      return result.success
    } catch (error: unknown) {
      log.error("Failed to send Telegram message via OpenClaw", { error })
      return false
    }
  }

  async sendMessage(channel: string, message: string, target?: string): Promise<boolean> {
    const args = ["message", "send", "--channel", channel, "--message", message]
    if (target) {
      args.push("--target", target)
    }

    try {
      const result = await this.runCommand(args)
      return result.success
    } catch (error: unknown) {
      log.error(`Failed to send message to ${channel}`, { error })
      return false
    }
  }

  async getStatus(): Promise<{ connected: boolean; channels: string[] }> {
    try {
      const result = await this.runCommand(["status"])
      return {
        connected: result.success,
        channels: result.stdout?.includes("discord") ? ["discord", "telegram"] : [],
      }
    } catch {
      return { connected: false, channels: [] }
    }
  }

  private runCommand(args: string[]): Promise<{ success: boolean; stdout?: string; stderr?: string }> {
    return new Promise((resolve) => {
      const proc = spawn(this.config.executable, args, {
        stdio: ["pipe", "pipe", "pipe"],
      })

      let stdout = ""
      let stderr = ""

      proc.stdout?.on("data", (data) => {
        stdout += data.toString()
      })

      proc.stderr?.on("data", (data) => {
        stderr += data.toString()
      })

      proc.on("close", (code) => {
        resolve({
          success: code === 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        })
      })

      proc.on("error", () => {
        resolve({ success: false, stderr: "Process error" })
      })
    })
  }
}

// 預設實例
export const openclaw = new OpenClawIntegration()
