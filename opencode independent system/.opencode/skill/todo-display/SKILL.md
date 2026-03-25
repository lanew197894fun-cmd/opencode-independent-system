---
name: todo-display
description: 使用 TODO 顯示進度 - 任務追蹤與進度顯示
color: "#2196F3"
---

# TODO 顯示進度

## 功能

追蹤使用者提問的處理進度，用 TODO 格式顯示。

## 使用方式

```
## TODO 進度追蹤

### 任務列表
- [ ] 接收用戶問題
- [x] 分析問題
- [ ] 判斷是否需要搜索
- [ ] 執行搜索
- [ ] 生成回覆
- [ ] 驗證回覆品質

### 當前任務
[ 3/6 ] 判斷是否需要搜索
```

---

## 實作邏輯

### 1. 建立任務追蹤

```typescript
interface Task {
  id: string
  userQuery: string
  status: "pending" | "in_progress" | "completed" | "skipped"
  startTime: number
  steps: TaskStep[]
}

interface TaskStep {
  name: string
  status: "pending" | "in_progress" | "completed" | "skipped"
  detail?: string
}
```

### 2. 預設步驟

| 步驟        | 說明             |
| ----------- | ---------------- |
| 1. 接收問題 | 記錄用戶原始問題 |
| 2. 分析問題 | 理解意圖與上下文 |
| 3. 判斷搜索 | 決定是否需要搜索 |
| 4. 執行搜索 | 進行資訊檢索     |
| 5. 生成回覆 | 整理答案         |
| 6. 驗證品質 | 檢查是否符合偏好 |

### 3. 顯示格式

```markdown
## 📋 處理進度

### 🔍 [問題] 用戶問題內容

**進度**: [ 3/6 ] 正在執行

| 步驟        | 狀態 |
| ----------- | ---- |
| 1. 接收問題 | ✅   |
| 2. 分析問題 | ✅   |
| 3. 判斷搜索 | 🔄   |
| 4. 執行搜索 | ⏳   |
| 5. 生成回覆 | ⏳   |
| 6. 驗證品質 | ⏳   |

**預計動作**: 正在分析是否需要搜索相關資訊...
```

---

## 配置

```json
{
  "enabled": true,
  "showInProgress": true,
  "autoAdvance": true,
  "emojiStyle": true,
  "steps": ["接收問題", "分析問題", "判斷搜索", "執行搜索", "生成回覆", "驗證品質"]
}
```

---

## 範例輸出

```
## 📋 任務追蹤

### 🔍 問題: 如何修復 TS7006 錯誤

**進度**: [ 2/6 ] 分析問題中

- [x] 1. 接收問題
- [x] 2. 分析問題
- [ ] 3. 判斷搜索
- [ ] 4. 執行搜索
- [ ] 5. 生成回覆
- [ ] 6. 驗證品質

⚡ 正在分析：檢測到 TypeScript 錯誤代碼 TS7006
```

Base directory for this skill: .opencode/skill/todo-display
