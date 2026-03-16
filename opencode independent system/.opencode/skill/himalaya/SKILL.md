---
name: hlmaya
description: CLI 郵件管理 - 透過 IMAP/SMTP 管理郵件
homepage: https://github.com/pimalaya/himalaya
metadata:
  openclaw:
    emoji: "📧"
    requires:
      bins: ["himalaya"]
    install:
      - id: brew
        kind: brew
        formula: himalaya
        bins: ["himalaya"]
        label: "安裝 Himalaya (brew)"
---

# 郵件管理 CLI

使用 himalaya 從終端機管理郵件，支援 IMAP、SMTP、Notmuch、Sendmail 後端。

---

## 觸發關鍵字

| 關鍵字   | 動作          |
| -------- | ------------- |
| 列表郵件 | 列出郵件      |
| 讀取郵件 | 讀取郵件內容  |
| 發送郵件 | 撰寫/發送郵件 |
| 搜尋郵件 | 搜尋郵件      |

---

## 設定

### 互動式設定

```bash
himalaya account configure
```

### 手動設定

```toml
[accounts.personal]
email = "you@example.com"
display-name = "Your Name"
default = true

backend.type = "imap"
backend.host = "imap.example.com"
backend.port = 993
backend.encryption.type = "tls"
backend.login = "you@example.com"
backend.auth.type = "password"
backend.auth.cmd = "pass show email/imap"

message.send.backend.type = "smtp"
message.send.backend.host = "smtp.example.com"
message.send.backend.port = 587
message.send.backend.encryption.type = "start-tls"
message.send.backend.login = "you@example.com"
message.send.backend.auth.type = "password"
message.send.backend.auth.cmd = "pass show email/smtp"
```

---

## 常用指令

### 列表資料夾

```bash
himalaya folder list
```

### 列表郵件

```bash
# 預設 INBOX
himalaya envelope list

# 指定資料夾
himalaya envelope list --folder "Sent"

# 分頁
himalaya envelope list --page 1 --page-size 20
```

### 搜尋郵件

```bash
himalaya envelope list from john@example.com subject meeting
```

### 讀取郵件

```bash
# 讀取郵件（純文字）
himalaya message read 42

# 匯出原始 MIME
himalaya message export 42 --full
```

### 回覆郵件

```bash
# 互動式回覆
himalaya message reply 42

# 回覆全部
himalaya message reply 42 --all
```

### 轉發郵件

```bash
himalaya message forward 42
```

### 發送郵件

```bash
# 互動式撰寫
himalaya message write

# 直接發送
cat << 'EOF' | himalaya template send
From: you@example.com
To: recipient@example.com
Subject: Test Message

Hello from Himalaya!
EOF

# 使用 header
himalaya message write -H "To:recipient@example.com" -H "Subject:Test" "Message body"
```

### 移動/複製郵件

```bash
# 移動
himalaya message move 42 "Archive"

# 複製
himalaya message copy 42 "Important"
```

### 刪除郵件

```bash
himalaya message delete 42
```

### 標記管理

```bash
# 新增標記
himalaya flag add 42 --flag seen

# 移除標記
himalaya flag remove 42 --flag seen
```

---

## 多帳號

```bash
# 列表帳號
himalaya account list

# 使用特定帳號
himalaya --account work envelope list
```

---

## 附件

```bash
# 下載附件
himalaya attachment download 42

# 指定目錄
himalaya attachment download 42 --dir ~/Downloads
```

---

## 輸出格式

```bash
himalaya envelope list --output json
himalaya envelope list --output plain
```

---

## 調試

```bash
#  debug 記錄
RUST_LOG=debug himalaya envelope list

# 完整追蹤
RUST_LOG=trace RUST_BACKTRACE=1 himalaya envelope list
```

---

## 提示

- 使用 `himalaya --help` 查看詳細用法
- 郵件 ID 僅相對當前資料夾
- 使用 `pass` 或系統 keyring 安全儲存密碼
