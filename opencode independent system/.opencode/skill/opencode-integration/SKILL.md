---
name: opencode-integration
description: OpenCode 整合 - 插件功能與安裝器管理
color: "#7C3AED"
---

## OpenCode 插件系統 (已遷移至獨立架構)

### 插件位置

```
/home/reamaster/opencode-manager/opencode independent system/independent-architecture/extensions/
```

### 安裝器位置

```
/home/reamaster/opencode-manager/opencode independent system/independent-architecture/OpenCodeInstaller/
```

### 插件清單

| 插件               | 功能                   |
| ------------------ | ---------------------- |
| memory-core        | 檔案式記憶搜尋         |
| memory-lancedb     | 向量資料庫儲存         |
| memory-lancedb-pro | Hybrid search + Rerank |
| voice-call         | 語音通話               |
| bluebubbles        | iMessage 管理          |
| acpx               | AC 擴展                |
| feishu             | 飛書                   |
| googlechat         | Google Chat            |
| irc                | IRC                    |
| matrix             | Matrix                 |
| mattermost         | Mattermost             |
| msteams            | Microsoft Teams        |
| nostr              | Nostr                  |
| twitch             | Twitch                 |
| zalo               | Zalo                   |

---

## 大門守衛機制

### 插件審核流程

所有插件需經過「大门+守衛」審核才能啟用：

```
插件請求 → MCP 大門(mcporter) → 安全守衛(security-auto) → 放行/拒絕
```

### 大門 - MCP 管理器

使用 `mcporter` 管理插件啟用與驗證：

```bash
# 列表可用插件
mcporter list

# 驗證插件配置
mcporter config validate <plugin-name>
```

### 守衛 - 安全掃描

使用 `security-auto` 進行安全審計：

```bash
# 啟動安全掃描
/security-start

# 插件安全檢查
/dep-analyze <plugin-name>

# 沙盤測試
/sandbox-run <plugin-name>
```

---

## 觸發方式

- 手動：`/openclaw`
- 語義：「搜尋對話歷史」「存取知識庫」「使用插件」

---

## 使用方式

### 啟用插件流程

```bash
# 1. 大門驗證
mcporter config add openclaw.<plugin-name>

# 2. 安全守衛掃描
/dep-analyze <plugin-name>

# 3. 沙盤測試
/sandbox-run <plugin-name>

# 4. 確認放行
# (自動觸發或手動確認)
```

### 直接存取

```bash
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

---

## 遷移記錄

| 日期       | 動作           |
| ---------- | -------------- |
| 2026-03-25 | 遷移至獨立架構 |

**原位置**: `/home/reamaster/opencode-manager/openclaw/`  
**新位置**: `/home/reamaster/opencode-manager/opencode independent system/independent-architecture/`

Base directory for this skill: .opencode/skill/openclaw-integration
