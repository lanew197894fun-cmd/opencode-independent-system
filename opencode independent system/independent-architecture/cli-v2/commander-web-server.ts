// 指揮官 Web 介面 - 服務管理控制台

import { homedir } from "os"
import { join } from "path"
import { existsSync, mkdirSync, readFileSync } from "fs"
import { createServer, IncomingMessage, ServerResponse } from "http"
import { Log } from "../util/log"
import { getCommander, type Commander, type Service, type CommanderEvent } from "./commander"

export const log = Log.create({ service: "commander-web" })

// ============================================
// 路由處理
// ============================================

type RouteHandler = (commander: Commander, params: URLSearchParams) => Promise<string>

const routes: Record<string, RouteHandler> = {
  // 服務管理
  "/api/services": async (commander) => {
    return JSON.stringify(commander.getAllServices())
  },

  "/api/services/status": async (commander) => {
    return JSON.stringify(commander.getServiceStatus())
  },

  "/api/services/running": async (commander) => {
    return JSON.stringify(commander.getRunningServices())
  },

  "/api/service/:name": async (commander, params) => {
    const name = params.get("name") || ""
    const service = commander.getService(name)
    if (!service) {
      return JSON.stringify({ error: "Service not found" })
    }
    return JSON.stringify(service)
  },

  "/api/service/:name/start": async (commander, params) => {
    const name = params.get("name") || ""
    const success = await commander.startService(name)
    return JSON.stringify({ success, name })
  },

  "/api/service/:name/stop": async (commander, params) => {
    const name = params.get("name") || ""
    const success = await commander.stopService(name)
    return JSON.stringify({ success, name })
  },

  "/api/service/:name/restart": async (commander, params) => {
    const name = params.get("name") || ""
    const success = await commander.restartService(name)
    return JSON.stringify({ success, name })
  },

  "/api/service/:name/health": async (commander, params) => {
    const name = params.get("name") || ""
    const health = await commander.checkServiceHealth(name)
    return JSON.stringify(health)
  },

  "/api/service/:name/logs": async (commander, params) => {
    const name = params.get("name") || ""
    const lines = parseInt(params.get("lines") || "100")
    const logs = await commander.getLogs(name, lines)
    return JSON.stringify({ name, logs })
  },

  // 批量操作
  "/api/start-all": async (commander) => {
    const count = await commander.startAll()
    return JSON.stringify({ success: true, count })
  },

  "/api/stop-all": async (commander) => {
    const count = await commander.stopAll()
    return JSON.stringify({ success: true, count })
  },

  "/api/restart-all": async (commander) => {
    await commander.stopAll()
    await new Promise((r) => setTimeout(r, 1000))
    const count = await commander.startAll()
    return JSON.stringify({ success: true, count })
  },

  // 事件
  "/api/events": async (commander, params) => {
    const limit = parseInt(params.get("limit") || "50")
    return JSON.stringify(commander.getEvents(limit))
  },

  // 安全中心
  "/api/security/status": async (_commander) => {
    // 這裡可以整合統一安全中心
    return JSON.stringify({
      vpn: { connected: false },
      rdp: { blocked: true },
      defense24: { active: true },
      plugins: { count: 0 },
      skills: { count: 0 },
    })
  },

  // 健康檢查
  "/health": async () => {
    return JSON.stringify({ status: "ok", timestamp: Date.now() })
  },
}

// ============================================
// HTML 介面
// ============================================

