---
name: wacli
description: WhatsApp 訊息發送 - 發送訊息給他人或搜尋/同步 WhatsApp 歷史
homepage: https://wacli.sh
metadata:
  openclaw:
    emoji: "📱"
    requires:
      bins: ["wacli"]
    install:
      - id: brew
        kind: brew
        formula: steipete/tap/wacli
        bins: ["wacli"]
        label: "安裝 wacli (brew)"
      - id: go
        kind: go
        module: github.com/steipete/wacli/cmd/wacli@latest
        bins: ["wacli"]
        label: "安裝 wacli (go)"
---

# WhatsApp 操作

使用 `wacli` 發送 WhatsApp 訊息給他人或搜尋/同步歷史。

---

## 觸發關鍵字

| 關鍵字        | 動作     |
| ------------- | -------- |
| 發送 WhatsApp | 發送訊息 |
| WhatsApp 搜尋 | 搜尋歷史 |

---

## 使用規則

- **僅用于聯繫他人** - 勿用於一般用戶對話
- 用戶主動要求發送訊息時才使用
- OpenClaw 會自動路由 WhatsApp 對話

---

## 安全規則

1. 需明確收件人 + 訊息內容
2. 發送前確認收件人和訊息
3. 如有疑問，先詢問用戶

---

## 驗證與同步

```bash
# 登入 + 初始同步
wacli auth

# 持續同步
wacli sync --follow

# 診斷
wacli doctor
```

---

## 查找對話與訊息

```bash
# 列表對話
wacli chats list --limit 20 --query "name or number"

# 搜尋訊息
wacli messages search "query" --limit 20 --chat <jid>

# 日期範圍搜尋
wacli messages search "invoice" --after 2025-01-01 --before 2025-12-31
```

---

## 歷史填充

```bash
wacli history backfill --chat <jid> --requests 2 --count 50
```

---

## 發送訊息

```bash
# 文字
wacli send text --to "+14155551212" --message "Hello!"

# 群組
wacli send text --to "1234567890-123456789@g.us" --message "Running 5 min late."

# 檔案
wacli send file --to "+14155551212" --file /path/agenda.pdf --caption "Agenda"
```

---

## 注意事項

- 儲存目錄：`~/.wacli`
- 腳本使用 `--json`
- 填充歷史需要手機在線
- JID 格式：
  - 個人：`<number>@s.whatsapp.net`
  - 群組：`<id>@g.us`
