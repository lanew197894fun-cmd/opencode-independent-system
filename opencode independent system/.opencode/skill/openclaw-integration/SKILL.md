---
name: openclaw-integration
description: OpenClaw 功能整合 - 將 OpenClaw 的插件功能整合到 OpenCode
color: "#7C3AED"
---

## OpenClaw 插件系統

### 插件位置

```
/home/reamaster/opencode-claw/openclaw main/extensions/
```

### 記憶插件

| 插件               | 功能                   |
| ------------------ | ---------------------- |
| memory-core        | 檔案式記憶搜尋         |
| memory-lancedb     | 向量資料庫儲存         |
| memory-lancedb-pro | Hybrid search + Rerank |

### 通訊/工具插件

discord, slack, telegram, line, github, notion, obsidian, google

---

## 觸發方式

- 手動：`/openclaw`
- 語義：「搜尋對話歷史」「存取知識庫」

---

## 使用方式

### OpenClaw CLI

```bash
cd /home/reamaster/opencode-claw/openclaw\ main

# 記憶搜尋
openclaw memory search "查詢內容"

# 對話搜尋
openclaw sessions search "關鍵字"
```

### 指令腳本

```bash
bash .opencode/skills/openclaw-integration/openclaw-helper.sh search "關鍵字"
```

---

## 快取優化

### 快取策略

| 操作     | 快取 TTL     | 說明           |
| -------- | ------------ | -------------- |
| 記憶搜尋 | 3600s (1h)   | 搜尋結果可複用 |
| 對話搜尋 | 1800s (30m)  | 對話相對穩定   |
| 記憶列表 | 86400s (24h) | 很少變動       |

### 快取鍵命名

```
openclaw:memory:{query_hash}
openclaw:sessions:{keyword_hash}
openclaw:list:{type}
```

### 使用流程

```
搜尋前：
→ tool_cache_get(key: "openclaw:memory:{query}")
→ 有快取：直接返回
→ 無快取：執行搜尋 + 快取結果
```

---

## 整合 OpenCode

### 自我修復中使用

```bash
# 修復前搜尋類似問題
openclaw memory search "TS7006"

# 修復後存入經驗
openclaw memory add --content "TS7006 解決方案"
```

### 封裝為 OpenCode 工具

```typescript
export const memorySearch = tool({
  name: "openclaw_memory_search",
  description: "搜尋 OpenClaw 記憶庫",
  parameters: z.object({ query: z.string() }),
  execute: async ({ query }) => exec("openclaw memory search", [query]),
})
```

Base directory for this skill: .opencode/skill/openclaw-integration
