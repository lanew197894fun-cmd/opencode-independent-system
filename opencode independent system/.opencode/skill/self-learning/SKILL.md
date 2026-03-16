---
name: self-learning
description: AI 自我學習系統 - 訓練個人化模型，學習用戶風格與偏好
color: "#9C27B0"
---

# 自我學習系統

讓 OpenCode 能學習用戶風格與偏好，建立個人化 AI。

---

## 觸發關鍵字

| 關鍵字                    | 動作                       |
| ------------------------- | -------------------------- |
| 開始學習 / 分析程式碼風格 | 執行 learnCodeStyle()      |
| 學習回應偏好              | 執行 learnResponseStyle()  |
| 學習解決方案              | 執行 learnProblemSolving() |
| 查看學習進度              | 讀取 learningMetrics 快取  |
| 重置學習資料              | 清空本地學習資料           |
| 匯出個人化模型            | 匯出 ~/.opencode/models/   |
| 匯入個人化模型            | 匯入並驗證格式             |

---

## 學習層級

### Level 1: 行為記錄

記錄程式碼偏好、回應偏好、常用指令、錯誤處理方式。

### Level 2: 模式識別

分析命名風格（camelCase/snake_case/PascalCase）、縮排格式、引入方式、錯誤處理模式。

### Level 3: 模型微調

收集 100+ 互動後進行微調，生成個人化模型。

---

## 執行函式

### learnCodeStyle(projectPath)

分析專案程式碼風格：

- 變數命名統計
- 函數風格
- 引入偏好
- 註解習慣
- 錯誤處理模式

### learnResponseStyle()

學習用戶回應偏好：

- 回應長度
- 語言偏好
- 解釋程度
- 程式碼區塊使用

### learnProblemSolving()

學習解決方案偏好：

- 偏好的解決策略
- 常用的工具
- 搜尋偏好
- 驗證方式

### recordInteraction(prompt, response, feedback)

記錄每次互動：

- accepted: 完全接受
- edited: 接受但有修改
- rejected: 拒絕

---

## 資料儲存

```
~/.opencode/models/
├── style/code-style.json
├── style/response-style.json
├── knowledge/project-knowledge.json
├── behavior/preferences.json
└── fine-tuned/personal-model/
```

---

## 快取策略

| 鍵                                  | TTL    | 說明       |
| ----------------------------------- | ------ | ---------- |
| learning:metrics:{project_id}       | 3600s  | 學習指標   |
| learning:codeStyle:{project_id}     | 86400s | 程式碼風格 |
| learning:responseStyle:{project_id} | 3600s  | 回應風格   |
| learning:profile:{user_id}          | 1800s  | 用戶設定   |

---

## 使用流程

### 手動觸發

1. **「開始學習我的程式碼風格」** → 背景執行 learnCodeStyle()
2. **「查看學習進度」** → 讀取快取，返回 metrics
3. **「重置學習資料」** → 清空 models/ 目錄

### 自動學習

- 每次互動記錄反饋（後台執行）
- 閒置時分析模式
- 達到 100 互動觸發微調

---

## 回傳格式

### 學習進度

```json
{
  "level": 3,
  "dataPoints": 150,
  "accuracy": 0.85,
  "improvements": ["程式碼風格匹配度提升 15%"],
  "nextMilestone": "200 互動後進行模型微調"
}
```

### 個人化推薦

```json
{
  "codeStyle": { "naming": "camelCase", "indent": 2 },
  "tools": ["read", "edit", "grep"],
  "strategy": "try-catch",
  "confidence": 0.85
}
```

---

## 執行原則

- 非同步執行，不阻塞回應
- 快取優先，減少 API 消耗
- 失敗重試不超過 3 次
- 敏感資訊自動過濾

---

## 隱私設定

```json
{
  "learningConsent": true,
  "dataRetention": 30,
  "allowCloudSync": false
}
```
