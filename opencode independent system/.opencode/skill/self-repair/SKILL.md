---
name: self-repair
description: OpenCode 自我修復技能 - 自動檢測並修復系統問題
color: "#4CAF50"
---

## 用途

執行 OpenCode 自我修復功能，檢測並修復系統問題。

## 觸發方式

1. **手動觸發**：

   ```
   /self-repair
   ```

2. **語義觸發**：
   - 「自我修復」
   - 「執行修復」
   - 「檢查系統」
   - 「AI_DEBUG」
   - 「除錯模式」

## 執行內容

### 1. 系統健康檢查

- 記憶體使用率
- Bun 版本驗證（確保正確版本）
- TypeScript 編譯檢查

### 2. 問題分析

- 分析 TypeScript 錯誤類型
- 檢查 console.log/debugger
- 檢查 TODO/FIXME 註解

### 3. 自動修復

- 執行 bun install
- 清理建置緩存
- 提供修復建議

### 4. 生成報告

- 顯示詳細錯誤資訊
- 提供具體修復步驟

## 常見錯誤類型

- `TS7006`: 缺少類型註解
- `TS2339`: 缺少物件屬性
- `TS2307`: 缺少模組（執行 bun install）
- `TS2694`: 匯出/匯入問題

## 範例輸出

```
[AI_DEBUG] 系統健康檢查完成
- 記憶體: 45.2%
- Bun 版本: 1.3.9 (expected: 1.3.9)
- TypeScript: 2 errors

[AI_DEBUG] 發現問題:
- TypeScript type check failed (2 errors)

[AI_DEBUG] 修復建議:
- 缺少類型註解 - add types to function parameters
- 執行 bun install 安裝依賴
```

## 檢查清單

- [ ] 記憶體使用率 < 85%
- [ ] Bun 版本正確
- [ ] TypeScript 編譯無錯誤
- [ ] 依賴完整
- [ ] 無 console.log/debugger
- [ ] TODO/FIXME 註解已審視

Base directory for this skill: .opencode/skill/self-repair
