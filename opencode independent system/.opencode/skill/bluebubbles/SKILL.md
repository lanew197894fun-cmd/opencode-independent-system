---
name: bluebubbles
description: BlueBubbles iMessage - 發送訊息、管理對話
metadata:
  openclaw:
    emoji: "🫧"
    requires:
      config: ["channels.bluebubbles"]
---

# BlueBubbles iMessage

使用 `message` tool，channel 設為 `"bluebubbles"`。

---

## 觸發關鍵字

| 關鍵字        | 動作         |
| ------------- | ------------ |
| 傳送 iMessage | 發送訊息     |
| iMessage 回應 | Tapback 回應 |
| 傳送附件      | 發送附件     |

---

## 需收集的輸入

- `target`（優先使用 `chat_guid:...`，或 `+15551234567`、`user@example.com`）
- `message` 文字
- `messageId`（回應/編輯/收回）
- 附件 `path` 或 `buffer`

---

## 動作範例

### 發送訊息

```json
{
  "action": "send",
  "channel": "bluebubbles",
  "target": "+15551234567",
  "message": "hello from OpenClaw"
}
```

### 回應 (tapback)

```json
{
  "action": "react",
  "channel": "bluebubbles",
  "target": "+15551234567",
  "messageId": "<message-guid>",
  "emoji": "❤️"
}
```

### 編輯訊息

```json
{
  "action": "edit",
  "channel": "bluebubbles",
  "target": "+15551234567",
  "messageId": "<message-guid>",
  "message": "updated text"
}
```

### 收回訊息

```json
{
  "action": "unsend",
  "channel": "bluebubbles",
  "target": "+15551234567",
  "messageId": "<message-guid>"
}
```

### 回覆訊息

```json
{
  "action": "reply",
  "channel": "bluebubbles",
  "target": "+15551234567",
  "replyTo": "<message-guid>",
  "message": "replying to that"
}
```

### 發送附件

```json
{
  "action": "sendAttachment",
  "channel": "bluebubbles",
  "target": "+15551234567",
  "path": "/tmp/photo.jpg",
  "caption": "here you go"
}
```

### iMessage 效果

```json
{
  "action": "sendWithEffect",
  "channel": "bluebubbles",
  "target": "+15551234567",
  "message": "big news",
  "effect": "balloons"
}
```

---

## 注意事項

- 需要 gateway 設定 `channels.bluebubbles`
- 群組聊天優先使用 `chat_guid`
- 某些功能依賴 macOS 版本
