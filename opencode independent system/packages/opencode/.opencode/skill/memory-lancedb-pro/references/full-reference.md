# memory-lancedb-pro Full Technical Reference

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   index.ts (Entry Point)                │
│  Plugin Registration · Config Parsing · Lifecycle Hooks │
└────────┬──────────┬──────────┬──────────┬───────────────┘
         │          │          │          │
    ┌────▼───┐ ┌────▼───┐ ┌───▼────┐ ┌──▼──────────┐
    │ store  │ │embedder│ │retriever│ │   scopes    │
    │ .ts    │ │ .ts    │ │ .ts    │ │    .ts      │
    └────────┘ └────────┘ └────────┘ └─────────────┘
```

## Database Schema

LanceDB table `memories`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Primary key |
| `text` | string | Memory text (FTS indexed) |
| `vector` | float[] | Embedding vector |
| `category` | string | preference/fact/decision/entity/other |
| `scope` | string | Scope identifier (e.g., global, agent:main) |
| `importance` | float | Importance score 0–1 |
| `timestamp` | int64 | Creation timestamp (ms) |
| `metadata` | string (JSON) | Extended metadata |

## Hybrid Retrieval Pipeline

```
Query → embedQuery() ─┐
                       ├─→ RRF Fusion → Rerank → Filter → Results
Query → BM25 FTS ─────┘
```

### Scoring Formula

- **Vector Score**: Cosine similarity (0-1)
- **BM25 Score**: TF-IDF based, normalized
- **Fusion**: `(vectorScore × 0.7) + (bm25Score × 0.3)`
- **Rerank**: Cross-encoder improves relevance

## Weibull Decay

Composite score = Recency (40%) + Frequency (30%) + Intrinsic (30%)

```typescript
recency = Math.exp(-lambda * Math.pow(daysSince, beta))
```

### Tier Parameters

| Tier | β (shape) | Floor |
|------|------------|-------|
| Core | 0.8 | 0.9 |
| Working | 1.0 | 0.7 |
| Peripheral | 1.3 | 0.5 |

## Embedding Providers

| Provider | Model | Dimensions | Notes |
|----------|-------|------------|-------|
| Jina | jina-embeddings-v5-text-small | 1024 | Recommended |
| OpenAI | text-embedding-3-small | 1536 | |
| Ollama | mxbai-embed-large | 1024 | Local |

## Smart Extraction Categories

| Category | Stored As | Dedup Behavior |
|----------|-----------|----------------|
| Profile | fact | Always merge |
| Preferences | preference | Conditional |
| Entities | entity | Conditional |
| Events | decision | Append-only |
| Cases | fact | Append-only |
| Patterns | other | Conditional |

## CLI Commands

```bash
openclaw memory-pro list [--scope global]
openclaw memory-pro search "query"
openclaw memory-pro stats
openclaw memory-pro delete <id>
openclaw memory-pro export --output memories.json
openclaw memory-pro import memories.json
openclaw memory-pro upgrade
openclaw memory-pro migrate
```
