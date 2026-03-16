---
name: openai-whisper
description: 本地語音轉文字 - 使用 Whisper CLI
homepage: https://openai.com/research/whisper
metadata:
  openclaw:
    emoji: "🎙️"
    requires:
      bins: ["whisper"]
    install:
      - id: brew
        kind: brew
        formula: openai-whisper
        bins: ["whisper"]
        label: "安裝 OpenAI Whisper (brew)"
---

# Whisper 語音轉文字

使用 `whisper` 本地轉錄音訊。

---

## 觸發關鍵字

| 關鍵字     | 動作     |
| ---------- | -------- |
| 語音轉文字 | 轉錄音訊 |
| 轉錄       | 語音辨識 |

---

## 快速開始

```bash
whisper /path/audio.mp3 --model medium --output_format txt --output_dir .
whisper /path/audio.m4a --task translate --output_format srt
```

---

## 提示

- 模型首次執行時下載到 `~/.cache/whisper`
- 預設使用 `turbo` 模型
- 小模型速度快，大模型精確度高
