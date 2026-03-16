---
name: tool-optimizer
description: 工具呼叫優化 - 快取、批次、並行工具呼叫以提升效率
color: "#10B981"
---

## 功能說明

優化工具呼叫以減少 API 消耗、提升速度。

## 工具

### 1. tool_cache_get - 取得快取

檢查是否有可用的快取結果，避免重複呼叫。

```
用戶：「這個函數是做什麼的」
AI：→ tool_cache_get(key: "read:src/utils.ts")
```

- 如果有快取，直接回傳
- 如果沒有，回傳 null 並繼續執行

### 2. tool_cache_set - 設定快取

將工具輸出存入快取，供後續使用。

```
AI：→ tool_cache_set(key: "read:src/utils.ts", value: "function hello() {...}", ttl: 3600)
```

### 3. tool_batch - 批次執行

合併多個獨立工具呼叫為一次執行。

```
用戶：「列出 src 和 tests 目錄的檔案」
AI：→ tool_batch(tools: [
  { name: "glob", args: { pattern: "src/**/*" }},
  { name: "glob", args: { pattern: "tests/**/*" }}
])
```

### 4. tool_parallel - 並行執行

自動偵測獨立工具並並行執行。

```
用戶：「搜尋所有檔案中的 TODO 並列出 js 檔案」
AI：→ tool_parallel(tools: [
  { name: "grep", args: { pattern: "TODO" }},
  { name: "glob", args: { pattern: "**/*.js" }}
])
```

## 自動優化時機

### AI 應主動快取

1. **讀取檔案** - `read` 工具結果可快取 5-10 分鐘
2. **搜尋檔案** - `grep`/`glob` 結果可快取 2-5 分鐘
3. **靜態查詢** - 任何不會變動的資訊

### AI 應批次執行

- 多個 `glob` 呼叫 → 合併為一個正則表達式
- 多個 `grep` 呼叫 → 使用 `-e` 合併
- 多個 `read` 呼叫 → 一次讀取

### AI 應並行執行

- 同時需要 `grep` + `glob` + `read`
- 先執行 `grep`/`glob` 找到檔案，再讀取
- 無依賴的工具呼叫應並行

### AI 應避免的工具呼叫

| 情境                | 原因             |
| ------------------- | ---------------- |
| 用戶只要求思考/分析 | 無需工具即可回覆 |
| 簡單問答            | 可用已有知識回答 |
| 檔案已讀取過        | 檢查快取後再決定 |
| 可從上下文推斷      | 不需要搜尋       |

### AI 應該呼叫的情況

- ✅ 需要讀取具體檔案內容
- ✅ 需要搜尋程式碼
- ✅ 需要執行命令
- ✅ 用戶明確要求操作

### 避免過度工具呼叫

| 問題                   | 解決             |
| ---------------------- | ---------------- |
| 一次讀取大量檔案       | 只讀取當下需要的 |
| 預先讀取可能需要的檔案 | 延遲到真正需要時 |
| 重複搜尋相同關鍵字     | 使用快取         |
| 搜尋結果過多           | 限制範圍或數量   |

## 快取策略

| 工具類型   | 建議 TTL | 原因         |
| ---------- | -------- | ------------ |
| read       | 300-600s | 檔案可能修改 |
| grep/glob  | 120-300s | 檔案系統變動 |
| webfetch   | 3600s    | 內容相對穩定 |
| memory\_\* | 86400s   | 記憶很少變動 |

## 實作

```typescript
// 快取 store
const toolCache = new Map<string, { value: any; expiry: number }>()

// 批次呼叫
async function toolBatch(tools: ToolCall[]): Promise<ToolResult[]> {
  // 合併參數，減少 API 消耗
}

// 並行呼叫
async function toolParallel(tools: ToolCall[]): Promise<ToolResult[]> {
  return Promise.all(tools.map((t) => execute(t)))
}
```

## 效益

- **快取**：重複查詢 0 API 消耗
- **批次**：N 個工具 → 1 次呼叫
- **並行**：依賴鏈最小化，總時間 = 最長路徑

---

## 快速決策流程

```
收到用戶請求
    ↓
[是否需要工具？]
    ├─ 否：直接回覆
    └─ 是：↓
        [結果是否可推斷？]
            ├─ 是：不用工具
            └─ 否：↓
                [是否已快取？]
                    ├─ 是：返回快取
                    └─ 否：↓
                        [可批次？]
                            ├─ 是：tool_batch
                            └─ 否：↓
                                [可並行？]
                                    ├─ 是：tool_parallel
                                    └─ 否：直接執行
```

---

## 最佳實踐

### 快取鍵命名規範

```
{工具名}:{關鍵參數}:{專案ID}
例：
read:src/utils.ts:{project_id}
grep:TODO:{project_id}
glob:**/*.ts:{project_id}
```

### TTL 選擇原則

| 資料類型  | TTL    | 失效時機      |
| --------- | ------ | ------------- |
| 檔案內容  | 300s   | 編輯後        |
| 搜尋結果  | 120s   | 新增/刪除檔案 |
| 列表結果  | 180s   | 檔案變動      |
| API 結果  | 3600s  | 回應穩定      |
| 設定/配置 | 86400s | 明確變更      |

### 批次合併規則

| 工具 | 合併方式                     |
| ---- | ---------------------------- |
| glob | 用 `{}` 或 `\|` 合併 pattern |
| grep | 用 `-e` 合併多個 pattern     |
| read | 用陣列一次讀取多個檔案       |
| edit | 依賴順序，無法合併           |

---

## 優化範例

### 搜尋並讀取（優化前）

```
用戶：「找出所有 useState 並讀取相關檔案」
AI：→ grep "useState"
    → 讀取找到的檔案
```

### 搜尋並讀取（優化後）

```
用戶：「找出所有 useState 並讀取相關檔案」
AI：→ tool_parallel([
    { name: "grep", args: { pattern: "useState" }},
    { name: "glob", args: { pattern: "src/**/*.{ts,tsx}" }}
  ])
  → tool_batch([讀取找到的檔案])
```

### 多次讀取同一檔案（優化後）

```
用戶：「這個函數是做什麼的」「再看一下另一個函數」
AI：→ tool_cache_get(key: "read:src/utils.ts")
    → 有快取：直接返回
    → 無快取：讀取並快取
```
