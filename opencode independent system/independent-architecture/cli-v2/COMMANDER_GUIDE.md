# 獨立架構 指揮官 - 服務管理系統

## 概述

指揮官是獨立架構的核心服務管理系統，類似遊戲伺服器的管理面板，可透過 CLI 或 Web 介面管理所有服務。

---

## 架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                    獨立架構 指揮官                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              統一服務管理器                          │   │
│  │   • 服務注册   • 健康檢查   • 自動重啟   • 事件系統  │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                               │
│          ┌────────────────┼────────────────┐             │
│          │                │                │             │
│          ▼                ▼                ▼             │
│   ┌───────────┐    ┌───────────┐    ┌───────────┐      │
│   │   CLI     │    │   Web     │    │   REST    │      │
│   │  終端     │    │  瀏覽器   │    │   API     │      │
│   └───────────┘    └───────────┘    └───────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
   ┌───────────┐        ┌───────────┐        ┌───────────┐
   │  OpenCode │        │  OpenClaw │        │   Ollama  │
   │  服務     │        │   服務    │        │   服務    │
   └───────────┘        └───────────┘        └───────────┘
```

---

## CLI 指令

### 服務管理

```bash
# 啟動/停止/重啟
commander start <name>       # 啟動單一服務
commander stop <name>       # 停止單一服務
commander restart <name>    # 重啟單一服務

commander start all         # 啟動所有服務
commander stop all          # 停止所有服務
commander restart all       # 重啟所有服務
```

### 狀態查詢

```bash
commander status            # 狀態總覽
commander list              # 服務列表
commander health            # 健康檢查
commander health <name>     # 單一服務健康檢查
commander info <name>       # 服務詳情
```

### 日誌與事件

```bash
commander logs <name>       # 查看日誌
commander events            # 最近事件
commander events -w         # 監控事件
```

### 服務管理

```bash
commander register          # 註冊新服務
commander unregister <name>  # 移除服務
```

### Web 介面

```bash
commander web start         # 啟動 Web 介面
commander web stop          # 停止 Web 介面
commander web status        # 查看狀態
```

### 幫助

```bash
commander help              # 查看幫助
```

---

## Web 介面

啟動後訪問 `http://localhost:3001`

### 功能

| 功能     | 說明                     |
| -------- | ------------------------ |
| 狀態總覽 | 所有服務統計一目了然     |
| 服務卡片 | 每個服務獨立的操作卡片   |
| 批量操作 | 一鍵啟動/停止/重啟全部   |
| 日誌查看 | 即時查看服務輸出         |
| 安全面板 | VPN、RDP、24小時防禦狀態 |
| 事件日誌 | 最近系統事件             |

### 截圖描述

```
┌─────────────────────────────────────────────────────────┐
│ 🎖️ 獨立架構 指揮官                              [統計] │
├─────────────────────────────────────────────────────────┤
│ [▶ 啟動全部] [■ 停止全部] [↻ 重啟全部] [💚 健康檢查]    │
├─────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│ │ ● OpenCode  │ │ ● OpenClaw  │ │ ○ Ollama    │     │
│ │  🟢 運行中   │ │  🟢 運行中   │ │  ⚪ 已停止   │     │
│ │ PID: 12345  │ │ PID: 12346  │ │             │     │
│ │ [■][↻][📝]  │ │ [■][↻][📝]  │ │ [▶][📝]     │     │
│ └──────────────┘ └──────────────┘ └──────────────┘     │
├─────────────────────────────────────────────────────────┤
│ 🛡️ 安全中心                                              │
│ 🔒 VPN 連線: 已連接  🖥️ RDP 防護: 已啟用              │
│ ⏰ 24小時防禦: 監控中  🔌 插件系統: 正常                │
├─────────────────────────────────────────────────────────┤
│ 📋 最近事件                                              │
│ 🟢 10:30 System: OpenCode 已啟動                        │
│ ⚪ 10:25 System: Ollama 已停止                           │
└─────────────────────────────────────────────────────────┘
```

---

## REST API

### 端點

