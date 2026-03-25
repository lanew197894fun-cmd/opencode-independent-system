---
name: memory-pro
description: 統一記憶系統 - 雙引擎自動路由 (本地 Markdown + 向量搜尋)
---

# memory-pro

統一記憶系統，自動判斷使用本地檔案或向量搜尋。

## 架構

```
┌─────────────────────────────────────────┐
│           memory-pro (統一 API)          │
├─────────────────────────────────────────┤
│  自動路由引擎                            │
│  ├── 簡單關鍵字 → 本地 Markdown          │
│  └── 複雜語意 → 向量搜尋 (LanceDB)       │
├─────────────────────────────────────────┤
│  工具列表                                │
│  ├── memory_recall (自動路由)           │
│  ├── memory_store                       │
│  ├── memory_stats                       │
│  ├── knowledge_store                    │
│  ├── knowledge_recall                   │
│  └── 備份/還原工具                       │
└─────────────────────────────────────────┘
```

## 路由邏輯

| 查詢類型   | 引擎 | 範例                                 |
| ---------- | ---- | ------------------------------------ |
| 簡單關鍵字 | 本地 | "telegram"、"database"、"opencode"   |
| 抽象概念   | 向量 | "類似的錯誤"、"之前的經驗"、"相關的" |
| 明確指定   | 強制 | forceLocal / forceVector 參數        |

## 工具使用

### 基本儲存

```
memory_store(
  category: "topics",
  filename: "telegram.md",
  content: "...",
  append: true
)
```

### 基本召回

```
memory_recall(
  keywords: ["telegram", "bot"],
  category: "topics"
)
```

### 強制引擎

```
memory_recall(keywords: ["..."], forceLocal: true)  # 只用本地
memory_recall(keywords: ["..."], forceVector: true) # 強制向量
```

### 知識系統

```
knowledge_store(type: "fact", content: "問題:xxx. 原因:xxx. 解決:xxx")
knowledge_store(type: "decision", content: "原則:xxx. 觸發:xxx")
knowledge_recall(query: "相關關鍵字")
```

### 狀態查看

```
memory_stats()  # 顯示本地 + 向量狀態
```

## 自動觸發

- 偵測關鍵字 → 自動 recall 相關記憶
- 偵測 "記住這個"、"知識庫"、"門紀錄"、"記錄在知識庫" → 詢問是否記為知識
- 偵測 "知識" 或 "門紀錄" → 自動召回知識

## 與 memory-lancedb-pro 關係

- memory-pro 是統一介面
- memory-lancedb-pro 是可選的向量引擎
- 安裝後會自動啟用向量搜尋功能
- 未安裝時自動降級到本地搜尋
