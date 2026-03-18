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

---

## 健康檢查工具

### 自我檢查 (memory-selfcheck.mjs)

完整能力評估：embedding 向量、Rerank、宿主模型 recall + JSON 輸出穩定性。

**腳本位置**：`~/.opencode/skill/memory-lancedb-pro/scripts/memory-selfcheck.mjs`

```bash
# 檢查配置
cd ~/.opencode/skill/memory-lancedb-pro/scripts
node memory-selfcheck.mjs --config selfcheck.json --output report.json
```

**配置範例**：

```json
{
  "embedding": {
    "apiKey": "jina_xxx",
    "baseURL": "https://api.jina.ai/v1",
    "model": "jina-embeddings-v5-text-small",
    "dimensions": 1024
  },
  "rerank": {
    "apiKey": "jina_xxx",
    "endpoint": "https://api.jina.ai/v1/rerank",
    "model": "jina-reranker-v3"
  },
  "hostModel": {
    "apiKey": "sk-xxx",
    "baseURL": "https://api.openai.com/v1",
    "model": "gpt-4.1-mini"
  }
}
```

**輸出等級**：

- `lite-safe`：基礎可用
- `balanced-default`：一般配置
- `pro-rerank`：完整功能

### 端點探測 (probe-endpoint.mjs)

測試任意 OpenAI-compatible API 是否可用。

**腳本位置**：`~/.opencode/skill/memory-lancedb-pro/scripts/probe-endpoint.mjs`

```bash
cd ~/.opencode/skill/memory-lancedb-pro/scripts

# Jina 預設
node probe-endpoint.mjs --preset jina --apiKey jina_xxx

# 自定義
node probe-endpoint.mjs --baseURL https://api.openai.com/v1 --apiKey sk-xxx --model text-embedding-3-small

# 測試 Rerank
node probe-endpoint.mjs --preset jina --apiKey jina_xxx --rerankEndpoint https://api.jina.ai/v1/rerank --rerankModel jina-reranker-v3
```

**可用 preset**：`jina`、`dashscope`、`siliconflow`、`openai`、`ollama`

### 配置驗證 (config-validate.mjs)

檢查 openclaw.json 中 memory-lancedb-pro 配置是否正確。

**腳本位置**：`~/.opencode/skill/memory-lancedb-pro/scripts/config-validate.mjs`

```bash
cd ~/.opencode/skill/memory-lancedb-pro/scripts

# 預設路徑
node config-validate.mjs

# 指定檔案
node config-validate.mjs --config /path/to/openclaw.json

# JSON 輸出 (供腳本解析)
node config-validate.mjs --json-output
```

**檢查項目**：

- 必填欄位缺失
- 數值範圍建議
- 互依賴檢查（開 rerank 需填 apiKey/endpoint/model）
- API Key 是否為占位符

---

## 一鍵安裝

從 CortexReach/toolbox 下載：

```bash
curl -fsSL https://raw.githubusercontent.com/CortexReach/toolbox/main/memory-lancedb-pro-setup/setup-memory.sh -o setup-memory.sh
bash setup-memory.sh
```

功能：

- 自動偵測已安裝/升級
- Schema filter 移除不支援的欄位
- Git auto-update
- 版本鎖定：`--ref v1.2.0`
- 乾淨執行：`--dry-run`