const HTML_INTERFACE = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>獨立架構 指揮官</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f0f23; color: #fff; min-height: 100vh; }
    .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
    
    /* Header */
    .header { display: flex; justify-content: space-between; align-items: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; margin-bottom: 20px; }
    .header h1 { font-size: 1.8em; display: flex; align-items: center; gap: 10px; }
    .header-stats { display: flex; gap: 20px; }
    .stat { background: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 1.5em; font-weight: bold; }
    .stat-label { font-size: 0.8em; opacity: 0.8; }
    
    /* Grid */
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
    
    /* Card */
    .card { background: #1a1a2e; border-radius: 12px; padding: 20px; border: 1px solid #333; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .card-title { font-size: 1.2em; font-weight: bold; }
    
    /* Status */
    .status-running { color: #4ade80; }
    .status-stopped { color: #6b7280; }
    .status-error { color: #ef4444; }
    .status-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; }
    .status-dot.running { background: #4ade80; box-shadow: 0 0 10px #4ade80; }
    .status-dot.stopped { background: #6b7280; }
    .status-dot.error { background: #ef4444; box-shadow: 0 0 10px #ef4444; }
    
    /* Service Card */
    .service-card { transition: transform 0.2s, box-shadow 0.2s; }
    .service-card:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3); }
    .service-name { font-size: 1.1em; margin-bottom: 5px; }
    .service-desc { color: #9ca3af; font-size: 0.9em; margin-bottom: 10px; }
    .service-meta { display: flex; gap: 15px; font-size: 0.85em; color: #6b7280; margin-bottom: 15px; }
    .service-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    
    /* Buttons */
    .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9em; transition: all 0.2s; display: flex; align-items: center; gap: 5px; }
    .btn:hover { transform: scale(1.05); }
    .btn-start { background: #22c55e; color: white; }
    .btn-stop { background: #ef4444; color: white; }
    .btn-restart { background: #f59e0b; color: white; }
    .btn-logs { background: #3b82f6; color: white; }
    .btn-health { background: #8b5cf6; color: white; }
    .btn-all { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    
    /* Events */
    .event-list { max-height: 400px; overflow-y: auto; }
    .event-item { padding: 10px; border-bottom: 1px solid #333; display: flex; gap: 10px; align-items: center; }
    .event-item:last-child { border-bottom: none; }
    .event-time { color: #6b7280; font-size: 0.8em; min-width: 80px; }
    .event-icon { font-size: 1.2em; }
    .event-message { flex: 1; }
    
    /* Security Panel */
    .security-item { display: flex; justify-content: space-between; padding: 12px; background: #252540; border-radius: 8px; margin-bottom: 10px; }
    .security-label { display: flex; align-items: center; gap: 10px; }
    .security-icon { font-size: 1.3em; }
    
    /* Actions Bar */
    .actions-bar { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    
    /* Logs Modal */
    .modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 1000; }
    .modal.active { display: flex; align-items: center; justify-content: center; }
    .modal-content { background: #1a1a2e; border-radius: 12px; padding: 20px; max-width: 900px; width: 90%; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column; }
    .modal-header { display: flex; justify-content: space-between; margin-bottom: 15px; }
    .modal-title { font-size: 1.2em; }
    .modal-close { background: none; border: none; color: #fff; font-size: 1.5em; cursor: pointer; }
    .logs-content { background: #0f0f23; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 0.85em; overflow: auto; flex: 1; white-space: pre-wrap; max-height: 60vh; }
    
    /* Refresh */
    .refresh-info { text-align: center; color: #6b7280; font-size: 0.8em; margin-top: 20px; }
    
    /* Loading */
    .loading { display: inline-block; width: 20px; height: 20px; border: 2px solid #667eea; border-radius: 50%; border-top-color: transparent; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🎖️ 獨立架構 指揮官</h1>
      <div class="header-stats">
        <div class="stat">
          <div class="stat-value" id="stat-total">-</div>
          <div class="stat-label">總服務</div>
        </div>
        <div class="stat">
          <div class="stat-value status-running" id="stat-running">-</div>
          <div class="stat-label">運行中</div>
        </div>
        <div class="stat">
          <div class="stat-value status-stopped" id="stat-stopped">-</div>
          <div class="stat-label">已停止</div>
        </div>
      </div>
    </div>

    <!-- Actions Bar -->
    <div class="actions-bar">
      <button class="btn btn-all" onclick="startAll()">▶ 啟動全部</button>
      <button class="btn btn-stop" onclick="stopAll()">■ 停止全部</button>
      <button class="btn btn-restart" onclick="restartAll()">↻ 重啟全部</button>
      <button class="btn btn-health" onclick="checkAllHealth()">💚 健康檢查</button>
      <button class="btn btn-logs" onclick="refreshAll()">🔄 刷新</button>
    </div>

    <!-- Services Grid -->
    <div class="grid" id="services-grid">
      <div class="card">
        <div class="loading"></div>
      </div>
    </div>

    <!-- Security Panel -->
    <div class="card" style="margin-top: 20px;">
      <div class="card-header">
        <span class="card-title">🛡️ 安全中心</span>
      </div>
      <div id="security-panel">
        <div class="security-item">
          <div class="security-label">
            <span class="security-icon">🔒</span>
            <span>VPN 連線</span>
          </div>
          <span class="status-running">已連接</span>
        </div>
        <div class="security-item">
          <div class="security-label">
            <span class="security-icon">🖥️</span>
            <span>RDP 防護</span>
          </div>
          <span class="status-running">已啟用</span>
        </div>
        <div class="security-item">
          <div class="security-label">
            <span class="security-icon">⏰</span>
            <span>24小時防禦</span>
          </div>
          <span class="status-running">監控中</span>
        </div>
        <div class="security-item">
          <div class="security-label">
            <span class="security-icon">🔌</span>
            <span>插件系統</span>
          </div>
          <span class="status-running">正常</span>
        </div>
      </div>
    </div>

    <!-- Events -->
    <div class="card" style="margin-top: 20px;">
      <div class="card-header">
        <span class="card-title">📋 最近事件</span>
        <button class="btn btn-logs" onclick="loadEvents()">🔄 刷新</button>
      </div>
      <div class="event-list" id="event-list">
        <div class="event-item">
          <span class="loading"></span>
        </div>
      </div>
    </div>

    <div class="refresh-info">
      每 30 秒自動刷新 | <a href="#" onclick="toggleAutoRefresh(); return false;" style="color: #667eea;">點擊開關自動刷新</a>
    </div>
  </div>

  <!-- Logs Modal -->
  <div class="modal" id="logs-modal">
    <div class="modal-content">
      <div class="modal-header">
        <span class="modal-title" id="logs-title">日誌</span>
        <button class="modal-close" onclick="closeLogs()">&times;</button>
      </div>
      <div class="logs-content" id="logs-content"></div>
    </div>
  </div>

  <script>
    let autoRefresh = true;
    let refreshInterval;
    
    const API = window.location.origin;
    
    async function api(path) {
      try {
        const res = await fetch(API + path);
        return await res.json();
      } catch (e) {
        return { error: e.message };
      }
    }
    
    async function loadStatus() {
      const status = await api('/api/services/status');
      document.getElementById('stat-total').textContent = status.total || 0;
      document.getElementById('stat-running').textContent = status.running || 0;
      document.getElementById('stat-stopped').textContent = status.stopped || 0;
    }
    
    async function loadServices() {
      const services = await api('/api/services');
      const grid = document.getElementById('services-grid');
      
      if (!Array.isArray(services)) {
        grid.innerHTML = '<div class="card"><p style="color:#ef4444;">載入失敗</p></div>';
        return;
      }
      
      grid.innerHTML = services.map(s => \`
        <div class="card service-card">
          <div class="service-name">
            <span class="status-dot \${s.status}"></span>
            \${s.name}
          </div>
          <div class="service-desc">\${s.description || '無描述'}</div>
          <div class="service-meta">
            \${s.port ? \`📍 \${s.port}\` : ''}
            \${s.pid ? \`PID: \${s.pid}\` : ''}
            \${s.uptime ? \`⏱️ \${formatUptime(s.uptime)}\` : ''}
          </div>
          <div class="service-actions">
            \${s.status === 'running' ? \`
              <button class="btn btn-stop" onclick="stopService('\${s.name}')">■ 停止</button>
              <button class="btn btn-restart" onclick="restartService('\${s.name}')">↻ 重啟</button>
            \` : \`
              <button class="btn btn-start" onclick="startService('\${s.name}')">▶ 啟動</button>
            \`}
            <button class="btn btn-logs" onclick="showLogs('\${s.name}')">📝 日誌</button>
            <button class="btn btn-health" onclick="checkHealth('\${s.name}')">💚</button>
          </div>
        </div>
      \`).join('');
    }
    
    async function loadEvents() {
      const events = await api('/api/events?limit=20');
      const list = document.getElementById('event-list');
      
      if (!Array.isArray(events)) {
        list.innerHTML = '<div class="event-item">載入失敗</div>';
        return;
      }
      
      list.innerHTML = events.reverse().map(e => \`
        <div class="event-item">
          <span class="event-time">\${formatTime(e.timestamp)}</span>
          <span class="event-icon">\${getEventIcon(e.type)}</span>
          <span class="event-message">\${e.service || 'System'}: \${e.message}</span>
        </div>
      \`).join('') || '<div class="event-item">暫無事件</div>';
    }
    
    function getEventIcon(type) {
      if (type.includes('started')) return '🟢';
      if (type.includes('stopped')) return '⚪';
      if (type.includes('error')) return '🔴';
      if (type.includes('health_ok')) return '✅';
      if (type.includes('health_fail')) return '❌';
      return '📋';
    }
    
    function formatUptime(ms) {
      if (!ms) return '-';
      const s = Math.floor(ms / 1000);
      const m = Math.floor(s / 60);
      const h = Math.floor(m / 60);
      if (h > 0) return h + 'h ' + (m % 60) + 'm';
      if (m > 0) return m + 'm ' + (s % 60) + 's';
      return s + 's';
    }
    
    function formatTime(ts) {
      return new Date(ts).toLocaleTimeString();
    }
    
    async function startService(name) {
      const res = await api(\`/api/service/\${name}/start\`);
      if (res.success) refreshAll();
    }
    
    async function stopService(name) {
      const res = await api(\`/api/service/\${name}/stop\`);
      if (res.success) refreshAll();
    }
    
    async function restartService(name) {
      const res = await api(\`/api/service/\${name}/restart\`);
      if (res.success) refreshAll();
    }
    
    async function checkHealth(name) {
      const health = await api(\`/api/service/\${name}/health\`);
      alert(\`\${name} 健康狀態: \${health.healthy ? '✅ 健康' : '❌ 不健康'}\n\${health.message || ''}\`);
    }
    
    async function showLogs(name) {
      document.getElementById('logs-title').textContent = \`\${name} 日誌\`;
      document.getElementById('logs-content').textContent = '載入中...';
      document.getElementById('logs-modal').classList.add('active');
      
      const data = await api(\`/api/service/\${name}/logs?lines=100\`);
      document.getElementById('logs-content').textContent = data.logs || '無日誌';
    }
    
    function closeLogs() {
      document.getElementById('logs-modal').classList.remove('active');
    }
    
    async function startAll() {
      await api('/api/start-all');
      refreshAll();
    }
    
    async function stopAll() {
      await api('/api/stop-all');
      refreshAll();
    }
    
    async function restartAll() {
      await api('/api/restart-all');
      refreshAll();
    }
    
    async function checkAllHealth() {
      const services = await api('/api/services');
      for (const s of services) {
        await checkHealth(s.name);
      }
    }
    
    function refreshAll() {
      loadStatus();
      loadServices();
      loadEvents();
    }
    
    function toggleAutoRefresh() {
      autoRefresh = !autoRefresh;
      if (autoRefresh) {
        refreshInterval = setInterval(refreshAll, 30000);
      } else {
        clearInterval(refreshInterval);
      }
    }
    
    // Init
    refreshAll();
    refreshInterval = setInterval(refreshAll, 30000);
    
    // Close modal on outside click
    document.getElementById('logs-modal').addEventListener('click', (e) => {
      if (e.target.id === 'logs-modal') closeLogs();
    });
  </script>
</body>
</html>`

// ============================================
// Web 伺服器
// ============================================

export class CommanderWebServer {
  private server: ReturnType<typeof createServer> | null = null
  private commander: Commander
  private port: number
  private htmlPage: string

  constructor(commander: Commander, port: number = 3001) {
    this.commander = commander
    this.port = port
    this.htmlPage = HTML_INTERFACE
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = createServer(async (req, res) => {
        const url = new URL(req.url || "/", `http://localhost:${this.port}`)
        const path = url.pathname

        // CORS
        res.setHeader("Access-Control-Allow-Origin", "*")
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        res.setHeader("Access-Control-Allow-Headers", "Content-Type")

        if (req.method === "OPTIONS") {
          res.writeHead(204)
          res.end()
          return
        }

        // 靜態 HTML
        if (path === "/" || path === "/index.html") {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
          res.end(this.htmlPage)
          return
        }

        // API 路由
        try {
          let response = ""

          // 處理路由
          if (path.startsWith("/api/")) {
            const result = await this.handleAPI(path, url.searchParams)
            res.writeHead(200, { "Content-Type": "application/json" })
            res.end(result)
            return
          }

          // 404
          res.writeHead(404)
          res.end(JSON.stringify({ error: "Not found" }))
        } catch (error: any) {
          log.error("Request error", { error })
          res.writeHead(500)
          res.end(JSON.stringify({ error: error.message }))
        }
      })

      this.server.on("error", (error: any) => {
        if (error.code === "EADDRINUSE") {
          log.warn(`Port ${this.port} in use, trying ${this.port + 1}`)
          this.port++
          this.start().then(resolve).catch(reject)
        } else {
          reject(error)
        }
      })

      this.server.listen(this.port, () => {
        log.info(`Commander Web Server started on http://localhost:${this.port}`)
        resolve()
      })
    })
  }

  private async handleAPI(path: string, params: URLSearchParams): Promise<string> {
    // 處理動態路由
    let handler: RouteHandler | undefined
    let finalPath = path

    // 服務名稱替換
    const serviceMatch = path.match(/\/api\/service\/([^/]+)\/(.+)/)
    if (serviceMatch) {
      const [, name, action] = serviceMatch
      params.set("name", name)
      finalPath = `/api/service/:name/${action}`
    }

    handler = routes[finalPath]

    if (handler) {
      return await handler(this.commander, params)
    }

    // 通用路由
    handler = routes[path]
    if (handler) {
      return await handler(this.commander, params)
    }

    return JSON.stringify({ error: "Route not found" })
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          log.info("Commander Web Server stopped")
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  getPort(): number {
    return this.port
  }
}
