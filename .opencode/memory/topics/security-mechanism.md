## 安全機制整合
date:2026-03-24

### 權杖加密儲存
- 系統: channel.ts
- 方法: XOR + Base64 雙重加密
- 金鑰: 從專案路徑自動生成
- 加密欄位: token, webhook_url

### 上傳控制
- 全域禁止: backup_upload_control(enabled: true)
- 分項禁止: backup_upload_config(target: "knowledge", allow: false)
- 單次禁止: knowledge_store(disableUpload: true)

### 上傳通知
- 觸發: 知識庫上傳到 GitHub 時
- 管道: Telegram 已設定的頻道
- 內容: 類型、目標、時間

### 工具列表
| 工具 | 功能 |
|------|------|
| channel_telegram_setup | 設定 Telegram (權杖加密) |
| backup_upload_control | 全域上傳控制 |
| backup_upload_status | 查看上傳設定 |
| backup_upload_config | 分項上傳設定 |
| knowledge_store | 知識儲存 (可選禁止上傳) |

### 使用範例
```
# 禁止所有上傳
backup_upload_control(enabled: true)

# 允許知識庫上傳
backup_upload_config(target: "knowledge", allow: true)

# 單次禁止上傳
knowledge_store(type: "fact", content: "...", disableUpload: true)

# 自動上傳到 GitHub
knowledge_store(type: "fact", content: "...", autoSyncGitHub: true)
```