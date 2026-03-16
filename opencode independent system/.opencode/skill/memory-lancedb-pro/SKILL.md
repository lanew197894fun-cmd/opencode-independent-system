---
name: memory-lancedb-pro
description: OpenCode 長期記憶系統 - Hybrid檢索 + 6類別 Smart Extraction + Weibull 衰減生命周期
---

# memory-lancedb-pro 使用指引

讓 OpenCode 具備持久記憶能力的插件。

## 用戶偏好（自動載入）

偏好檔案：`.opencode/preferences.json`

當用戶表達偏好時，自動更新到此檔案：

- `language`: 語言偏好（如：繁體中文）
- `style`: 風格偏好
- `skillDescription`: 技能說明語言
- `avoidSimplified`: 是否避免簡體字

## 觸發關鍵字

`memory-lancedb-pro`、`memory pro`、`memory_recall`、`memory_store`、`help me configure memory`

---

## 快速配置

```json
{
  "plugins": {
    "slots": { "memory": "memory-lancedb-pro" },
    "entries": {
      "memory-lancedb-pro": {
        "enabled": true,
        "config": {
          "embedding": {
            "provider": "openai-compatible",
            "apiKey": "${OPENAI_API_KEY}",
            "model": "text-embedding-3-small"
          },
          "autoCapture": true,
          "autoRecall": true,
          "smartExtraction": true,
          "sessionMemory": { "enabled": false }
        }
      }
    }
  }
}
```

---

## 核心工具

| 工具            | 用途                                                                |
| --------------- | ------------------------------------------------------------------- |
| `memory_store`  | 儲存記憶（category: preference/fact/decision/entity/event/pattern） |
| `memory_recall` | 檢索記憶（hybrid 向量+BM25）                                        |
| `memory_forget` | 刪除記憶                                                            |
| `memory_update` | 更新記憶                                                            |

---

## CLI 命令

```bash
openclaw memory-pro list [--scope global]
openclaw memory-pro search "關鍵詞"
openclaw memory-pro stats
openclaw memory-pro delete <id>
openclaw memory-pro export --output backup.json
openclaw memory-pro import backup.json
```

---

## 運作原理

1. **Hybrid 檢索**：向量搜尋 + BM25 全文搜尋 → RRF 融合 → Cross-Encoder 重排
2. **Smart Extraction**：LLM 自動分類為 6 類別（profile/preference/entity/event/case/pattern）
3. **生命周期**：Weibull 衰減 + 3 層級（Core/Working/Peripheral）自動升降級

---

## 驗證

```bash
openclaw config validate
openclaw gateway restart
openclaw plugins info memory-lancedb-pro
```

---

## 限制

- 單一記憶 < 500 字元
- 避免重複儲存相似內容
- 定期備份：`openclaw memory-pro export`

## 自動記憶偏好

當用戶表達偏好時（如：「我喜歡繁體中文」、「不要用簡體字」），自動更新 `preferences.json`。
