# 🦞 OpenClaw 一鍵部署工具

> 🚀 一鍵部署你的私人 AI 助手 OpenClaw，支援多平台多模型配置

## 📖 目錄

- [功能特性](#-功能特性)
- [快速開始](#-快速開始)
- [啟動器命令](#-啟動器命令)
- [備份同步工具](#-備份同步工具)
- [常用命令](#-常用命令)
- [系統要求](#-系統要求)

## ✨ 功能特性

### 🤖 多模型支援

- Anthropic Claude (claude-sonnet-4-5)
- OpenAI GPT (gpt-4o, gpt-4o-mini)
- Google Gemini (gemini-2.0-flash)
- OpenRouter / Groq / Mistral AI / Ollama

### 📱 多渠道接入

- Telegram Bot
- Discord Bot
- WhatsApp
- 飛書 (Feishu)
- Slack / iMessage / 微信

### 🛠️ 管理工具

- **launcher.sh** - 整合啟動器
- **model-router.sh** - 模型路由管理
- **openclaw-guardian.sh** - 監護守護程序
- **tools/backup-sync/** - 備份同步工具

## 🚀 快速開始

```bash
# 一鍵安裝
curl -fsSL https://raw.githubusercontent.com/miaoxworld/OpenClawInstaller/main/install.sh | bash

# 或手動安裝
git clone https://github.com/miaoxworld/OpenClawInstaller.git
cd OpenClawInstaller
chmod +x install.sh
./install.sh
```

## 🎮 啟動器命令

```bash
# 進入 OpenClawInstaller 目錄
cd OpenClawInstaller

# 執行啟動器
./launcher.sh
```

### 啟動器功能表

| 命令       | 說明                  |
| ---------- | --------------------- |
| `menu`     | 開啟主選單            |
| `start`    | 啟動 OpenClaw Gateway |
| `stop`     | 停止服務              |
| `restart`  | 重啟服務              |
| `status`   | 查看狀態              |
| `health`   | 健康檢查              |
| `logs`     | 查看日誌              |
| `backup`   | 備份配置              |
| `sync`     | 同步到外接儲存        |
| `detect`   | 偵測外接儲存裝置      |
| `usb`      | 開啟 USB 資料夾       |
| `opencode` | 開啟 OpenCode         |
| `web`      | 開啟網頁管理介面      |

## 💾 備份同步工具

位置：`tools/backup-sync/`

### 腳本列表

| 腳本                  | 功能                               |
| --------------------- | ---------------------------------- |
| `toolbox.sh`          | 備份工具箱主選單                   |
| `sync-to-storage.sh`  | 同步到外接 USB/硬碟                |
| `sync-project.sh`     | 自訂專案同步（含缺少套件偵測）     |
| `detect-storage.sh`   | 偵測外接儲存裝置                   |
| `restore-backup.sh`   | 從備份還原                         |
| `local-backup.sh`     | 本地備份                           |
| `list-backups.sh`     | 列出備份                           |
| `check-status.sh`     | 檢查配置狀態                       |
| `sync-to-windows.ps1` | PowerShell 同步腳本（WSL→Windows） |
| `sync-to-windows.bat` | Batch 同步腳本（WSL→Windows）      |

### 使用範例

```bash
cd tools/backup-sync

# 開啟工具箱
./toolbox.sh

# 同步到 USB
./sync-to-storage.sh /media/reamaster/USB

# 偵測儲存裝置
./detect-storage.sh

# 同步自訂專案（含缺少套件偵測）
./sync-project.sh /path/to/project /backup/path

# 從 USB 還原
./restore-backup.sh /media/reamaster/USB/backup_name
```

### 缺少套件偵測

`sync-project.sh` 會自動偵測以下套件管理檔：

- `package.json` (Node.js/pnpm)
- `requirements.txt` (Python)
- `Cargo.toml` (Rust)
- `go.mod` (Go)
- `Gemfile` (Ruby)
- `composer.json` (PHP)
- `pom.xml` / `build.gradle` (Java)

偵測結果會產生 `MISSING_PACKAGES.txt` 檔案。

### Windows 同步（WSL）

在 Windows PowerShell 中執行：

```powershell
# 同步全部
.\sync-to-windows.ps1 -All

# 只同步專案
.\sync-to-windows.ps1 -Manager

# 只同步 OpenClaw 配置
.\sync-to-windows.ps1 -OpenClaw
```

或使用 Batch 版本：

```
sync.bat all
sync.bat manager
sync.bat openclaw
```

## 📝 常用命令

```bash
# 啟動服務
openclaw gateway start

# 停止服務
openclaw gateway stop

# 查看狀態
openclaw gateway status

# 查看日誌
openclaw logs

# 健康檢查
openclaw health

# 執行配置選單
bash ~/.openclaw/config-menu.sh
```

## 💻 系統要求

| 項目     | 要求                                   |
| -------- | -------------------------------------- |
| 作業系統 | macOS 12+ / Ubuntu 20.04+ / Debian 11+ |
| Node.js  | v22 或更高版本                         |
| 記憶體   | 最低 2GB，推薦 4GB+                    |

## 🔗 相關連結

- [OpenClaw 官網](https://clawd.bot)
- [官方文檔](https://clawd.bot/docs)
- [OpenClaw 主儲存庫](https://github.com/openclaw/openclaw)

---

Made with ❤️ by OpenClaw Team
