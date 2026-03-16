---
name: video-frames
description: 影片擷取畫面 - 使用 ffmpeg 提取畫面或短片
homepage: https://ffmpeg.org
metadata:
  openclaw:
    emoji: "🎞️"
    requires:
      bins: ["ffmpeg"]
    install:
      - id: brew
        kind: brew
        formula: ffmpeg
        bins: ["ffmpeg"]
        label: "安裝 ffmpeg (brew)"
---

# 影片畫面擷取

使用 ffmpeg 提取影片畫面。

---

## 觸發關鍵字

| 關鍵字   | 動作         |
| -------- | ------------ |
| 擷取畫面 | 提取影片畫面 |
| 影片截圖 | 取得幀       |

---

## 快速開始

```bash
# 第一幀
{baseDir}/scripts/frame.sh /path/to/video.mp4 --out /tmp/frame.jpg

# 指定時間
{baseDir}/scripts/frame.sh /path/to/video.mp4 --time 00:00:10 --out /tmp/frame-10s.jpg
```

---

## 提示

- 使用 `.jpg` 快速分享
- 使用 `.png` 清晰 UI 畫面
