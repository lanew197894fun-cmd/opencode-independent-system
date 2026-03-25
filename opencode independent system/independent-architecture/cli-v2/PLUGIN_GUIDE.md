# 獨立架構插件系統指南

## 概述

插件系統是獨立架構的核心擴展機制，允許開發者以插件形式添加新功能。

---

## 插件架構

```
┌─────────────────────────────────────────────────────────────┐
│                    統一安全管理中心                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │   VPN    │ │   RDP    │ │  24小時   │ │  防詐騙  │       │
│  │  守衛     │ │  防護     │ │   防禦   │ │   檢測   │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       │            │            │            │              │
│       └────────────┴─────┬──────┴────────────┘              │
│                          │                                  │
│              ┌───────────▼───────────┐                     │
│              │     統一安全守衛       │                      │
│              │  (插件/技能檢測)       │                      │
│              └───────────┬───────────┘                     │
│                          │                                 │
│       ┌─────────────────┼─────────────────┐                │
│       │                 │                 │                │
│  ┌────▼────┐      ┌─────▼────┐     ┌─────▼─────┐           │
│  │  插件    │      │  技能    │      │   Hook   │            │
│  │ Manager │      │ Manager  │     │ Manager  │             │
│  └─────────┘      └──────────┘     └───────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## 功能模組

### 1. 統一安全管理中心

| 功能       | 說明                          |
| ---------- | ----------------------------- |
| VPN 管理   | WireGuard 連線/斷線、狀態檢測 |
| RDP 防護   | 3389 連接阻擋、白名單管理     |
| 24小時防禦 | fail2ban 整合、威脅偵測       |
| 防詐騙檢測 | 訊息分析、風險評分            |

### 2. 插件管理器

| 功能             | 說明         |
| ---------------- | ------------ |
| plugin list      | 列出所有插件 |
| plugin install   | 安裝插件     |
| plugin update    | 更新插件     |
| plugin uninstall | 卸載插件     |
| plugin enable    | 啟用插件     |
| plugin disable   | 停用插件     |
| plugin reload    | 重新載入     |
| plugin security  | 安全檢查     |
| plugin config    | 插件配置     |
| plugin search    | 搜尋插件     |

### 3. 統一安全守衛

| 檢測類型   | 說明                                 |
| ---------- | ------------------------------------ |
| 危險程式碼 | eval, exec, child_process 等         |
| 詐騙風險   | API Key 外洩、假冒登入、加密貨幣盜取 |
| 敏感 Hook  | cli.shutdown, session.save           |
| 可疑模式   | 無作者資訊但有外部依賴               |

---

## 安全等級

| 等級      | 標誌 | 說明           |
| --------- | ---- | -------------- |
| safe      | ✅   | 安全，無風險   |
| warning   | ⚠️   | 有警告，需注意 |
| dangerous | 🚨   | 危險，已阻擋   |
| blocked   | ⛔   | 完全封鎖       |

---

## 插件開發

### 基本結構

```typescript
import type { Plugin } from "./plugin-system"

export const myPlugin: Plugin = {
  metadata: {
    name: "my-plugin",
    version: "1.0.0",
    description: "我的插件",
    author: "Your Name",
  },
  hooks: {
    "chat.before": async ({ message }) => {
      console.log("收到訊息:", message)
      return // 或返回修改後的訊息
    },
    "chat.after": async ({ message, response }) => {
      console.log("回覆:", response)
    },
  },
  tools: [
    {
      name: "myTool",
      description: "我的工具",
      handler: async (input, context) => {
        return { result: "執行成功" }
      },
    },
  ],
}
```

### Hooks 列表

| Hook 名稱           | 觸發時機   | 輸入參數                   |
| ------------------- | ---------- | -------------------------- |
| `cli.init`          | CLI 初始化 | state                      |
| `cli.start`         | CLI 啟動   | state                      |
| `cli.shutdown`      | CLI 關閉   | state                      |
| `cli.beforeinput`   | 輸入前     | input, state               |
| `cli.afteroutput`   | 輸出後     | output, state              |
| `chat.before`       | 聊天前     | message, context           |
| `chat.after`        | 聊天後     | message, response, context |
| `chat.error`        | 聊天錯誤   | message, error, context    |
| `tool.before`       | 工具執行前 | tool, input                |
| `tool.after`        | 工具執行後 | tool, input, output        |
| `tool.error`        | 工具錯誤   | tool, input, error         |
| `session.create`    | 會話創建   | sessionId, context         |
| `session.save`      | 會話保存   | sessionId                  |
| `session.load`      | 會話載入   | sessionId                  |
| `model.before`      | 模型呼叫前 | model, provider            |
| `model.after`       | 模型呼叫後 | model, provider, result    |
| `provider.register` | 提供者註冊 | provider                   |
| `command.register`  | 命令註冊   | command                    |
| `error.handle`      | 錯誤處理   | error, context             |

### 防詐騙檢測模式

插件會自動檢測以下詐騙模式：

| 模式                        | 風險 |
| --------------------------- | ---- |
| `api_key` / `password` 外洩 | 高度 |
| 螢幕截圖/鍵盤記錄           | 高度 |
| 加密貨幣錢包盜取            | 高度 |
| 金融資料盜取                | 高度 |
| URL 重定向                  | 中度 |
| 假冒 API 攔截               | 中度 |

---

## 指令參考

### 插件管理

```bash
# 列出插件
plugin list

# 查看單一插件
plugin info <name>

# 安裝插件
plugin install <name>

# 更新插件
plugin update <name>

# 卸載插件
plugin uninstall <name>

# 啟用/停用
plugin enable <name>
plugin disable <name>

# 重新載入
plugin reload <name>

# 安全檢查
plugin security <name>

# 審計日誌
plugin audit
```

### 安全中心

```bash
# 安全狀態
security status

# VPN 管理
security vpn connect
security vpn disconnect
security vpn status

# RDP 防護
security rdp block
security rdp allow <ip>

# 24小時防禦
security defense start
security defense stop
security defense status

# 防詐騙檢測
security scam <message>

# 完整安全檢查
security check
```

---

## 配置檔案

插件配置保存在：

```
~/.independent-architecture/plugins/
├── registry.json      # 插件註冊表
└── configs/          # 各插件配置
    └── my-plugin.json
```

安全中心配置：

```
~/.independent-architecture/security/
├── security-center.json  # 安全配置
└── logs/              # 審計日誌
```

---

## 信任名單

預設信任的插件：

- `builtin-logger` - 內建日誌
- `builtin-memory` - 內建記憶
- `builtin-error` - 內建錯誤處理
- `ia-plugin-manager` - 插件管理器

預設信任的技能：

- `ai-memory` - AI 記憶
- `memory-pro` - 記憶增強
- `important-notice` - 重要通知
- `user-rules` - 用戶規則

---

## 疑難排解

### 插件無法載入

1. 檢查安全檢查是否阻擋

   ```bash
   plugin security <name>
   ```

2. 查看審計日誌

   ```bash
   plugin audit
   ```

3. 確認配置正確
   ```bash
   plugin config <name>
   ```

### 安全守衛阻擋正常插件

將插件加入白名單：

```bash
security allow plugin <name>
```

或關閉嚴格模式：

```bash
security strict off
```
