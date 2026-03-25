# 🚀 OpenCode 統一管理系統

> 一站式管理你的私人 AI 助手 - 獨立架構 • 插件系統 • 技能整合

---

## 📋 目錄

- [快速入門](#-快速入門)
- [統一入口](#-統一入口)
- [插件系統](#-插件系統)
- [功能說明](#-功能說明)
- [新手常見問題](#-新手常見問題)
- [技術支援](#-技術支援)

---

## 🎯 快速入門

### 第一次使用？

```bash
# 1. 進入目錄
cd /home/reamaster/opencode-manager/opencode\ independent\ system/independent-architecture/OpenCodeInstaller

# 2. 執行安裝 (需要管理員權限)
sudo ./opencode.sh install

# 3. 啟動服務
./opencode.sh start
```

### 日常使用

```bash
# 進入目錄
cd /home/reamaster/opencode-manager/opencode\ independent\ system/independent-architecture/OpenCodeInstaller

# 查看幫助
./opencode.sh help
```

---

## 🚀 統一入口

使用 `./opencode.sh` 命令管理所有功能：

| 命令                     | 說明               | 適合對象   |
| ------------------------ | ------------------ | ---------- |
| `./opencode.sh install`  | 安裝 OpenCode 系統 | 第一次使用 |
| `./opencode.sh start`    | 啟動服務           | 每天使用   |
| `./opencode.sh stop`     | 停止服務           | 每天使用   |
| `./opencode.sh restart`  | 重啟服務           | 問題排除   |
| `./opencode.sh status`   | 查看運行狀態       | 日常檢查   |
| `./opencode.sh health`   | 健康檢查           | 問題排查   |
| `./opencode.sh guardian` | 守衛系統狀態       | 進階用戶   |
| `./opencode.sh tools`    | 工具選單           | 管理功能   |
| `./opencode.sh web`      | 開啟網頁介面       | 新手最愛   |
| `./opencode.sh help`     | 顯示幫助           | 查詢指令   |

---

## 🔌 插件系統

### 插件類型

| 類型              | 位置               | 說明                       |
| ----------------- | ------------------ | -------------------------- |
| 技能 (Skills)     | `.opencode/skill/` | 80+ 預裝技能，自動載入     |
| 擴展 (Extensions) | `extensions/`      | 進階通訊/記憶插件 (需安裝) |

### 內建技能 (自動載入)

系統啟動時**全自動載入**以下技能，無需手動開啟：

```
• 記憶系統 (memory-lancedb-pro, ai-memory)
• 安全防護 (security-auto, security-shield)
• 系統優化 (system-optimizer, self-repair)
• 開發工具 (github, mcporter, skill-creator)
• 通訊 (discord, slack, telegram, line)
• 數據分析 (model-usage, summarize)
• 通訊擴展 (matrix, mattermost, nostr, twitch)
• 檔案分享 (feishu, googlechat, synology-chat)
... 等 100+ 功能
```

### 🎯 新手注意

**一切全自動！** 啟動系統後所有功能直接可用，無需：

- ❌ 手動安裝
- ❌ 手動啟用
- ❌ 記住指令

直接說出你想做什麼，AI 會自動使用相應功能。

### 查看已載入插件

```bash
# CLI 中執行
./opencode.sh status

# 或使用命令
plugin list      # 列出所有插件
plugin enabled   # 已啟用插件
plugin disabled  # 已停用插件
```

### 啟用/停用插件

```bash
# 啟用插件
plugin enable <plugin-name>

# 停用插件
plugin disable <plugin-name>

# 重新載入
plugin reload <plugin-name>
```

---

## ⚡ 快速命令

```bash
# 新手首選 - 一鍵啟動網頁介面 (最推薦！)
./opencode.sh web

# 網頁 + 終端模式
cd /home/reamaster/opencode-manager/opencode\ independent\ system
./opencode-dev-start.sh              # 網頁 + 終端
./opencode-dev-start.sh --web        # 僅網頁
./opencode-dev-start.sh --cli        # 僅終端

# 檢查系統狀態
./opencode.sh status

# 健康檢查
./opencode.sh health

# 停止服務
./opencode.sh stop

# 重新啟動
./opencode.sh restart
```

---

## 🛠️ 進階功能

### 完整啟動器 (launcher.sh)

```bash
# 進入目錄
cd /home/reamaster/opencode-manager/opencode\ independent\ system/independent-architecture/OpenCodeInstaller

# 互動式選單
./launcher.sh menu

# 單獨功能
./launcher.sh start      # 啟動
./launcher.sh stop      # 停止
./launcher.sh status    # 狀態
./launcher.sh backup    # 備份
```

### 工具選單

```bash
./config-menu.sh        # 圖形化配置
./opencode-guardian.sh   # 守衛系統
./model-router.sh       # 模型路由
./ollama-tuner.sh       # Ollama 調優
```

### 備份同步

```bash
cd tools/backup-sync
./toolbox.sh            # 互動式工具箱
./sync-to-storage.sh    # 同步到 USB
./restore-backup.sh      # 還原備份
```

---

## 🎮 新手常見問題

### Q: 第一次該怎麼開始？

```
最簡單的方式：
1. 執行 ./opencode.sh web
2. 瀏覽器會自動開啟 http://localhost:3000
3. 開始使用！
```

### Q: 服務啟動失敗怎麼辦？

```
1. 執行 ./opencode.sh health 檢查健康狀態
2. 執行 ./opencode.sh restart 重新啟動
3. 查看日誌：./launcher.sh logs
```

### Q: 如何備份資料？

```
執行 ./opencode.sh tools 進入工具選單
選擇「備份」功能
```

### Q: 需要更新系統嗎？

```
執行 ./opencode.sh install 會自動檢查更新
```

---

## 📊 功能地圖

```
OpenCode 系統
│
├── 🌐 網頁介面 (Web UI)
│   └── http://localhost:3000
│
├── 💻 命令列 (CLI)
│   └── ./opencode.sh
│
├── 🛡️ 守衛系統
│   └── opencode-guardian.sh
│
├── 📦 插件系統
│   └── extensions/
│
└── 💾 備份同步
    └── tools/backup-sync/
```

---

## 🔗 技術支援

### 查看狀態

```bash
# 服務狀態
./opencode.sh status

# 健康檢查
./opencode.sh health

# 守衛狀態
./opencode.sh guardian
```

### 日誌位置

```
~/.opencode/logs/          # 日誌目錄
/tmp/opencode_*.log        # 臨時日誌
```

---

## 📝 筆記

- **系統路徑**: `/home/reamaster/opencode-manager/opencode independent system/independent-architecture/OpenCodeInstaller/`
- **配置目錄**: `~/.opencode/`
- **日誌目錄**: `~/.opencode/logs/`

---

Made with ❤️ by OpenCode Team
