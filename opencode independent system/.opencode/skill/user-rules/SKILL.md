---
name: user-rules
description: 用戶核心規則 - 偏好、習慣、互動方式（最高優先級）
color: "#FF6B6B"
autoLoad: true
priority: 100
---

# 用戶核心規則

## 當前偏好

| 欄位             | 值                       |
| ---------------- | ------------------------ |
| language         | 繁體中文                 |
| style            | 自然語言 + 少許技術術語  |
| skillDescription | 慣性顯示繁體中文         |
| avoidSimplified  | true                     |
| debugMode        | 主動檢查而非索要錯誤訊息 |

---

## 互動原則

1. **語言** - 使用繁體中文回覆
2. **簡潔** - 保持簡潔，重點先行
3. **Debug** - 描述問題時主動檢查，不要一直索要錯誤訊息

---

## 程式碼規範

- 禁止新增註解（除非用戶要求）
- 使用 early return，避免 else
- 遵循專案現有風格

---

## 檔案位置

| 類型     | 位置                                    |
| -------- | --------------------------------------- |
| 用戶規則 | `~/.opencode/skill/user-rules/SKILL.md` |
| 專案規則 | `{專案}/AGENTS.md`                      |
| 工作記憶 | `{專案}/AI_MEMORY.json`                 |
