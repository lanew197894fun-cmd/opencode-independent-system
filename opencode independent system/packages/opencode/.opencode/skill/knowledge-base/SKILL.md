---
name: knowledge-base
description: 知識庫插件 - 分類記錄、搜尋、匯出、攜帶走
---

# 知識庫系統

可攜式知識管理插件，支援本地儲存、USB/雲端攜帶、分類搜尋。

---

## 功能

| 功能       | 說明                                         |
| ---------- | -------------------------------------------- |
| 分類儲存   | 修復/新增/更新/專案/討論/學習/整合/工具/問題 |
| 關鍵字搜尋 | 本地 Markdown 全文搜尋                       |
| 匯出備份   | 打包成 zip 可攜帶                            |
| 攜帶走     | USB/雲端/自訂路徑                            |

---

## 分類定義

```
.opencode/memory/
├── 修復/      # Bug fix、效能優化
├── 新增/      # 新功能、Plugin、Skill
├── 更新/      # 重構、版本升級
├── 專案/      # 專案事實（OpenClaw、AnduinOS...）
├── 討論/      # 設計決策、架構選擇
├── 學習/      # 技術心得、最佳實踐
├── 整合/      # 第三方 API
├── 工具/      # CLI 技巧
└── 問題/      # 待解決的問題
```

---

## 記錄模板

### 修復 (fix)

```markdown
# [修復] 標題

## 問題

描述問題現象

## 原因

分析根本原因

## 修復

- 變更檔案
- 變更內容

## 驗證

- typecheck 通過
- 測試結果

## 相關

- 相關檔案/技能
```

### 新增 (feature)

```markdown
# [新增] 標題

## 功能

功能描述

## 使用方式

使用範例

## 架構

相關檔案/模組

## 測試

測試結果
```

---

## 工具

### 儲存知識

```typescript
// 使用 memory_store
memory_store(
  category: "topics",
  filename: "fix-toast-notification.md",
  content: "...",
  append: false
)

// 使用 knowledge_store
knowledge_store(
  type: "fact",
  content: "[修復] 問題:xxx. 原因:xxx. 解決:xxx"
)
```

### 召回知識

```typescript
// 搜尋
memory_recall(
  keywords: ["toast", "修復"],
  category: "topics"
)

// 召回知識
knowledge_recall(query: "toast")
```

### 備份匯出

```typescript
// 本地備份
backup_local(name: "knowledge-backup")

// 同步到 USB
backup_sync(target: "/media/reamaster/USB")

// 上傳 GitHub
backup_to_github(
  repo: "user/knowledge-base",
  message: "update knowledge"
)
```

---

## 自動觸發

- 偵測「記住這個」→ 詢問是否記錄
- 偵測「知識庫」→ 召回相關知識
- 修復完成 → 建議記錄到知識庫

---

## 攜帶走

1. **本地備份**：執行 `backup_local`
2. **USB 同步**：執行 `backup_sync` 到 USB
3. **GitHub 備份**：執行 `backup_to_github`

---

## 測試與決策框架

### 測試觀察

建立 `/memory/問題/自動載入監測.md` 追蹤：

| 觀察項目       | 徵兆       |
| -------------- | ---------- |
| Toast 及時顯示 | 功能正常   |
| 當機/錯誤      | 需立即修復 |
| 模型探索意願   | 行為觀察   |
| 資源使用       | 效能指標   |

### 問題分類

| 類型     | 徵兆                 | 優先 |
| -------- | -------------------- | ---- |
| 功能異常 | Toast不顯示、當機    | 緊急 |
| 效能下降 | 變慢、記憶體飆升     | 高   |
| 行為變化 | 模型被動、依賴預載入 | 中   |

### 快速決斷表

| 情況         | 動作                |
| ------------ | ------------------- |
| Toast 不顯示 | 回滾程式碼          |
| 當機         | 查看日誌錯誤        |
| 變慢         | 調低 resourcePolicy |
| 模型被動     | 減少預載入          |
| 以上皆非     | 繼續觀察            |

### 決策流程

```
1. 收集證據 → 日誌、資源、使用者回饋
2. 分類問題 → 功能/效能/行為
3. 選擇應對 → 參考快速決斷表
4. 驗證修復 → 小範圍測試→觀察24小時
```

### 應對方案

#### 模型依賴

- 減少預載入數量（只保留 user-rules）
- 修改 system prompt 語氣
- 增加手動觸發比重

#### 效能問題

- 調降 resourcePolicy 閾值
- 增加 unload 機制
- 限制單次最大載入數

#### 錯誤/當機

- 檢查日誌 error
- 回滾程式碼
- 加入 try-catch 保護

---

## 與 memory-pro 關係

- knowledge-base 是知識管理介面
- memory-pro 是底層儲存引擎
- 兩者配合提供完整知識管理功能
