---
name: preference-persist
description: 偏好持久化 - 確保長對話不忘記用戶偏好
color: "#4CAF50"
---

# 偏好持久化機制

## 問題

AI 思考太久 → 遺忘偏好 → 回覆不符合用戶期望

## 解決方案

### 1. 快速偏好檔（每次回覆前載入）

每次 AI 回覆前，先讀取 `.opencode/preferences/quick-ref.json`:

```json
{
  "language": "繁體中文",
  "avoidSimplified": true,
  "style": "簡潔",
  "debugMode": "主動檢查"
}
```

### 2. Session 偏好鉤子

```
對話開始 → 載入偏好
每 5 個回合 → 重新載入偏好
對話結束 → 儲存偏好變更
```

### 3. 強制注入 System Prompt

在系統 Prompt 中加入：

```
## 用戶偏好（必須遵守）
- 語言：繁體中文
- 避免：簡體字、英文（技術術語除外）
- 風格：簡潔、重點先行
- Debug：主動檢查，不索要錯誤訊息
```

---

## 實作檔案

```
.opencode/preferences/
├── quick-ref.json    # 快速參考（每次載入）
├── session.json      # 對話中的臨時偏好
└── history.json     # 偏好變更歷史
```

---

## 配置

```json
{
  "reminder_interval": 5,
  "auto_inject": true,
  "load_on_start": true,
  "validate_response": true
}
```

---

## 使用方式

```bash
# 手動刷新偏好
/preference-reload

# 查看當前偏好
/preference-show
```

Base directory for this skill: .opencode/skill/preference-persist
