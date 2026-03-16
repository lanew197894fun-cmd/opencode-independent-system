---
name: coding-agent
description: 委派編碼任務給 Codex、Claude Code、Pi 代理程式
metadata:
  openclaw:
    emoji: "🧩"
    requires:
      anyBins: ["claude", "codex", "opencode", "pi"]
---

# 編碼代理程式

委派編碼任務給 AI 代理程式，適用於建構新功能、審查 PR、重構大型程式碼庫。

---

## 觸發關鍵字

| 關鍵字     | 動作                   |
| ---------- | ---------------------- |
| 建立新功能 | 委派 Codex/Claude Code |
| 審查 PR    | 委派代理程式審查       |
| 重構程式碼 | 委派重構任務           |
| 修復 Bug   | 委派修復               |

---

## 使用時機

### ✅ 適用

- 建構/建立新功能或應用程式
- 審查 PR（在暫存目錄）
- 重構大型程式碼庫
- 需要檔案探索的迭代編碼

### ❌ 不適用

- 簡單單行修復 → 直接使用 edit
- 閱讀程式碼 → 使用 read tool
- ~/clawd 工作區 → 勿在此生成代理程式

---

## Bash Tool 參數

| 參數       | 類型    | 說明                         |
| ---------- | ------- | ---------------------------- |
| command    | string  | 執行指令                     |
| pty        | boolean | 互動式終端機（代理程式必備） |
| workdir    | string  | 工作目錄                     |
| background | boolean | 背景執行                     |
| timeout    | number  | 超時秒數                     |
| elevated   | boolean | 在主機而非沙箱執行           |

---

## Process Tool 動作

| 動作      | 說明                           |
| --------- | ------------------------------ |
| list      | 列表所有執行中/近期的 sessions |
| poll      | 檢查 session 是否仍在執行      |
| log       | 取得 session 輸出              |
| write     | 傳送資料到 stdin               |
| submit    | 傳送資料 + 換行                |
| send-keys | 傳送按鍵                       |
| paste     | 貼上文字                       |
| kill      | 終止 session                   |

---

## 執行模式

### ⚠️ PTY 模式

- **Codex/Pi/OpenCode**：需要 PTY
- **Claude Code**：不需要 PTY，使用 `--print --permission-mode bypassPermissions`

```bash
# ✅ Codex/Pi/OpenCode
bash pty:true command:"codex exec 'Your prompt'"

# ✅ Claude Code
claude --permission-mode bypassPermissions --print 'Your task'
```

---

## 快速開始

### 單次任務

```bash
# 快速對話（Codex 需要 git repo！）
SCRATCH=$(mktemp -d) && cd $SCRATCH && git init && codex exec "Your prompt"

# 在實際專案中
bash pty:true workdir:~/Projects/myproject command:"codex exec 'Add error handling'"
```

### 背景任務

```bash
# 啟動代理程式
bash pty:true workdir:~/project background:true command:"codex --yolo 'Build a snake game'"

# 監控進度
process action:log sessionId:XXX

# 檢查是否完成
process action:poll sessionId:XXX

# 傳送輸入
process action:submit sessionId:XXX data:"yes"

# 終止
process action:kill sessionId:XXX
```

---

## Codex CLI

### 旗標

| 旗標          | 效果                           |
| ------------- | ------------------------------ |
| exec "prompt" | 單次執行，完成後退出           |
| --full-auto   | 沙箱模式，自動批准             |
| --yolo        | 無沙箱，無批准（最快，最危險） |

### 建構

```bash
# 單次執行
bash pty:true workdir:~/project command:"codex exec --full-auto 'Build a dark mode toggle'"

# 背景長時間工作
bash pty:true workdir:~/project background:true command:"codex --yolo 'Refactor auth module'"
```

### 審查 PR

**⚠️ 重要：勿在 OpenClaw 專案資料夾審查 PR！**

```bash
# 複製到暫存目錄安全審查
REVIEW_DIR=$(mktemp -d)
git clone https://github.com/user/repo.git $REVIEW_DIR
cd $REVIEW_DIR && gh pr checkout 130
bash pty:true workdir:$REVIEW_DIR command:"codex review --base origin/main"

# 或使用 git worktree
git worktree add /tmp/pr-130-review pr-130-branch
bash pty:true workdir:/tmp/pr-130-review command:"codex review --base main"
```

---

## Claude Code

```bash
# 前台
bash workdir:~/project command:"claude --permission-mode bypassPermissions --print 'Your task'"

# 背景
bash workdir:~/project background:true command:"claude --permission-mode bypassPermissions --print 'Your task'"
```

---

## OpenCode

```bash
bash pty:true workdir:~/project command:"opencode run 'Your task'"
```

---

## Pi

```bash
# 安裝：npm install -g @mariozechner/pi-coding-agent
bash pty:true workdir:~/project command:"pi 'Your task'"

# 非互動模式
bash pty:true command:"pi -p 'Summarize src/'"
```

---

## 並行修復多個 Issue

使用 git worktrees：

```bash
# 1. 為每個 issue 建立 worktree
git worktree add -b fix/issue-78 /tmp/issue-78 main
git worktree add -b fix/issue-99 /tmp/issue-99 main

# 2. 啟動 Codex
bash pty:true workdir:/tmp/issue-78 background:true command:"codex --yolo 'Fix issue #78'"
bash pty:true workdir:/tmp/issue-99 background:true command:"codex --yolo 'Fix issue #99'"

# 3. 監控
process action:list

# 4. 建立 PR
cd /tmp/issue-78 && git push -u origin fix/issue-78

# 5. 清理
git worktree remove /tmp/issue-78
git worktree remove /tmp/issue-99
```

---

## ⚠️ 規則

1. **正確執行模式**：
   - Codex/Pi/OpenCode：`pty:true`
   - Claude Code：`--print --permission-mode bypassPermissions`
2. **尊重工具選擇** - 用戶要求哪個就用哪個
3. **保持耐心** - 勿因「太慢」殺掉 sessions
4. **使用 process:log 監控** - 不干擾檢查進度
5. **--full-auto 用於建構**
6. **審查用 vanilla**
7. **並行可行** - 批量工作可同時執行多個 Codex
8. **勿在 ~/.openclaw/ 啟動 Codex**
9. **勿在 ~/Projects/openclaw/ checkout 分支**

---

## 進度更新

生成背景代理程式時，保持用戶知情：

- 啟動時發送簡短訊息
- 里程碑完成時更新
- 代理程式提問時更新
- 代理程式完成時回報變更

---

## 完成通知

長時間任務可附加喚醒觸發：

```
... your task here.

完成後執行：
openclaw system event --text "Done: [brief summary]" --mode now
```
