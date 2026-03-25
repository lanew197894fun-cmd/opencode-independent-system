# API 金鑰資訊

以下是已整合的免費/低成本 API 服務：

| 服務 | 環境變數 | Base URL | 免費額度 | 速度 |
|------|----------|----------|----------|------|
| **Groq** | `GROQ_API_KEY` | `https://api.groq.com/openai/v1` | 30 requests/min | 極快 (GPU 加速) |
| **Together AI** | `TOGETHER_API_KEY` | `https://api.together.ai/v1` | $5 credit | 中等 |
| **OpenRouter** | `OPENROUTER_API_KEY` | `https://openrouter.ai/api/v1` | 部分免費模型 | 變化 |
| **DeepInfra** | `DEEPINFRA_API_KEY` | `https://api.deepinfra.com/v1/openai` | 免費額度 | 中等 |
| **Cerebras** | `CEREBRAS_API_KEY` | `https://api.cerebras.ai/v1` | 免費額度 | 極快 (Wafer Scale) |
| **Venice AI** | `VENICE_ADMIN_KEY` 或 `VENICE_API_KEY` | `https://api.venice.ai/api/v1` | ? | 中等 |
| **Ollama** | - | `http://127.0.0.1:11434/v1` | 完全免費 | 本地速度 |

## 設定方式

### 1. 環境變數（推薦）：
```bash
export GROQ_API_KEY="gsk_xxxx"
export TOGETHER_API_KEY="xxxx"
export VENICE_ADMIN_KEY="your-key"
```

### 2. 官方設定檔 (`~/.config/opencode/opencode.json`):
```json
{
  "model": "groq/llama-3.3-70b-versatile",
  "provider": {
    "groq": {
      "options": {
        "apiKey": "your-key"
      }
    }
  }
}
```

### 測試連接

```bash
# 測試 Groq
curl -s "https://api.groq.com/openai/v1/models" -H "Authorization: Bearer $GROQ_API_KEY"

# 測試 Venice
curl -s "https://api.venice.ai/api/v1/models" -H "Authorization: Bearer $VENICE_ADMIN_KEY"

# 測試 Ollama（需先啟動服務）
curl -s "http://127.0.0.1:11434/api/tags"
```

## 更新記錄

| 日期 | 更新內容 |
|------|----------|
| 2026-03-23 | 創建 API 金鑰資訊文件 |
| 2026-03-23 | 添加 Venice AI 提供者支援 |