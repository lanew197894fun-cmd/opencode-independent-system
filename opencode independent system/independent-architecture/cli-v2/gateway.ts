// 獨立架構 網關 - 消息路由樞紐

import { Log } from "../util/log"

export const log = Log.create({ service: "gateway" })

// ============================================
// 消息格式
// ============================================

export interface GatewayMessage {
  id: string
  channel: string
  source: string
  content: string
  timestamp: number
  metadata?: Record<string, any>
}

export interface GatewayResponse {
  success: boolean
  message: string
  data?: any
}

// ============================================
// 路由規則
// ============================================

export interface RouteRule {
  pattern: string | RegExp
  handler: (message: GatewayMessage) => Promise<GatewayResponse>
  priority?: number
}

// ============================================
// 網關
// ============================================

export class Gateway {
  private routes: RouteRule[] = []
  private channels: Map<
    string,
    {
      connected: boolean
      lastActivity: number
      handlers: Set<(msg: GatewayMessage) => void>
    }
  > = new Map()
  private messageHistory: GatewayMessage[] = []
  private maxHistory = 1000

  constructor() {
    log.info("Gateway initialized")
  }

  // ============================================
  // 頻道管理
  // ============================================

  registerChannel(channel: string): void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, {
        connected: false,
        lastActivity: 0,
        handlers: new Set(),
      })
      log.info(`Channel registered: ${channel}`)
    }
  }

  connectChannel(channel: string): boolean {
    const ch = this.channels.get(channel)
    if (ch) {
      ch.connected = true
      ch.lastActivity = Date.now()
      log.info(`Channel connected: ${channel}`)
      return true
    }
    return false
  }

  disconnectChannel(channel: string): boolean {
    const ch = this.channels.get(channel)
    if (ch) {
      ch.connected = false
      log.info(`Channel disconnected: ${channel}`)
      return true
    }
    return false
  }

  isChannelConnected(channel: string): boolean {
    return this.channels.get(channel)?.connected ?? false
  }

  getChannelStatus(): Record<string, { connected: boolean; lastActivity: number }> {
    const status: Record<string, { connected: boolean; lastActivity: number }> = {}
    for (const [name, ch] of this.channels) {
      status[name] = {
        connected: ch.connected,
        lastActivity: ch.lastActivity,
      }
    }
    return status
  }

  // ============================================
  // 路由
  // ============================================

  addRoute(
    pattern: string | RegExp,
    handler: (message: GatewayMessage) => Promise<GatewayResponse>,
    priority = 0,
  ): void {
    this.routes.push({ pattern, handler, priority })
    this.routes.sort((a, b) => (b.priority || 0) - (a.priority || 0))
    log.debug(`Route added: ${pattern}`)
  }

  removeRoute(pattern: string | RegExp): boolean {
    const index = this.routes.findIndex((r) => {
      if (typeof pattern === "string" && typeof r.pattern === "string") {
        return r.pattern === pattern
      }
      if (pattern instanceof RegExp && r.pattern instanceof RegExp) {
        return r.pattern.toString() === pattern.toString()
      }
      return false
    })

    if (index !== -1) {
      this.routes.splice(index, 1)
      return true
    }
    return false
  }

  async route(message: GatewayMessage): Promise<GatewayResponse> {
    // 記錄訊息
    this.messageHistory.push(message)
    if (this.messageHistory.length > this.maxHistory) {
      this.messageHistory.shift()
    }

    // 更新頻道活動
    const ch = this.channels.get(message.channel)
    if (ch) {
      ch.lastActivity = Date.now()
    }

    // 按優先順序匹配路由
    for (const route of this.routes) {
      const matched = this.matchRoute(route.pattern, message.content)
      if (matched) {
        try {
          const response = await route.handler(message)
          return response
        } catch (error: any) {
          log.error(`Route handler error: ${route.pattern}`, { error })
          return {
            success: false,
            message: `處理錯誤: ${error.message}`,
          }
        }
      }
    }

    // 無匹配
    return {
      success: false,
      message: "無匹配路由",
    }
  }

  private matchRoute(pattern: string | RegExp, content: string): boolean {
    if (typeof pattern === "string") {
      return content.includes(pattern)
    }
    return pattern.test(content)
  }

  // ============================================
  // 訊息監聽
  // ============================================

  onChannelMessage(channel: string, handler: (msg: GatewayMessage) => void): () => void {
    const ch = this.channels.get(channel)
    if (ch) {
      ch.handlers.add(handler)
      return () => ch.handlers.delete(handler)
    }
    return () => {}
  }

  async sendToChannel(channel: string, content: string, metadata?: Record<string, any>): Promise<boolean> {
    const ch = this.channels.get(channel)
    if (!ch || !ch.connected) {
      log.warn(`Cannot send to disconnected channel: ${channel}`)
      return false
    }

    const message: GatewayMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      channel,
      source: "gateway",
      content,
      timestamp: Date.now(),
      metadata,
    }

    // 通知監聽者
    for (const handler of ch.handlers) {
      try {
        handler(message)
      } catch (error) {
        log.error(`Channel handler error: ${channel}`, { error })
      }
    }

    return true
  }

  // ============================================
  // 歷史
  // ============================================

  getHistory(channel?: string, limit = 100): GatewayMessage[] {
    let history = this.messageHistory
    if (channel) {
      history = history.filter((m) => m.channel === channel)
    }
    return history.slice(-limit)
  }

  clearHistory(channel?: string): void {
    if (channel) {
      this.messageHistory = this.messageHistory.filter((m) => m.channel !== channel)
    } else {
      this.messageHistory = []
    }
  }

  // ============================================
  // 狀態
  // ============================================

  getStatus(): {
    channels: number
    connectedChannels: number
    routes: number
    messagesInHistory: number
  } {
    let connected = 0
    for (const ch of this.channels.values()) {
      if (ch.connected) connected++
    }

    return {
      channels: this.channels.size,
      connectedChannels: connected,
      routes: this.routes.length,
      messagesInHistory: this.messageHistory.length,
    }
  }
}

// ============================================
// 單例
// ============================================

let gatewayInstance: Gateway | null = null

export function getGateway(): Gateway {
  if (!gatewayInstance) {
    gatewayInstance = new Gateway()
  }
  return gatewayInstance
}

export function resetGateway(): void {
  gatewayInstance = null
}
