---
name: gifgrep
description: GIF 搜尋與下載 - CLI/TUI 搜尋供應商
homepage: https://gifgrep.com
metadata:
  openclaw:
    emoji: "🧲"
    requires:
      bins: ["gifgrep"]
    install:
      - id: brew
        kind: brew
        formula: steipete/tap/gifgrep
        bins: ["gifgrep"]
        label: "安裝 gifgrep (brew)"
      - id: go
        kind: go
        module: github.com/steipete/gifgrep/cmd/gifgrep@latest
        bins: ["gifgrep"]
        label: "安裝 gifgrep (go)"
---

# GIF 搜尋

使用 `gifgrep` 搜尋 GIF、瀏覽 TUI、下載、擷取畫面。

---

## 觸發關鍵字

| 關鍵字   | 動作     |
| -------- | -------- |
| GIF 搜尋 | 搜尋 GIF |
| 下載 GIF | 下載圖片 |

---

## 快速開始

```bash
gifgrep cats --max 5
gifgrep cats --format url | head -n 5
gifgrep search --json cats | jq '.[0].url'
gifgrep tui "office handshake"
gifgrep cats --download --max 1 --format url
```

---

## TUI 與預覽

```bash
# TUI
gifgrep tui "query"

# CLI 預覽
gifgrep cats --thumbs
```

---

## 下載

```bash
# 下載到 ~/Downloads
gifgrep cats --download

# 顯示在下載資料夾
gifgrep cats --download --reveal
```

---

## 擷取畫面

```bash
# 單張畫面
gifgrep still ./clip.gif --at 1.5s -o still.png

# 網格
gifgrep sheet ./clip.gif --frames 9 --cols 3 -o sheet.png
```

---

## 供應商

- `--source auto|tenor|giphy`
- `GIPHY_API_KEY` 必要時使用