| 方法 | 路徑                         | 說明         |
| ---- | ---------------------------- | ------------ |
| GET  | `/api/services`              | 所有服務列表 |
| GET  | `/api/services/status`       | 狀態統計     |
| GET  | `/api/service/:name`         | 單一服務詳情 |
| POST | `/api/service/:name/start`   | 啟動服務     |
| POST | `/api/service/:name/stop`    | 停止服務     |
| POST | `/api/service/:name/restart` | 重啟服務     |
| GET  | `/api/service/:name/health`  | 健康檢查     |
| GET  | `/api/service/:name/logs`    | 獲取日誌     |
| POST | `/api/start-all`             | 啟動全部     |
| POST | `/api/stop-all`              | 停止全部     |
| POST | `/api/restart-all`           | 重啟全部     |
| GET  | `/api/events`                | 事件列表     |
| GET  | `/api/security/status`       | 安全狀態     |
| GET  | `/health`                    | 健康檢查     |

### 使用範例

```bash
# 獲取所有服務
curl http://localhost:3001/api/services

# 啟動 OpenCode
curl -X POST http://localhost:3001/api/service/opencode/start

# 查看日誌
curl http://localhost:3001/api/service/opencode/logs?lines=100
```

---

## 預設服務

| 服務     | 描述             | 端口  |
| -------- | ---------------- | ----- |
| opencode | OpenCode AI 服務 | 3000  |
| openclaw | OpenClaw 系統    | 8080  |
| ollama   | Ollama 本地模型  | 11434 |

---

## 配置

服務配置保存在：

```
~/.independent-architecture/commander/
├── services/           # 服務定義
├── logs/             # 日誌檔案
│   ├── opencode.log
│   ├── openclaw.log
│   └── ollama.log
└── pids/            # PID 檔案
```

---

## 自動化功能

### 自動重啟

- 服務崩潰後自動重啟
- 最多嘗試 3 次
- 重啟冷卻時間 5 秒

### 健康檢查

- 每 30 秒檢查一次
- HTTP 健康檢查端點
- 失敗後自動重啟

### 依賴管理

- 自動啟動依賴服務
- 例如：OpenClaw 依賴 OpenCode

---

## 擴展功能

### 註冊新服務

```typescript
commander.registerService({
  name: "my-service",
  description: "我的服務",
  command: "node",
  args: ["server.js"],
  port: 3000,
  healthCheck: "http://localhost:3000/health",
  autoRestart: true,
  dependsOn: ["opencode"],
})
```

### 事件監聽

```typescript
commander.onEvent((event) => {
  console.log("事件:", event.type, event.message)
})
```

---

## 疑難排解

### 服務無法啟動

1. 檢查端口是否被佔用

   ```bash
   lsof -i :3000
   ```

2. 檢查日誌

   ```bash
   commander logs opencode
   ```

3. 檢查依賴服務
   ```bash
   commander status
   ```

### Web 介面無法訪問

1. 檢查是否已啟動

   ```bash
   commander web status
   ```

2. 檢查端口
   ```bash
   curl http://localhost:3001/health
   ```

### 自動重啟無效

檢查配置：

```bash
# 確認自動重啟已啟用
# 檢查重啟次數限制
```

---

## 與遊戲伺服器對比

| 功能     | 遊戲伺服器 | 獨立架構指揮官 |
| -------- | ---------- | -------------- |
| CLI 管理 | PowerShell | TypeScript CLI |
| Web 介面 | WebRDP     | 原生 Web UI    |
| 服務管理 | 手動腳本   | 統一管理器     |
| 健康檢查 | 外部腳本   | 內建 HTTP      |
| 自動重啟 | 外部監控   | 內建自動       |
| 日誌收集 | 手動查看   | 統一日誌       |
| 安全防護 | 分離模組   | 統一安全守衛   |
| 插件系統 | 無         | 原生支援       |

---

## 發展規劃

- [x] CLI 管理
- [x] Web 介面
- [x] REST API
- [ ] 插件熱插拔
- [ ] WebSocket 即時更新
- [ ] 移動端適配
- [ ] 集群管理
- [ ] 主腦/副腦架構
