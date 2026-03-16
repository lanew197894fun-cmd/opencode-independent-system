---
name: apple-reminders
description: Apple Reminders 管理 - 透過 remindctl CLI
homepage: https://github.com/steipete/remindctl
metadata:
  openclaw:
    emoji: "⏰"
    os: ["darwin"]
    requires:
      bins: ["remindctl"]
    install:
      - id: brew
        kind: brew
        formula: steipete/tap/remindctl
        bins: ["remindctl"]
        label: "透過 Homebrew 安裝 remindctl"
---

# Apple Reminders 操作

使用 `remindctl` 管理 Apple Reminders。

---

## 觸發關鍵字

| 關鍵字   | 動作         |
| -------- | ------------ |
| 新增提醒 | 建立提醒事項 |
| 列表提醒 | 列出提醒     |
| 完成提醒 | 標記完成     |

---

## 使用時機

### ✅ 適用

- 使用者提到「reminder」
- 建立同步到 iOS 的個人待辦事項
- 管理 Apple Reminders 清單

### ❌ 不適用

- 排程 Clawdbot 任務 → 使用 `cron` tool
- 日曆事件 → 使用 Apple Calendar
- 專案管理 → 使用 Notion/GitHub Issues

---

## 設定

```bash
brew install steipete/tap/remindctl
remindctl status
remindctl authorize
```

---

## 常用指令

### 檢視

```bash
remindctl                    # 今日
remindctl today              # 今日
remindctl tomorrow           # 明日
remindctl week               # 本週
remindctl overdue            # 逾期
remindctl all                # 全部
remindctl 2026-01-04         # 指定日期
```

### 清單管理

```bash
remindctl list               # 列表清單
remindctl list Work          # 指定清單
remindctl list Projects --create
remindctl list Work --delete
```

### 建立

```bash
remindctl add "Buy milk"
remindctl add --title "Call mom" --list Personal --due tomorrow
remindctl add --title "Meeting prep" --due "2026-02-15 09:00"
```

### 完成/刪除

```bash
remindctl complete 1 2 3
remindctl delete 4A83 --force
```

---

## 輸出格式

```bash
remindctl today --json       # JSON
remindctl today --plain      # TSV
remindctl today --quiet      # 僅計數
```

---

## 日期格式

- `today`, `tomorrow`, `yesterday`
- `YYYY-MM-DD`
- `YYYY-MM-DD HH:mm`
- ISO 8601
