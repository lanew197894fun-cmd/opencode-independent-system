---
name: mcporter
description: MCP 伺服器管理 - 列表、設定、驗證、呼叫工具
homepage: http://mcporter.dev
metadata:
  openclaw:
    emoji: "📦"
    requires:
      bins: ["mcporter"]
    install:
      - id: node
        kind: node
        package: mcporter
        bins: ["mcporter"]
        label: "安裝 mcporter (node)"
---

# MCP 伺服器操作

使用 `mcporter` 管理 MCP 伺服器。

---

## 觸發關鍵字

| 關鍵字   | 動作          |
| -------- | ------------- |
| MCP 工具 | 呼叫 MCP 工具 |
| MCP 列表 | 列表工具      |

---

## 快速開始

```bash
mcporter list
mcporter list <server> --schema
mcporter call <server.tool> key=value
```

---

## 呼叫工具

```bash
# 選擇器
mcporter call linear.list_issues team=ENG limit:5

# 函數語法
mcporter call "linear.create_issue(title: \"Bug\")"

# Full URL
mcporter call https://api.example.com/mcp.fetch url:https://example.com

# Stdio
mcporter call --stdio "bun run ./server.ts" scrape url=https://example.com

# JSON
mcporter call <server.tool> --args '{"limit":5}'
```

---

## 驗證與設定

```bash
# OAuth
mcporter auth <server | url> [--reset]

# 設定
mcporter config list|get|add|remove|import|login|logout
```

---

## 程式碼生成

```bash
# CLI
mcporter generate-cli --server <name>

# TS
mcporter emit-ts <server> --mode client|types
```
