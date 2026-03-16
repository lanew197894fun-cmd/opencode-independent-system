---
name: imsg
description: iMessage/SMS CLI - 列表對話、讀取歷史、發送訊息
homepage: https://imsg.to
metadata:
  openclaw:
    emoji: "📨"
    os: ["darwin"]
    requires:
      bins: ["imsg"]
    install:
      - id: brew
        kind: brew
        formula: steipete/tap/imsg
        bins: ["imsg"]
        label: "安裝 imsg (brew)"
---

# iMessage/SMS 操作

使用 `imsg` 讀取和發送 iMessage/SMS。

---

## 觸發關鍵字

| 關鍵字        | 動作          |
| ------------- | ------------- |
| 傳送 iMessage | 發送 iMessage |
| 列表訊息      | 列表對話      |
| 讀取訊息      | 讀取歷史      |

---

## 使用時機

### ✅ 適用

- 用戶明確要求發送 iMessage 或 SMS
- 讀取 iMessage 對話歷史
- 檢查近期 Messages.app 聊天
- 發送到電話號碼或 Apple ID

### ❌ 不適用

- Telegram → 使用 `message` tool `channel:telegram`
- Signal → 使用 Signal 管道
- WhatsApp → 使用 WhatsApp 管道
- Discord → 使用 `message` tool `channel:discord`
- Slack → 使用 `slack` skill
- 群組管理 → 不支援
- 大量發送 → 需先確認

---

## 需求

- macOS 已登入 Messages.app
- 終端機需要完整磁碟存取權限
- 自動化權限（發送時需要）

---

## 常用指令

### 列表對話

```bash
imsg chats --limit 10 --json
```

### 讀取歷史

```bash
# 按對話 ID
imsg history --chat-id 1 --limit 20 --json

# 含附件資訊
imsg history --chat-id 1 --limit 20 --attachments --json
```

### 監看新訊息

```bash
imsg watch --chat-id 1 --attachments
```

### 發送訊息

```bash
# 純文字
imsg send --to "+14155551212" --text "Hello!"

# 含附件
imsg send --to "+14155551212" --text "Check this out" --file /path/to/image.jpg

# 指定服務
imsg send --to "+14155551212" --text "Hi" --service imessage
imsg send --to "+14155551212" --text "Hi" --service sms
```

---

## 服務選項

| 選項                 | 說明             |
| -------------------- | ---------------- |
| `--service imessage` | 強制 iMessage    |
| `--service sms`      | 強制 SMS         |
| `--service auto`     | 自動判斷（預設） |

---

## 安全規則

1. 發送前**務必確認收件人和內容**
2. **勿發送到未知號碼**除非獲得明確批准
3. **小心附件** - 確認檔案路徑存在
4. **控制頻率** - 勿濫發

---

## 範例流程

用戶：「傳訊息給媽媽說我會晚點」

```bash
# 1. 找到媽媽的對話
imsg chats --limit 20 --json | jq '.[] | select(.displayName | contains("Mom"))'

# 2. 確認用戶
# "找到媽媽 at +1555123456。要發送 'I'll be late' 嗎？"

# 3. 確認後發送
imsg send --to "+1555123456" --text "I'll be late"
```
