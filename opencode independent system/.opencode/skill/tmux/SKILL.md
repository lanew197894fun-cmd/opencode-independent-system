---
name: tmux
description: 遠端控制 tmux sessions - 傳送按鍵與擷取輸出
metadata:
  openclaw:
    emoji: "🧵"
    os: ["darwin", "linux"]
    requires:
      bins: ["tmux"]
---

# tmux Session 控制

透過傳送按鍵和讀取輸出來控制 tmux sessions，管理 Claude Code sessions 的必備技能。

---

## 觸發關鍵字

| 關鍵字    | 動作          |
| --------- | ------------- |
| tmux 列表 | 列出 sessions |
| tmux 輸出 | 擷取輸出      |
| tmux 傳送 | 傳送按鍵      |

---

## 使用時機

### ✅ 適用

- 監控 tmux 中的 Claude/Codex sessions
- 傳送輸入到互動式終端機應用
- 擷取 tmux 中長時間執行的程序輸出
- 以程式方式瀏覽 tmux panes/windows
- 檢查現有 sessions 中的背景工作

### ❌ 不適用

- 執行一次性 shell 命令 → 直接使用 `exec` tool
- 啟動新的背景程序 → 使用 `exec` + `background:true`
- 非互動式腳本 → 使用 `exec` tool
- 程序不在 tmux 中

---

## 常用指令

### 列表 Sessions

```bash
tmux list-sessions
tmux ls
```

### 擷取輸出

```bash
# 最後 20 行
tmux capture-pane -t shared -p | tail -20

# 完整 scrollback
tmux capture-pane -t shared -p -S -

# 特定 pane
tmux capture-pane -t shared:0.0 -p
```

### 傳送按鍵

```bash
# 傳送文字（不按 Enter）
tmux send-keys -t shared "hello"

# 傳送文字 + Enter
tmux send-keys -t shared "y" Enter

# 特殊按鍵
tmux send-keys -t shared Enter
tmux send-keys -t shared Escape
tmux send-keys -t shared C-c          # Ctrl+C
tmux send-keys -t shared C-d          # Ctrl+D
tmux send-keys -t shared C-z          # Ctrl+Z
```

### 視窗/面板導航

```bash
# 選擇視窗
tmux select-window -t shared:0

# 選擇面板
tmux select-pane -t shared:0.1

# 列表視窗
tmux list-windows -t shared
```

### Session 管理

```bash
# 建立新 session
tmux new-session -d -s newsession

# 終止 session
tmux kill-session -t sessionname

# 重新命名
tmux rename-session -t old new
```

---

## 安全傳送輸入

對於互動式 TUIs，分開傳送文字和 Enter：

```bash
tmux send-keys -t shared -l -- "Please apply the patch"
sleep 0.1
tmux send-keys -t shared Enter
```

---

## Claude Code Session 模式

### 檢查是否需要輸入

```bash
tmux capture-pane -t worker-3 -p | tail -10 | grep -E "❯|Yes.*No|proceed|permission"
```

### 批准提示

```bash
tmux send-keys -t worker-3 'y' Enter
tmux send-keys -t worker-3 '2' Enter
```

### 檢查所有 Sessions 狀態

```bash
for s in shared worker-2 worker-3 worker-4 worker-5 worker-6 worker-7 worker-8; do
  echo "=== $s ==="
  tmux capture-pane -t $s -p 2>/dev/null | tail -5
done
```

### 傳送任務

```bash
tmux send-keys -t worker-4 "Fix the bug in auth.js" Enter
```

---

## 注意事項

- 使用 `capture-pane -p` 輸出到 stdout
- `-S -` 擷取完整 scrollback 歷史
- 目標格式：`session:window.pane`（如 `shared:0.0`）
- Sessions 在 SSH 斷線後仍然存在
