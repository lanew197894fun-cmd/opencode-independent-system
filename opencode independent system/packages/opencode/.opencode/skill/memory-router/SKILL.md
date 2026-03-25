---
name: memory-router
description: AI 自動判斷使用哪個記憶系統的決策邏輯（已整合進 memory-pro）
---

# memory-router (已整合進 memory-pro)

路由邏輯已內建到 memory-pro 統一記憶系統。

## 路由決策（memory-pro 自動處理）

| 查詢類型                   | 引擎          |
| -------------------------- | ------------- |
| 簡單關鍵字                 | 本地 Markdown |
| 抽象概念（類似的、之前的） | 向量搜尋      |
| 明確指定                   | 強制參數      |

## 使用方式

使用 memory-pro 的統一 API，系統自動判斷：

- `memory_recall(keywords: ["telegram"])` → 本地
- `memory_recall(keywords: ["類似的錯誤"])` → 向量
- `memory_recall(keywords: [...], forceLocal: true)` → 強制本地
- `memory_recall(keywords: [...], forceVector: true)` → 強制向量
