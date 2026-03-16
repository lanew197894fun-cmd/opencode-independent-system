---
name: gh-issues
description: GitHub Issues 自動化 - 擷取 issues、生成子代理修復並開 PR、監控 PR 審查
user-invocable: true
metadata:
  openclaw:
    requires:
      bins: ["curl", "git", "gh"]
    primaryEnv: "GH_TOKEN"
---

# GitHub Issues 自動化

使用 curl + GitHub REST API 自動化處理 GitHub Issues。

---

## 觸發關鍵字

| 關鍵字     | 動作              |
| ---------- | ----------------- |
| /gh-issues | 自動化處理 issues |
| 修復 issue | 生成代理修復      |
| 監控 PR    | 監控審查意見      |

---

## 使用方式

```
/gh-issues [owner/repo] [options]
```

### 選項

| 參數           | 預設  | 說明         |
| -------------- | ----- | ------------ |
| --label        | -     | 標籤篩選     |
| --limit        | 10    | 最大數量     |
| --milestone    | -     | 里程碑篩選   |
| --assignee     | -     | 被分派人     |
| --fork         | -     | Fork repo    |
| --watch        | false | 持續監控     |
| --interval     | 5     | 監控間隔分鐘 |
| --dry-run      | false | 僅顯示不執行 |
| --yes          | false | 自動確認     |
| --reviews-only | false | 僅處理審查   |
| --cron         | false | Cron 模式    |

---

## 工作流程

### Phase 1: 解析參數

解析命令列參數，偵測 git remote 或使用指定 owner/repo。

### Phase 2: 擷取 Issues

使用 curl 呼叫 GitHub API：

```bash
curl -s -H "Authorization: Bearer $GH_TOKEN" \
  "https://api.github.com/repos/{owner}/{repo}/issues?..."
```

### Phase 3: 確認

顯示 issues 表格，確認處理的 issues。

### Phase 4: 預檢

- 檢查 dirty working tree
- 記錄 base branch
- 驗證 remote 存取
- 驗證 GH_TOKEN
- 檢查現有 PRs
- 檢查進行中的 branches
- 檢查 claims 檔案

### Phase 5: 生成子代理

- 每個 issue 生成一個子代理
- 最多 8 個並行
- 子代理執行：
  1. 確認信心度
  2. 建立 branch
  3. 分析與實作修復
  4. 執行測試
  5. Commit 與 Push
  6. 建立 PR

### Phase 6: PR 審查處理

- 監控 open PRs 的審查意見
- 生成子代理處理審查意見
- 回覆評論

---

## Watch 模式

持續監控新 issues 與 PR 審查意見：

1. 擷取新 issues
2. 生成子代理修復
3. 檢查審查意見
4. 處理審查意見
5. 等待間隔分鐘後重複

---

## 重要提醒

- **勿使用 gh CLI** - 僅使用 curl + REST API
- GH_TOKEN 環境變數已注入
- 定時檢查claims 檔案避免重複處理
- 60 分鐘超時限制
