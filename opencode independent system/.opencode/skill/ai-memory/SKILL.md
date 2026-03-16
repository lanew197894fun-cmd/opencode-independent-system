---
name: ai-memory
description: AI 長期記憶 - 跨對話記憶（技術經驗、專案事實）
color: "#9C27B0"
---

# AI 長期記憶

## 與 user-rules 的區別

| 類型       | 內容               | 位置      |
| ---------- | ------------------ | --------- |
| user-rules | 用戶偏好、互動方式 | SKILL.md  |
| ai-memory  | 技術經驗、專案事實 | JSON 檔案 |

## 記憶類型

| 類型     | 範例                       |
| -------- | -------------------------- |
| fact     | 「這是 Next.js 專案」      |
| decision | 「用 pnpm 不用 npm」       |
| pattern  | 「那個模組常有 type 問題」 |

## 工具

- `memory_store` - 儲存
- `memory_recall` - 檢索
- `memory_forget` - 刪除

## 時機

- 修復 bug 後 → 儲存經驗
- 發現模式 → 儲存 pattern
- `/lesson` 觸發時 → 儲存學習

## 簡潔原則

- 每次 < 500 字元
- 避免重複
- 用完更新 user-rules 偏好
