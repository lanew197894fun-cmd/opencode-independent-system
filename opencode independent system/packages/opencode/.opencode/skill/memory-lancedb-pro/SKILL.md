---
name: memory-lancedb-pro
description: This skill should be used when working with memory-lancedb-pro, a production-grade long-term memory MCP plugin for OpenClaw AI agents. Use when installing, configuring, or using any feature of memory-lancedb-pro including Smart Extraction, hybrid retrieval, memory lifecycle management, multi-scope isolation, self-improvement governance, or any MCP memory tools (memory_recall, memory_store, memory_forget, memory_update, memory_stats, memory_list, self_improvement_log, self_improvement_extract_skill, self_improvement_review).
---

# memory-lancedb-pro

Production-grade long-term memory system (v1.1.0-beta.8) for OpenClaw AI agents. Provides persistent, intelligent memory storage using LanceDB with hybrid vector + BM25 retrieval, LLM-powered Smart Extraction, Weibull decay lifecycle, and multi-scope isolation.

---

## Quick Start

### Installation

```bash
# Install via npm
npm i memory-lancedb-pro@beta

# Or clone from GitHub
git clone -b master https://github.com/CortexReach/memory-lancedb-pro.git plugins/memory-lancedb-pro
```

### Configuration (openclaw.json)

```json
{
  "plugins": {
    "slots": { "memory": "memory-lancedb-pro" },
    "entries": {
      "memory-lancedb-pro": {
        "enabled": true,
        "config": {
          "embedding": {
            "apiKey": "${JINA_API_KEY}",
            "model": "jina-embeddings-v5-text-small",
            "baseURL": "https://api.jina.ai/v1",
            "dimensions": 1024
          },
          "autoCapture": true,
          "autoRecall": true,
          "smartExtraction": true,
          "llm": {
            "apiKey": "${OPENAI_API_KEY}",
            "model": "gpt-4o-mini"
          }
        }
      }
    }
  }
}
```

Restart gateway after config change:
```bash
openclaw gateway restart
```

---

## MCP Tools

### Core Tools (auto-registered)

| Tool | Description |
|------|-------------|
| `memory_recall` | Search long-term memory via hybrid retrieval |
| `memory_store` | Save information to long-term memory |
| `memory_forget` | Delete memories |
| `memory_update` | Update existing memory |

### Usage Examples

```typescript
// Store a memory
await memory_store({
  text: "User prefers dark mode",
  category: "preference",
  importance: 0.8
})

// Recall memories
await memory_recall({
  query: "user preferences",
  limit: 5
})

// Update memory
await memory_update({
  memoryId: "uuid-here",
  text: "Updated content"
})

// Forget memory
await memory_forget({
  query: "old preference"
})
```

---

## Configuration Reference

### Embedding
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `apiKey` | string | — | API key (supports `${ENV_VAR}`) |
| `model` | string | — | Model identifier |
| `baseURL` | string | provider default | API endpoint |
| `dimensions` | number | provider default | Vector dimensionality |

### Top-Level
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `dbPath` | string | `~/.openclaw/memory/lancedb-pro` | LanceDB data directory |
| `autoCapture` | boolean | true | Auto-extract memories after agent replies |
| `autoRecall` | boolean | false | Inject memories before agent processing |
| `smartExtraction` | boolean | true | LLM-powered 6-category extraction |

### Retrieval
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `mode` | string | `hybrid` | `hybrid` / `vector` |
| `vectorWeight` | number | 0.7 | Weight for vector search |
| `bm25Weight` | number | 0.3 | Weight for BM25 full-text search |
| `rerank` | string | `cross-encoder` | Reranking strategy |

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| Plugin not loading | Add to `plugins.allow` array |
| Env vars not working | Set in gateway process, not shell |
| Embedding errors | Check `baseURL` ends with `/v1` |

---

## See Also

- Full reference: [references/full-reference.md](references/full-reference.md)
- GitHub: https://github.com/CortexReach/memory-lancedb-pro