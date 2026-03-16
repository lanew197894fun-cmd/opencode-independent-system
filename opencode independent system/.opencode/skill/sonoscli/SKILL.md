---
name: sonoscli
description: Sonos 喇叭控制 - 發現/狀態/播放/音量/分組
homepage: https://sonoscli.sh
metadata:
  openclaw:
    emoji: "🔊"
    requires:
      bins: ["sonos"]
    install:
      - id: go
        kind: go
        module: github.com/steipete/sonoscli/cmd/sonos@latest
        bins: ["sonos"]
        label: "安裝 sonoscli (go)"
---

# Sonos 控制

使用 `sonos` 控制區域網路中的 Sonos 喇叭。

---

## 觸發關鍵字

| 關鍵字     | 動作     |
| ---------- | -------- |
| Sonos 播放 | 控制播放 |
| Sonos 音量 | 調整音量 |
| Sonos 列表 | 列出喇叭 |

---

## 快速開始

```bash
# 發現喇叭
sonos discover

# 狀態
sonos status --name "Kitchen"

# 播放控制
sonos play|pause|stop --name "Kitchen"

# 音量
sonos volume set 15 --name "Kitchen"
```

---

## 常用任務

```bash
# 分組
sonos group status|join|unjoin|party|solo

# 最愛
sonos favorites list|open

# 播放佇列
sonos queue list|play|clear

# Spotify 搜尋
sonos smapi search --service "Spotify" --category tracks "query"
```

---

## 故障排除

### SSDP 失敗

- 指定 `--ip <speaker-ip>`
- 或檢查本地網路權限

### Mac OS 本地網路權限

- 需啟用：設定 > 隱私權與安全性 > 本地網路
- 根據執行方式授權：
  - `node`（launchd）
  - `Terminal`（直接執行）
  - `VS Code`（VS Code 內）

---

## 注意事項

- Spotify Web API 搜尋可選，需 `SPOTIFY_CLIENT_ID/SECRET`
- 如有錯誤，查看疑難排除章節
