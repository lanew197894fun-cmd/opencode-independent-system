---
name: openclaw
description: 龍蝦系統 - 啟動與管理 OpenClaw
color: "#FF6B6B"
---

# OpenClaw 龍蝦系統

## 啟動 OpenClaw

```bash
# 進入 OpenClaw 目錄
cd /home/reamaster/openclaw-manager/openclaw

# 啟動 gateway
pnpm run gateway

# 或使用 docker
docker-compose up -d
```

## 共用技能

OpenCode 已設定自動載入 OpenClaw 技能：

- `~/.opencode/skill/` - OpenCode 專屬技能
- `/home/reamaster/openclaw-manager/openclaw/skills/` - OpenClaw 技能

## 常用命令

```bash
# 查看 OpenClaw 狀態
openclaw status

# 重啟 gateway
openclaw gateway restart

# 查看日誌
openclaw logs
```
