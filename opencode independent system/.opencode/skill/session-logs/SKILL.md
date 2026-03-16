---
name: session-logs
description: 搜尋與分析會話日誌 - 使用 jq
metadata:
  openclaw:
    emoji: "📜"
    requires:
      bins: ["jq", "rg"]
---

# 會話日誌搜尋

搜尋完整對話歷史。

---

## 觸發關鍵字

| 關鍵字   | 動作     |
| -------- | -------- |
| 之前說過 | 搜尋歷史 |
| 對話歷史 | 搜尋日誌 |

---

## 位置

`~/.openclaw/agents/<agentId>/sessions/`

- `sessions.json` - 索引
- `<session-id>.jsonl` - 完整記錄

---

## 結構

- `type`: "session" 或 "message"
- `timestamp`: ISO 時間戳
- `message.role`: "user", "assistant", "toolResult"
- `message.content[]`: 文字、思考、工具呼叫
- `message.usage.cost.total`: 成本

---

## 常用查詢

### 列表所有會話

```bash
for f in ~/.openclaw/agents/<agentId>/sessions/*.jsonl; do
  date=$(head -1 "$f" | jq -r '.timestamp' | cut -dT -f1)
  size=$(ls -lh "$f" | awk '{print $5}')
  echo "$date $size $(basename $f)"
done | sort -r
```

### 搜尋關鍵字

```bash
rg -l "keyword" ~/.openclaw/agents/<agentId>/sessions/*.jsonl
```

### 取得用戶訊息

```bash
jq -r 'select(.message.role == "user") | .message.content[]? | select(.type == "text") | .text' <session>.jsonl
```

### 取得成本

```bash
jq -s '[.[] | .message.usage.cost.total // 0] | add' <session>.jsonl
```

### 工具使用分析

```bash
jq -r '.message.content[]? | select(.type == "toolCall") | .name' <session>.jsonl | sort | uniq -c | sort -rn
```
