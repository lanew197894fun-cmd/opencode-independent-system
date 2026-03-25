---
name: swarm
description: 多代理蟲群協作 - 內建團隊管理與任務協調系統
---

# swarm

OpenCode 內建蟲群協作系統，讓多個 agent 可以自我組織成團隊、分工合作、協調任務。

**特點：**

- 完全使用 TypeScript 實現，無外部依賴
- 資料儲存於 `.opencode/swarm/` 目錄
- 與 OpenCode 子代理系統緊密整合

## 架構

```
┌─────────────────────────────────────────────┐
│           Swarm System (內建)               │
├─────────────────────────────────────────────┤
│  Leader Agent (OpenCode)                    │
│  ├── 建立團隊 (swarm_team_create)            │
│  ├── 分派任務 (swarm_task_create)           │
│  ├──  Spawn 子代理 (task tool)              │
│  └── 合併結果                               │
├─────────────────────────────────────────────┤
│  子代理 (OpenCode subagent)                 │
│  ├── 每個子代理是獨立 Session               │
│  ├── 透過 inbox 通訊                        │
│  └── 透過 task 回報進度                     │
├─────────────────────────────────────────────┤
│  狀態儲存 (.opencode/swarm/)                │
│  ├── teams.json - 團隊成員                  │
│  ├── tasks-{team}.json - 任務看板          │
│  └── inbox-{team}.json - 訊息匣             │
└─────────────────────────────────────────────┘
```

## 使用時機

| 場景             | 範例                             |
| ---------------- | -------------------------------- |
| 大型專案需要分工 | "建立團隊開發 web app"           |
| 任務有依賴關係   | API → Backend → Frontend → Tests |
| 需要多人協作     | "5 人團隊處理這個專案"           |

## 工具列表

### 團隊管理

| 工具                       | 功能               |
| -------------------------- | ------------------ |
| `swarm_team_create`        | 建立新團隊         |
| `swarm_team_list`          | 列表所有團隊       |
| `swarm_team_status`        | 顯示團隊成員與狀態 |
| `swarm_team_add_member`    | 新增團隊成員       |
| `swarm_team_remove_member` | 移除團隊成員       |
| `swarm_team_cleanup`       | 刪除團隊           |

### Task 管理

| 工具                | 功能                        |
| ------------------- | --------------------------- |
| `swarm_task_create` | 建立任務 (支援依賴鏈)       |
| `swarm_task_update` | 更新任務狀態 (自動解除阻塞) |
| `swarm_task_list`   | 列表任務 (可篩選)           |
| `swarm_task_wait`   | 等待所有任務完成            |

### 通訊

| 工具                  | 功能                    |
| --------------------- | ----------------------- |
| `swarm_inbox_send`    | 發送訊息給團隊成員      |
| `swarm_inbox_receive` | 接收並消費訊息          |
| `swarm_inbox_peek`    | 讀取訊息 (不標記為已讀) |

### 監控

| 工具                | 功能                 |
| ------------------- | -------------------- |
| `swarm_board_show`  | 顯示團隊 Kanban 看板 |
| `swarm_board_stats` | 顯示團隊統計         |

## 使用範例

### 範例 1: 建立團隊開發 Web App

```
# 1. Leader 建立團隊
swarm_team_create(
  name: "webapp-team",
  description: "Full-stack todo app"
)

# 2. Leader 建立任務 (有依賴)
swarm_task_create(
  team: "webapp-team",
  subject: "Design REST API schema",
  owner: "architect"
)

swarm_task_create(
  team: "webapp-team",
  subject: "Implement JWT auth",
  owner: "backend",
  blockedBy: ["task-id-1"]  # 依賴 task 1
)

# 3. Spawn 子代理
task(
  description: "Build frontend",
  prompt: "使用 React 建立 TODO UI...",
  subagent_type: "build"
)

# 4. 監控看板
swarm_board_show(team: "webapp-team")
```

### 範例 2: 使用依賴鏈

```
# 建立任務鏈: A → B → C
swarm_task_create(team: "my-team", subject: "設計 API", owner: "alice")
# 假設返回 task_id = "abc123"

swarm_task_create(
  team: "my-team",
  subject: "實作 Backend",
  owner: "bob",
  blockedBy: ["abc123"]  # 阻塞直到 alice 完成
)

swarm_task_create(
  team: "my-team",
  subject: "實作 Frontend",
  owner: "carol",
  blockedBy: ["abc123"]  # 也可以同時依賴多個
)

# 當 alice 完成任務，bob 和 carol 會自動解除阻塞
```

### 範例 3: 通訊

```
# 發送訊息給特定成員
swarm_inbox_send(
  team: "my-team",
  to: "bob",
  message: "API 設計已完成，可以開始實作了"
)

# 廣播給全部成員
swarm_inbox_send(
  team: "my-team",
  to: "broadcast",
  message: "大家午飯後開會討論進度"
)

# 檢查訊息
swarm_inbox_peek(team: "my-team")
```

## 與 ClawTeam 的差異

| 項目 | ClawTeam (外部)    | Swarm (內建) |
| ---- | ------------------ | ------------ |
| 語言 | Python             | TypeScript   |
| 依賴 | Python 3.10+, tmux | 無           |
| 安裝 | 需額外安裝         | 內建         |
| 隔離 | git worktree       | Session 隔離 |
| 規模 | 多機器             | 單機         |
| 控制 | CLI 命令           | 直接 API     |

## 資料位置

所有資料儲存於工作目錄的 `.opencode/swarm/` 目錄：

```
.opencode/swarm/
├── teams.json          # 團隊列表
├── tasks-{team}.json   # 每個團隊的任務
└── inbox-{team}.json   # 每個團隊的訊息
```
