---
name: summarize
description: 網址、本地檔案、YouTube 摘要
homepage: https://summarize.sh
metadata:
  openclaw:
    emoji: "🧾"
    requires:
      bins: ["summarize"]
    install:
      - id: brew
        kind: brew
        formula: steipete/tap/summarize
        bins: ["summarize"]
        label: "安裝 summarize (brew)"
---

# 摘要工具

快速摘要 URL、本地檔案、YouTube 連結。

---

## 觸發關鍵字

| 關鍵字   | 動作         |
| -------- | ------------ |
| 摘要     | 摘要內容     |
| 轉錄     | 轉錄 YouTube |
| 這個連結 | 取得摘要     |

---

## 快速開始

```bash
summarize "https://example.com" --model google/gemini-3-flash-preview
summarize "/path/to/file.pdf" --model google/gemini-3-flash-preview
summarize "https://youtu.be/dQw4w9WgXcQ" --youtube auto
```

---

## YouTube

### 轉錄

```bash
summarize "https://youtu.be/dQw4w9WgXcQ" --youtube auto --extract-only
```

---

## 模型設定

- OpenAI: `OPENAI_API_KEY`
- Anthropic: `ANTHROPIC_API_KEY`
- xAI: `XAI_API_KEY`
- Google: `GEMINI_API_KEY`

---

## 常用參數

- `--length short|medium|long|xl|xxl`
- `--extract-only`
- `--json`
- `--youtube auto`
