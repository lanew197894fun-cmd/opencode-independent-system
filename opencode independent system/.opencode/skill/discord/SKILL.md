---
name: discord
description: Discord 操作 - 透過 message tool 控制
metadata:
  openclaw:
    emoji: "🎮"
    requires:
      config: ["channels.discord.token"]
allowed-tools: ["message"]
---

# Discord 操作

使用 `message` tool，channel 設為 `"discord"`。

---

## 觸發關鍵字

| 關鍵字       | 動作               |
| ------------ | ------------------ |
| 發送 Discord | 發送訊息到 Discord |
| Discord 回應 | 回應訊息           |
| 讀取 Discord | 讀取頻道訊息       |

---

## 必要事項

- 務必設 `channel: "discord"`
- 遵守閘道權限：`channels.discord.actions.*`（部分預設關閉：`roles`、`moderation`、`presence`、`channels`）
- 優先使用明確 ID：`guildId`、`channelId`、`messageId`、`userId`
- 多帳號：可選 `accountId`

---

## 風格指南

- 避免 Markdown 表格
- 提及用戶 `<@USER_ID>`
- 優先使用 components v2（Rich UI）

---

## 目標格式

- 發送類：`to: "channel:<id>"` 或 `to: "user:<id>"`
- 訊息類：`channelId: "<id>"` + `messageId: "<id>"`

---

## 常用動作

### 發送訊息

```json
{
  "action": "send",
  "channel": "discord",
  "to": "channel:123",
  "message": "hello",
  "silent": true
}
```

### 發送媒體

```json
{
  "action": "send",
  "channel": "discord",
  "to": "channel:123",
  "message": "see attachment",
  "media": "file:///tmp/example.png"
}
```

### Rich UI (components v2)

```json
{
  "action": "send",
  "channel": "discord",
  "to": "channel:123",
  "message": "Status update",
  "components": "[Carbon v2 components]"
}
```

### 回應

```json
{
  "action": "react",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456",
  "emoji": "✅"
}
```

### 讀取

```json
{
  "action": "read",
  "channel": "discord",
  "to": "channel:123",
  "limit": 20
}
```

### 編輯/刪除

```json
{
  "action": "edit",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456",
  "message": "fixed typo"
}
```

```json
{
  "action": "delete",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456"
}
```

### 投票

```json
{
  "action": "poll",
  "channel": "discord",
  "to": "channel:123",
  "pollQuestion": "Lunch?",
  "pollOption": ["Pizza", "Sushi", "Salad"],
  "pollMulti": false,
  "pollDurationHours": 24
}
```

### 釘選

```json
{
  "action": "pin",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456"
}
```

### 討論串

```json
{
  "action": "thread-create",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456",
  "threadName": "bug triage"
}
```

### 搜尋

```json
{
  "action": "search",
  "channel": "discord",
  "guildId": "999",
  "query": "release notes",
  "channelIds": ["123", "456"],
  "limit": 10
}
```

---

## Discord 風格

- 簡短、對話式、低儀式感
- 避免 Markdown 表格
- 提及用戶 `<@USER_ID>`
