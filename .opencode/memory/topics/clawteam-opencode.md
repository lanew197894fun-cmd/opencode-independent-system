## ClawTeam OpenCode 整合
source:https://github.com/win4r/ClawTeam-OpenClaw
repo:3.1k stars, 599 (fork), 51 commits

### 整合方式
1. 建立 plugin: packages/opencode/src/plugin/clawteam.ts
2. 註冊到: packages/opencode/src/plugin/index.ts
3. 建立 skill: .opencode/skill/clawteam/SKILL.md

### 可用工具 (23個)
- team: create, list, status, cleanup
- spawn: 創建 worker agent (git worktree + tmux)
- task: create, update, list, wait
- inbox: send, receive, peek
- board: show, live, attach
- workspace: list, merge, cleanup
- launch: template launch
- config: show, health

### 安裝需求
Python 3.10+, tmux, OpenClaw/Claude Code/Codex