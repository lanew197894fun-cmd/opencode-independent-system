---
name: blucli
description: BluOS CLI - 發現、播放、分組、音量控制
homepage: https://blucli.sh
metadata:
  openclaw:
    emoji: "🫐"
    requires:
      bins: ["blu"]
    install:
      - id: go
        kind: go
        module: github.com/steipete/blucli/cmd/blu@latest
        bins: ["blu"]
        label: "安裝 blucli (go)"
---

# BluOS 控制

使用 `blu` 控制 Bluesound/NAD 播放器。

---

## 觸發關鍵字

| 關鍵字   | 動作     |
| -------- | -------- |
| 播放音樂 | 控制播放 |
| 調整音量 | 設定音量 |
| 列表裝置 | 列出裝置 |

---

## 快速開始

```bash
# 列表裝置
blu devices

# 狀態
blu --device <id> status

# 播放控制
blu play|pause|stop

# 設定音量
blu volume set 15
```

---

## 目標選擇（優先順序）

1. `--device <id|name|alias>`
2. `BLU_DEVICE` 環境變數
3. 設定檔預設值

---

## 常用任務

```bash
# 分組
blu group status|add|remove

# TuneIn 搜尋/播放
blu tunein search "query"
blu tunein play "query"
```

---

## 注意事項

- 腳本使用 `--json`
- 變更播放前確認目標裝置
