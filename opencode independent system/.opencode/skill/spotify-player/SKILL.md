---
name: spotify-player
description: 終端機 Spotify 播放與搜尋 - 使用 spogo（優先）或 spotify_player
homepage: https://www.spotify.com
metadata:
  openclaw:
    emoji: "🎵"
    requires:
      anyBins: ["spogo", "spotify_player"]
    install:
      - id: brew
        kind: brew
        formula: spogo
        tap: steipete/tap
        bins: ["spogo"]
        label: "安裝 spogo (brew)"
      - id: brew
        kind: brew
        formula: spotify_player
        bins: ["spotify_player"]
        label: "安裝 spotify_player (brew)"
---

# Spotify 播放

使用 `spogo`（優先）或 `spotify_player` 控制 Spotify 播放與搜尋。

---

## 觸發關鍵字

| 關鍵字       | 動作     |
| ------------ | -------- |
| 播放 Spotify | 播放音樂 |
| 暫停 Spotify | 暫停播放 |
| 搜尋歌曲     | 搜尋曲目 |

---

## 需求

- Spotify Premium 帳戶
- 安裝 `spogo` 或 `spotify_player`

---

## 設定

```bash
# 匯入 Cookie
spogo auth import --browser chrome
```

---

## spogo 指令

| 指令                         | 動作     |
| ---------------------------- | -------- | -------- |
| `spogo search track "query"` | 搜尋     |
| `spogo play`                 | 播放     |
| `spogo pause`                | 暫停     |
| `spogo next`                 | 下一首   |
| `spogo prev`                 | 上一首   |
| `spogo device list`          | 列表裝置 |
| `spogo device set "<name     | id>"`    | 切換裝置 |
| `spogo status`               | 狀態     |

---

## spotify_player 指令（備用）

| 指令                            | 動作     |
| ------------------------------- | -------- |
| `spotify_player search "query"` | 搜尋     |
| `spotify_player playback play`  | 播放     |
| `spotify_player playback pause` | 暫停     |
| `spotify_player playback next`  | 下一首   |
| `spotify_player connect`        | 連線裝置 |
| `spotify_player like`           | 喜歡曲目 |

---

## 注意事項

- 設定資料夾：`~/.config/spotify-player`（如 `app.toml`）
- Spotify Connect 整合：在設定中加入 user `client_id`
- TUI 快捷鍵：在應用中按 `?` 查看
