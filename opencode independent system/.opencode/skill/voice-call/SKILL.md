---
name: voice-call
description: 語音通話 - 透過 OpenClaw voice-call 插件
metadata:
  openclaw:
    emoji: "📞"
    skillKey: "voice-call"
    requires:
      config: ["plugins.entries.voice-call.enabled"]
---

# 語音通話

使用 voice-call 插件開始或檢查通話。

---

## 觸發關鍵字

| 關鍵字   | 動作     |
| -------- | -------- |
| 開始通話 | 發起通話 |
| 語音通話 | 語音呼叫 |

---

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall status --call-id <id>
```

---

## Tool

使用 `voice_call`：

- `initiate_call`
- `continue_call`
- `speak_to_user`
- `end_call`
- `get_status`

---

## 設定

- Twilio：`provider: "twilio"` + accountSid/authToken + fromNumber
- Telnyx：`provider: "telnyx"` + apiKey/connectionId + fromNumber
- Plivo：`provider: "plivo"` + authId/authToken + fromNumber
- 開發：`provider: "mock"`
