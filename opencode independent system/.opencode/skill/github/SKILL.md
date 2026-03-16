---
name: github
description: GitHub 操作 - 透過 gh CLI 管理 issues、PRs、CI 與 API 查詢
metadata:
  openclaw:
    emoji: "🐙"
    requires:
      bins: ["gh"]
    install:
      - id: brew
        kind: brew
        formula: gh
        bins: ["gh"]
        label: "安裝 GitHub CLI (brew)"
      - id: apt
        kind: apt
        package: gh
        bins: ["gh"]
        label: "安裝 GitHub CLI (apt)"
---

# GitHub 操作

使用 `gh` CLI 與 GitHub 仓库、issues、PRs、CI 互動。

---

## 觸發關鍵字

| 關鍵字     | 動作         |
| ---------- | ------------ |
| PR 狀態    | 查詢 PR      |
| 查看 CI    | 查詢 CI 狀態 |
| 建立 issue | 建立 Issue   |
| 建立 PR    | 建立 PR      |
| 合併 PR    | 合併 PR      |

---

## 使用時機

### ✅ 適用

- 檢查 PR 狀態、審查、合併就緒
- 查看 CI/workflow 執行狀態與日誌
- 建立、關閉、留言 issues
- 建立或合併 pull requests
- 查詢 GitHub API 取得仓库資料
- 列表 repos、releases、collaborators

### ❌ 不適用

- 本地 git 操作（commit、push、pull、branch）→ 直接使用 `git`
- 非 GitHub 仓库（GitLab、Bitbucket）→ 使用不同 CLI
- 複製仓库 → 使用 `git clone`
- 審查實際程式碼變更 → 使用 `coding-agent` skill

---

## 設定

```bash
# 驗證（一次性）
gh auth login

# 確認狀態
gh auth status
```

---

## 常用指令

### Pull Requests

```bash
# 列表 PRs
gh pr list --repo owner/repo

# 檢查 CI 狀態
gh pr checks 55 --repo owner/repo

# 查看 PR 詳情
gh pr view 55 --repo owner/repo

# 建立 PR
gh pr create --title "feat: add feature" --body "Description"

# 合併 PR
gh pr merge 55 --squash --repo owner/repo
```

### Issues

```bash
# 列表 issues
gh issue list --repo owner/repo --state open

# 建立 issue
gh issue create --title "Bug: something broken" --body "Details..."

# 關閉 issue
gh issue close 42 --repo owner/repo
```

### CI/Workflow 執行

```bash
# 列表近期執行
gh run list --repo owner/repo --limit 10

# 查看特定執行
gh run view <run-id> --repo owner/repo

# 只看失敗步驟日誌
gh run view <run-id> --repo owner/repo --log-failed

# 重跑失敗任務
gh run rerun <run-id> --failed --repo owner/repo
```

### API 查詢

```bash
# 取得 PR 特定欄位
gh api repos/owner/repo/pulls/55 --jq '.title, .state, .user.login'

# 列表所有標籤
gh api repos/owner/repo/labels --jq '.[].name'

# 取得仓库統計
gh api repos/owner/repo --jq '{stars: .stargazers_count, forks: .forks_count}'
```

---

## JSON 輸出

多數指令支援 `--json` 結構化輸出，可搭配 `--jq` 過濾：

```bash
gh issue list --repo owner/repo --json number,title --jq '.[] | "\(.number): \(.title)"'
gh pr list --json number,title,state,mergeable --jq '.[] | select(.mergeable == "MERGEABLE")'
```

---

## 範本

### PR 審查摘要

```bash
PR=55 REPO=owner/repo
echo "## PR #$PR Summary"
gh pr view $PR --repo $REPO --json title,body,author,additions,deletions,changedFiles \
  --jq '"**\(.title)** by @\(.author.login)\n\n\(.body)\n\n📊 +\(.additions) -\(.deletions) across \(.changedFiles) files"'
gh pr checks $PR --repo $REPO
```

### Issue 快速檢視

```bash
gh issue list --repo owner/repo --state open --json number,title,labels,createdAt \
  --jq '.[] | "[\(.number)] \(.title) - \([.labels[].name] | join(", ")) (\(.createdAt[:10]))"'
```

---

## 注意事項

- 不在 git 目錄時務必指定 `--repo owner/repo`
- 可直接使用 URL：`gh pr view https://github.com/owner/repo/pull/55`
- 有請求限制，重複查詢使用 `gh api --cache 1h`
