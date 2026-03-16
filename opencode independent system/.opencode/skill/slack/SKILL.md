---
name: slack
description: Slack 控制 - 訊息回應、釘選、管理訊息成員資訊
metadata:
  openclaw:
    emoji: "💬"
    requires:
      config: ["channels.slack"]
---

# Slack 操作

使用 `slack` 進行回應、訊息管理、釘選、取得成員資訊。

---

## 觸發關鍵字

| 關鍵字     | 動作            |
| ---------- | --------------- |
| Slack 回應 | 對訊息反應      |
| 釘選訊息   | 釘選訊息        |
| 發送 Slack | 發送訊息        |
| 讀取訊息   | 讀取 Slack 訊息 |

---

## 需收集的輸入

- `channelId` 和 `messageId`（Slack 訊息時間戳，如 `1712023032.1234`）
- 回應使用 `emoji`（Unicode 或 `:name:`）
- 發送訊息使用 `to`（`channel:<id>` 或 `user:<id>`）和 `content`

---

## 動作群組

| 群組       | 預設 | 說明                |
| ---------- | ---- | ------------------- |
| reactions  | 開啟 | 回應 + 列表反應     |
| messages   | 開啟 | 讀取/發送/編輯/刪除 |
| pins       | 開啟 | 釘選/取消/列表      |
| memberInfo | 開啟 | 成員資訊            |
| emojiList  | 開啟 | 自訂 emoji 列表     |

---

## 動作範例

### 回應訊息

```json
{
  "action": "react",
  "channelId": "C123",
  "messageId": "1712023032.1234",
  "emoji": "✅"
}
```

### 列表反應

```json
{
  "action": "reactions",
  "channelId": "C123",
  "messageId": "1712023032.1234"
}
```

### 發送訊息

```json
{
  "action": "sendMessage",
  "to": "channel:C123",
  "content": "Hello from OpenClaw"
}
```

### 編輯訊息

```json
{
  "action": "editMessage",
  "channelId": "C123",
  "messageId": "1712023032.1234",
  "content": "Updated text"
}
```

### 刪除訊息

```json
{
  "action": "deleteMessage",
  "channelId": "C123",
  "messageId": "1712023032.1234"
}
```

### 讀取近期訊息

```json
{
  "action": "readMessages",
  "channelId": "C123",
  "limit": 20
}
```

### 釘選訊息

```json
{
  "action": "pinMessage",
  "channelId": "C123",
  "messageId": "1712023032.1234"
}
```

### 取消釘選

```json
{
  "action": "unpinMessage",
  "channelId": "C123",
  "messageId": "1712023032.1234"
}
```

### 列表釘選

```json
{
  "action": "listPins",
  "channelId": "C123"
}
```

### 成員資訊

```json
{
  "action": "memberInfo",
  "userId": "U123"
}
```

### Emoji 列表

```json
{
  "action": "emojiList"
}
```

---

## 應用場景

- 使用 ✅ 標記完成任務
- 釘選關鍵決策或每週狀態更新
