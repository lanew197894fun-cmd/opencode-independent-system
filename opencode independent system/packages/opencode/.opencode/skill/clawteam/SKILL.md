---
name: clawteam
description: 多代理蟲群協作 - 使用 ClawTeam 協調 OpenCode 代理團隊
---

# clawteam

蟲群協作系統，讓多個 OpenCode agent 可以自我組織成團隊、分工合作、協調任務。

## 架構

```
┌─────────────────────────────────────────────┐
│           ClawTeam Swarm System             │
├─────────────────────────────────────────────┤
│  Leader Agent (OpenCode)                    │
│  ├── 創建團隊 (spawn-team)                   │
│  ├── 分派任務 (task create)                 │
│  ├── Spawn Workers (openclaw/codex/nanobot)│
│  └── 合併結果 (workspace merge)             │
├─────────────────────────────────────────────┤
│  Worker Agents (隔離的 git worktree)        │
│  ├── 每個 agent 有獨立工作目錄              │
│  ├── 透過 inbox 通訊                        │
│  └── 透過 task 回報進度                     │
├─────────────────────────────────────────────┤
│  狀態儲存 (~/.clawteam/)                    │
│  ├── teams/ - 團隊成員                      │
│  ├── tasks/ - 任務看板                      │
│  ├── inboxes/ - 訊息匣                     │
│  └── workspaces/ - git worktrees            │
└─────────────────────────────────────────────┘
```

## 使用時機

| 場景             | 範例                             |
| ---------------- | -------------------------------- |
| 大型專案需要分工 | "建立一個 5 人團隊開發 web app"  |
| 需要多角度分析   | "用 hedge-fund 模板分析股票"     |
| 並行實驗優化     | "用 8 個 GPU 優化模型訓練"       |
| 任務有依賴關係   | API → Backend → Frontend → Tests |

## 工具列表

### 團隊管理

| 工具                    | 功能             |
| ----------------------- | ---------------- |
| `clawteam_team_create`  | 建立新團隊       |
| `clawteam_team_list`    | 列表所有團隊     |
| `clawteam_team_status`  | 顯示團隊成員狀態 |
| `clawteam_team_cleanup` | 刪除團隊         |

### Spawn Agent

| 工具             | 功能                                              |
| ---------------- | ------------------------------------------------- |
| `clawteam_spawn` | Spawn 新 agent（建立 git worktree + tmux window） |

### Task 管理

| 工具                   | 功能                         |
| ---------------------- | ---------------------------- |
| `clawteam_task_create` | 建立任務                     |
| `clawteam_task_update` | 更新任務狀態（自動解除阻塞） |
| `clawteam_task_list`   | 列表任務                     |
| `clawteam_task_wait`   | 等待所有任務完成             |

### 通訊

| 工具                     | 功能               |
| ------------------------ | ------------------ |
| `clawteam_inbox_send`    | 發送訊息給團隊成員 |
| `clawteam_inbox_receive` | 接收並消費訊息     |
| `clawteam_inbox_peek`    | 讀取訊息（不消費） |

### 監控

| 工具                    | 功能                   |
| ----------------------- | ---------------------- |
| `clawteam_board_show`   | 顯示 terminal kanban   |
| `clawteam_board_live`   | 自動刷新 dashboard     |
| `clawteam_board_attach` | 連接到 tmux tiled view |

### Workspace

| 工具                         | 功能               |
| ---------------------------- | ------------------ |
| `clawteam_workspace_list`    | 列表 git worktrees |
| `clawteam_workspace_merge`   | 合併回 main branch |
| `clawteam_workspace_cleanup` | 清理 worktree      |

### Template

| 工具                     | 功能           |
| ------------------------ | -------------- |
| `clawteam_launch`        | 從模板啟動團隊 |
| `clawteam_template_list` | 列表可用模板   |

### Config

| 工具                     | 功能     |
| ------------------------ | -------- |
| `clawteam_config_show`   | 顯示配置 |
| `clawteam_config_health` | 健康檢查 |

## 安裝前置需求

```
Python 3.10+
tmux
OpenClaw / Claude Code / Codex (至少一種)
```

### 安裝 ClawTeam (OpenClaw fork)

```bash
git clone https://github.com/win4r/ClawTeam-OpenClaw.git
cd ClawTeam-OpenClaw
pip install -e .

# 建立 symlink (確保 spawned agents 可以找到)
mkdir -p ~/bin
ln -sf "$(which clawteam)" ~/bin/clawteam

# 驗證
clawteam --version
clawteam config health
```

## 使用範例

### 範例 1: 建立團隊開發 Web App

```
# 1. Leader 建立團隊
clawteam_team_create(
  name: "webapp-team",
  description: "Full-stack todo app",
  leader: "architect"
)

# 2. Leader 建立任務
clawteam_task_create(
  team: "webapp-team",
  subject: "Design REST API schema",
  owner: "architect"
)

# 3. Spawn workers
clawteam_spawn(
  team: "webapp-team",
  agentName: "backend",
  task: "Implement JWT auth",
  agent: "openclaw"
)

clawteam_spawn(
  team: "webapp-team",
  agentName: "frontend",
  task: "Build React UI",
  agent: "openclaw"
)
```

### 範例 2: 使用 Template

```
clawteam_launch(
  template: "hedge-fund",
  team: "analysis-team",
  goal: "分析 AAPL, MSFT, Q2 2026"
)
```

### 範例 3: 監控團隊

```
# Terminal kanban
clawteam_board_show(team: "webapp-team")

# Auto-refresh
clawteam_board_live(team: "webapp-team", interval: 3)

# Tiled tmux view
clawteam_board_attach(team: "webapp-team")
```

## Agent 協調 prompt

當 agent 被 spawn 時，會自動注入以下協調指令：

```
## Coordination Protocol

- 檢查任務: clawteam_task_list <team> --owner <your-name>
- 開始任務: clawteam_task_update <team> <id> --status in_progress
- 完成任務: clawteam_task_update <team> <id> --status completed
- 訊息 leader: clawteam_inbox_send <team> leader "status update..."
- 檢查 inbox: clawteam_inbox_receive <team>
- 回報閒置: clawteam_lifecycle_idle <team>
```

## 限制

- 需要 Python 3.10+
- 需要 tmux（預設 backend）
- 所有 agents 需在同一台機器或共享檔案系統
