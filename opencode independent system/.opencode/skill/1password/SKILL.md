---
name: 1password
description: 1Password CLI - 設定與使用 op CLI
homepage: https://developer.1password.com/docs/cli/get-started/
metadata:
  openclaw:
    emoji: "🔐"
    requires:
      bins: ["op"]
    install:
      - id: brew
        kind: brew
        formula: "1password-cli"
        bins: ["op"]
        label: "安裝 1Password CLI (brew)"
---

# 1Password CLI

使用 1Password CLI 管理密碼。

---

## 觸發關鍵字

| 關鍵字    | 動作     |
| --------- | -------- |
| 1Password | 存取密碼 |
| 密碼管理  | 讀取密碼 |

---

## 工作流程

1. 檢查 OS + shell
2. 驗證 CLI：`op --version`
3. 確認 desktop app 已整合且已解鎖
4. **必要**：建立專用 tmux session 執行 `op`
5. 在 tmux 內登入：`op signin`
6. 驗證存取：`op whoami`
7. 多帳號：使用 `--account` 或 `OP_ACCOUNT`

---

## 必要：tmux session

避免重複提示和失敗，請使用專用 tmux session：

```bash
SOCKET_DIR="${OPENCLAW_TMUX_SOCKET_DIR:-${CLAWDBOT_TMUX_SOCKET_DIR:-${TMPDIR:-/tmp}/openclaw-tmux-sockets}}"
mkdir -p "$SOCKET_DIR"
SOCKET="$SOCKET_DIR/openclaw-op.sock"
SESSION="op-auth-$(date +%Y%m%d-%H%M%S)"

tmux -S "$SOCKET" new -d -s "$SESSION" -n shell
tmux -S "$SOCKET" send-keys -t "$SESSION":0.0 -- "op signin --account my.1password.com" Enter
tmux -S "$SOCKET" send-keys -t "$SESSION":0.0 -- "op whoami" Enter
tmux -S "$SOCKET" capture-pane -p -J -t "$SESSION":0.0 -S -200
tmux -S "$SOCKET" kill-session -t "$SESSION"
```

---

## 安全規則

- **勿將密鑰貼到日誌、對話或程式碼**
- 優先使用 `op run` / `op inject`
- 如需無 app 整合的登入，使用 `op account add`
- 如回傳「未登入」，在 tmux 內重新執行 `op signin`
- 勿在 tmux 外執行 `op`
