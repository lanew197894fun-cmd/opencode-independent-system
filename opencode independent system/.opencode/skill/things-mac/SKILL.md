---
name: things-mac
description: Things 3 管理 - 透過 things CLI 新增/更新專案與待辦事項
homepage: https://github.com/ossianhempel/things3-cli
metadata:
  openclaw:
    emoji: "✅"
    os: ["darwin"]
    requires:
      bins: ["things"]
    install:
      - id: go
        kind: go
        module: github.com/ossianhempel/things3-cli/cmd/things@latest
        bins: ["things"]
        label: "安裝 things3-cli (go)"
---

# Things 3 操作

使用 `things` 管理 Things 3。

---

## 觸發關鍵字

| 關鍵字      | 動作         |
| ----------- | ------------ |
| Things 待辦 | 新增待辦事項 |
| Things 列表 | 列出事項     |
| Things 搜尋 | 搜尋事項     |

---

## 設定

```bash
GOBIN=/opt/homebrew/bin go install github.com/ossianhempel/things3-cli/cmd/things@latest
```

- 需授予**完整磁碟存取權**
- 可選：`THINGSDB` 或 `--db`
- 可選：`THINGS_AUTH_TOKEN`

---

## 讀取

```bash
things inbox --limit 50
things today
things upcoming
things search "query"
things projects
things areas
things tags
```

---

## 新增

```bash
# 預覽
things --dry-run add "Title"

# 新增
things add "Buy milk"
things add "Buy milk" --notes "2% + bananas"
things add "Book flights" --list "Travel"
things add "Call dentist" --tags "health,phone"
```

### STDIN

```bash
cat <<'EOF' | things add -
Title line
Notes line 1
Notes line 2
EOF
```

---

## 修改

```bash
# 先取得 ID
things search "milk" --limit 5

# 設定 auth token
THINGS_AUTH_TOKEN=xxx things update --id <UUID> --notes "New notes"

# 修改
things update --id <UUID> --completed
things update --id <UUID> --canceled
```

---

## 注意事項

- 僅 macOS
- `--dry-run` 僅列印 URL 不開啟 Things
- 刪除不支援，可標記完成
