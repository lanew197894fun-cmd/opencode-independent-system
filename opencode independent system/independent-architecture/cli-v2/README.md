# 獨立架構 CLI v2

**完全自主研發的私有化 AI 控制中心**

---

## 架構總覽

```
┌─────────────────────────────────────────────────────────────────┐
│                     獨立架構 (Independent Architecture)            │
│                        100% 自主研發                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐     │
│   │                     核心系統 (Core)                      │     │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │     │
│   │  │ Gateway  │ │Commander │ │Security  │            │     │
│   │  │  網關    │ │  指揮官   │ │  安全守衛 │            │     │
│   │  └──────────┘ └──────────┘ └──────────┘            │     │
│   │  ┌──────────┐ ┌──────────┐                          │     │
│   │  │ Plugin   │ │ Brain   │                          │     │
│   │  │  插件系統 │ │  大腦   │                          │     │
│   │  └──────────┘ └──────────┘                          │     │
│   └─────────────────────────────────────────────────────────┘     │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                   插件系統 (Plugins)                      │    │
│   │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │    │
│   │  │Channel │ │Memory  │ │Knowledge│ │ Tools  │         │    │
│   │  │ 渠道   │ │ 記憶   │ │ 知識   │ │ 工具   │         │    │
│   │  └────────┘ └────────┘ └────────┘ └────────┘         │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                   介面 (Interfaces)                      │    │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐                │    │
│   │  │   CLI    │ │   Web    │ │  REST   │                │    │
│   │  │  終端    │ │  瀏覽器  │ │   API   │                │    │
│   │  └──────────┘ └──────────┘ └──────────┘                │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 核心模組

### 1. Gateway - 網關

- 消息路由
- 頻道管理
- 訊息監聽
- 歷史記錄

### 2. Commander - 指揮官

- 服務管理
- 健康檢查
- 自動重啟
- 事件系統

### 3. SecurityGuard - 安全守衛

- 插件安全檢測
- 技能安全檢測
- 衝突檢測
- 防詐騙

### 4. UnifiedSecurityCenter - 安全中心

- VPN 管理
- RDP 防護
- 24小時防禦
- 防詐騙檢測

### 5. PluginSystem - 插件系統

- 插件管理
- Hook 系統
- 熱拔差

---

## 快速開始

```bash
# 進入目錄
cd independent-architecture/cli-v2

# 啟動 CLI
bun run index.ts

# CLI 內指令
> help                    # 查看幫助
> commander status        # 服務狀態
> gateway status          # 網關狀態
> security status         # 安全狀態
> plugin list            # 插件列表
```

---

## 指令參考

### 指揮官 (Commander)

```bash
commander start <name>      # 啟動服務
commander stop <name>       # 停止服務
commander restart <name>    # 重啟服務
commander status            # 狀態總覽
commander health            # 健康檢查
commander logs <name>      # 查看日誌
commander web start        # 啟動 Web UI
```

### 網關 (Gateway)

```bash
gateway connect <channel>   # 連接頻道
gateway disconnect <channel> # 斷開頻道
gateway send <ch> <msg>     # 發送訊息
gateway status              # 頻道狀態
gateway history            # 訊息歷史
```

### 安全 (Security)

```bash
security status            # 安全狀態
security vpn connect      # VPN 連接
security vpn disconnect     # VPN 斷開
security rdp block        # RDP 防護
security defense start    # 24小時防禦
security scam <msg>       # 防詐騙檢測
```

### 插件 (Plugin)

```bash
plugin list               # 插件列表
plugin info <name>        # 插件詳情
plugin enable <name>      # 啟用插件
plugin disable <name>     # 停用插件
plugin security <name>    # 安全檢查
plugin audit             # 審計日誌
```

---

## Web UI

啟動後訪問：`http://localhost:3001`

功能：

- 圖形化服務管理
- 即時狀態監控
- 一鍵操作
- 日誌查看
- 安全面板

---

## REST API

```bash
# 服務管理
GET  /api/services
POST /api/service/:name/start
POST /api/service/:name/stop
POST /api/service/:name/restart
GET  /api/service/:name/health

# 批量操作
POST /api/start-all
POST /api/stop-all

# 網關
GET  /api/gateway/status
GET  /api/gateway/channels
POST /api/gateway/send

# 安全
GET  /api/security/status
POST /api/security/scam-check
GET  /api/security/audit
```

---

## 插件開發

```typescript
import type { Plugin } from "./plugin-system"

export const myPlugin: Plugin = {
  metadata: {
    name: "my-plugin",
    version: "1.0.0",
    description: "我的插件",
    author: "獨立架構",
  },
  hooks: {
    "chat.before": async ({ message }) => {
      console.log("收到:", message)
      return
    },
  },
}
```

---

## 品牌標識

- **系統名**: 獨立架構 (Independent Architecture)
- **簡稱**: IA
- **口號**: _完全獨立，100% 自主_
- **定位**: 私有化 AI 控制中心

---

## 許可

MIT License - 完全開源，完全自主
