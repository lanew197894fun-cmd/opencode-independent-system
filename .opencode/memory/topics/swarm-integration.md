## Swarm 內建蟲群系統
date:2026-03-24

### 整合方式
完全使用 TypeScript 實現，無外部依賴

### 已建立
1. src/plugin/swarm.ts - 17 個工具
2. src/plugin/index.ts - 已註冊
3. .opencode/skill/swarm/SKILL.md - 中文文件

### 工具列表 (17個)
- team: create, list, status, add_member, remove_member, cleanup
- task: create (支援blockedBy), update (自動解除), list, wait
- inbox: send, receive, peek
- board: show, stats

### 資料位置
.opencode/swarm/
- teams.json
- tasks-{team}.json
- inbox-{team}.json

### 與 ClawTeam 差異
| ClawTeam | Swarm |
|----------|-------|
| Python | TypeScript |
| 需要 tmux | 無依賴 |
| 外部安裝 | 內建 |
| git worktree | Session 隔離 |