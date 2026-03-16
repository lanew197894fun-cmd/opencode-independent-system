---
name: gog
description: Google Workspace CLI - 管理 Gmail、Calendar、Drive、Contacts、Sheets、Docs
homepage: https://gogcli.sh
metadata:
  openclaw:
    emoji: "🎮"
    requires:
      bins: ["gog"]
    install:
      - id: brew
        kind: brew
        formula: steipete/tap/gogcli
        bins: ["gog"]
        label: "安裝 gog (brew)"
---

# Google Workspace 操作

使用 `gog` CLI 管理 Gmail、Calendar、Drive、Contacts、Sheets、Docs。需要 OAuth 設定。

---

## 觸發關鍵字

| 關鍵字     | 動作          |
| ---------- | ------------- |
| Gmail 搜尋 | 搜尋郵件      |
| 發送郵件   | 發送 Gmail    |
| 日曆事件   | 管理 Calendar |
| 雲端硬碟   | 搜尋 Drive    |
| 聯絡人     | 列表聯絡人    |
| Sheets     | 讀寫表格      |
| Docs       | 匯出文件      |

---

## 設定（一次性）

```bash
gog auth credentials /path/to/client_secret.json
gog auth add you@gmail.com --services gmail,calendar,drive,contacts,docs,sheets
gog auth list
```

---

## 常用指令

### Gmail

```bash
# 搜尋郵件
gog gmail search 'newer_than:7d' --max 10

# 搜尋訊息（不忽略執行緒）
gog gmail messages search "in:inbox from:ryanair.com" --max 20 --account you@example.com

# 發送郵件
gog gmail send --to a@b.com --subject "Hi" --body "Hello"

# 發送多行郵件
gog gmail send --to a@b.com --subject "Hi" --body-file ./message.txt

# 發送 HTML 郵件
gog gmail send --to a@b.com --subject "Hi" --body-html "<p>Hello</p>"

# 建立草稿
gog gmail drafts create --to a@b.com --subject "Hi" --body-file ./message.txt

# 發送草稿
gog gmail drafts send <draftId>

# 回覆郵件
gog gmail send --to a@b.com --subject "Re: Hi" --body "Reply" --reply-to-message-id <msgId>
```

### Calendar

```bash
# 列表事件
gog calendar events <calendarId> --from <iso> --to <iso>

# 建立事件
gog calendar create <calendarId> --summary "Title" --from <iso> --to <iso>

# 建立彩色事件
gog calendar create <calendarId> --summary "Title" --from <iso> --to <iso> --event-color 7

# 更新事件
gog calendar update <calendarId> <eventId> --summary "New Title" --event-color 4

# 顯示顏色選項
gog calendar colors
```

### Drive

```bash
# 搜尋檔案
gog drive search "query" --max 10
```

### Contacts

```bash
# 列表聯絡人
gog contacts list --max 20
```

### Sheets

```bash
# 讀取資料
gog sheets get <sheetId> "Tab!A1:D10" --json

# 更新資料
gog sheets update <sheetId> "Tab!A1:B2" --values-json '[["A","B"],["1","2"]]' --input USER_ENTERED

# 附加資料
gog sheets append <sheetId> "Tab!A:C" --values-json '[["x","y","z"]]' --insert INSERT_ROWS

# 清除資料
gog sheets clear <sheetId> "Tab!A2:Z"

# 中繼資料
gog sheets metadata <sheetId> --json
```

### Docs

```bash
# 匯出文件
gog docs export <docId> --format txt --out /tmp/doc.txt

# 顯示內容
gog docs cat <docId>
```

---

## 日曆顏色

使用 `gog calendar colors` 查看所有可用顏色（ID 1-11）：

| ID  | 顏色    |
| --- | ------- |
| 1   | #a4bdfc |
| 2   | #7ae7bf |
| 3   | #dbadff |
| 4   | #ff887c |
| 5   | #fbd75b |
| 6   | #ffb878 |
| 7   | #46d6db |
| 8   | #e1e1e1 |
| 9   | #5484ed |
| 10  | #51b749 |
| 11  | #dc2127 |

---

## 郵件格式

- 優先使用純文字，使用 `--body-file` 處理多段落訊息
- HTML 格式：`<p>` 段落、`<br>` 換行、`<strong>` 粗體、`<em>` 斜體、`<a>` 連結

**範例（純文字 via stdin）：**

```bash
gog gmail send --to recipient@example.com \
  --subject "Meeting Follow-up" \
  --body-file - <<'EOF'
Hi Name,

Thanks for meeting today. Next steps:
- Item one
- Item two

Best regards,
Your Name
EOF
```

---

## 注意事項

- 設定 `GOG_ACCOUNT=you@gmail.com` 避免重複指定 `--account`
- 腳本化時使用 `--json` + `--no-input`
- 發送郵件或建立事件前先確認
- `gog gmail search` 每行一個執行緒，需要個別郵件使用 `gog gmail messages search`
